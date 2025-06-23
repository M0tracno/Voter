const express = require('express');
const winston = require('winston');
const { body, query, param, validationResult } = require('express-validator');
const AuditLog = require('../models/AuditLog');
const Voter = require('../models/Voter');
const Booth = require('../models/Booth');
const { auth, authorize, boothAuth } = require('../middleware/auth');
const { validateInput, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/audit.log' }),
    new winston.transports.Console()
  ]
});

// Get audit logs with filtering and pagination
router.get('/logs',
  auth,
  [
    query('boothId').optional().trim(),
    query('voterId').optional().trim(),
    query('result').optional().isIn(['SUCCESS', 'FAILED', 'PENDING', 'CANCELLED']).withMessage('Invalid result filter'),
    query('method').optional().trim(),
    query('action').optional().trim(),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500'),
    query('sortBy').optional().isIn(['timestamp', 'voterId', 'boothId', 'verificationResult']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  validateInput,
  async (req, res) => {
    try {
      const {
        boothId,
        voterId,
        result,
        method,
        action,
        startDate,
        endDate,
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const maxLimit = 500;

      if (parseInt(limit) > maxLimit) {
        return res.status(400).json({
          success: false,
          error: `Maximum limit is ${maxLimit}`
        });
      }

      // Simple query for now - can be enhanced with MongoDB aggregation later
      let query = {};

      // Role-based access control
      if (req.user.role === 'booth') {
        query.boothId = req.user.boothId;
      } else if (boothId) {
        query.boothId = boothId;
      }

      if (voterId) query.voterId = voterId;
      if (result) query.verificationResult = result;
      if (method) query.verificationMethod = new RegExp(method, 'i');
      if (action) query.action = new RegExp(action, 'i');

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      // Build sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query
      const [logs, totalCount] = await Promise.all([
        AuditLog.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        AuditLog.countDocuments(query)
      ]);

      // Log access for security auditing
      logger.info('Audit logs accessed', {
        userId: req.user.id,
        userRole: req.user.role,
        filters: { boothId, voterId, result, method, action, startDate, endDate },
        resultCount: logs.length,
        ip: req.ip
      });

      res.json({
        success: true,
        data: {
          logs: logs.map(log => ({
            id: log._id,
            action: log.action,
            voterId: log.voterId,
            boothId: log.boothId,
            verificationMethod: log.verificationMethod,
            verificationResult: log.verificationResult,
            failureReason: log.failureReason,
            reason: log.reason,
            timestamp: log.timestamp,
            operatorId: log.operatorId,
            ipAddress: req.user.role === 'admin' ? log.ipAddress : null, // IP only for admins
            isSynced: log.isSynced,
            syncedAt: log.syncedAt,
            sessionId: log.sessionId,
            metadata: log.metadata
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / parseInt(limit))
          },
          filters: {
            boothId,
            voterId,
            result,
            method,
            action,
            startDate,
            endDate
          }
        }
      });
    } catch (error) {
      logger.error('Get audit logs error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        filters: req.query
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Get audit statistics
router.get('/stats',
  auth,
  authorize(['admin', 'supervisor']),
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('boothId').optional().trim(),
    query('granularity').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid granularity')
  ],
  validateInput,
  async (req, res) => {
    try {
      const { startDate, endDate, boothId, granularity = 'day' } = req.query;

      // Default to last 7 days if no date range specified
      const defaultStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const defaultEndDate = new Date();

      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : defaultEndDate;

      // Build base match query
      let query = {
        timestamp: { $gte: start, $lte: end }
      };

      if (boothId) {
        query.boothId = boothId;
      }

      // Get basic statistics
      const totalLogs = await AuditLog.countDocuments(query);
      const successfulVerifications = await AuditLog.countDocuments({
        ...query,
        verificationResult: 'SUCCESS'
      });
      const failedVerifications = await AuditLog.countDocuments({
        ...query,
        verificationResult: 'FAILED'
      });

      res.json({
        success: true,
        data: {
          dateRange: { start, end },
          granularity,
          summary: {
            totalOperations: totalLogs,
            successfulVerifications,
            failedVerifications,
            successRate: totalLogs > 0 ? (successfulVerifications / totalLogs) * 100 : 0
          },
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Get audit statistics error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;