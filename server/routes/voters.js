const express = require('express');
const winston = require('winston');
const { body, query, param, validationResult } = require('express-validator');
const Voter = require('../models/Voter');
const AuditLog = require('../models/AuditLog');
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
    new winston.transports.File({ filename: 'logs/voters.log' }),
    new winston.transports.Console()
  ]
});

// Search voters by ID, name, or mobile
router.get('/search', 
  auth,
  [
    query('q').trim().isLength({ min: 1 }).withMessage('Search query is required'),
    query('type').optional().isIn(['id', 'name', 'mobile']).withMessage('Invalid search type'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer')
  ],
  validateInput,
  sanitizeInput,
  async (req, res) => {
    try {
      const { q, type = 'id', limit = 20, page = 1 } = req.query;
      const searchTerm = q.trim();
      const searchLimit = Math.min(parseInt(limit), 100);
      const skip = (parseInt(page) - 1) * searchLimit;

      let searchQuery = { isActive: true };
      let sortOptions = {};

      // Build search query based on type
      switch (type) {
        case 'id':
          searchQuery.voterId = new RegExp(searchTerm, 'i');
          sortOptions = { 
            // Exact matches first, then partial matches
            _id: searchTerm === searchQuery.voterId ? 1 : -1,
            voterId: 1 
          };
          break;
        
        case 'name':
          searchQuery.fullName = new RegExp(searchTerm, 'i');
          sortOptions = { fullName: 1 };
          break;
        
        case 'mobile':
          // Search in both registered and alternate mobile
          searchQuery.$or = [
            { registeredMobile: new RegExp(searchTerm) },
            { alternateMobile: new RegExp(searchTerm) }
          ];
          sortOptions = { registeredMobile: 1 };
          break;
        
        default:
          return res.status(400).json({ 
            success: false,
            error: 'Invalid search type. Use: id, name, or mobile' 
          });
      }

      // Perform search with pagination
      const [voters, totalCount] = await Promise.all([
        Voter.find(searchQuery)
          .select('voterId fullName dateOfBirth registeredMobile alternateMobile district pollingBooth isActive lastVerified verificationCount')
          .sort(sortOptions)
          .skip(skip)
          .limit(searchLimit)
          .lean(),
        Voter.countDocuments(searchQuery)
      ]);

      // Mask sensitive information
      const maskedVoters = voters.map(voter => ({
        ...voter,
        registeredMobile: voter.registeredMobile ? 
          voter.registeredMobile.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2') : null,
        alternateMobile: voter.alternateMobile ? 
          voter.alternateMobile.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2') : null,
        dateOfBirth: voter.dateOfBirth ? voter.dateOfBirth.toISOString().split('T')[0] : null
      }));

      // Log search activity
      logger.info('Voter search performed', {
        searchTerm,
        searchType: type,
        resultCount: voters.length,
        userId: req.user.id,
        boothId: req.user.boothId,
        ip: req.ip
      });

      res.json({
        success: true,
        data: {
          searchTerm,
          searchType: type,
          pagination: {
            page: parseInt(page),
            limit: searchLimit,
            total: totalCount,
            pages: Math.ceil(totalCount / searchLimit)
          },
          voters: maskedVoters
        }
      });

    } catch (error) {
      logger.error('Search voters error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        searchTerm: req.query.q
      });

      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Get voter by ID (for verification)
router.get('/:voterId',
  auth,
  [
    param('voterId').trim().isLength({ min: 1 }).withMessage('Voter ID is required'),
    query('includeAudit').optional().isBoolean().withMessage('includeAudit must be boolean'),
    query('includeHistory').optional().isBoolean().withMessage('includeHistory must be boolean')
  ],
  validateInput,
  async (req, res) => {
    try {
      const { voterId } = req.params;
      const { includeAudit = false, includeHistory = false } = req.query;      // Find voter with security checks
      const voter = await Voter.findOne({ 
        voterId: voterId,
        isActive: true 
      });

      if (!voter) {
        return res.status(404).json({ 
          success: false,
          error: 'Voter not found or inactive',
          voterId 
        });
      }

      // Check if user has permission to view this voter
      // Booth users can only view voters from their booth
      if (req.user.role === 'booth' && voter.pollingBooth !== req.user.boothId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Voter not in your polling booth'
        });
      }

      // Prepare base response with masked sensitive data
      const voterData = {
        voterId: voter.voterId,
        fullName: voter.fullName,
        dateOfBirth: voter.dateOfBirth ? voter.dateOfBirth.toISOString().split('T')[0] : null,
        registeredMobile: voter.registeredMobile ? 
          voter.registeredMobile.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2') : null,
        alternateMobile: voter.alternateMobile ? 
          voter.alternateMobile.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2') : null,
        district: voter.district,
        pollingBooth: voter.pollingBooth,
        isActive: voter.isActive,
        lastVerified: voter.lastVerified,
        verificationCount: voter.verificationCount,
        createdAt: voter.createdAt
      };

      // Include recent audit history if requested and user has permission
      if (includeAudit === 'true' && ['admin', 'supervisor'].includes(req.user.role)) {
        const auditLogs = await AuditLog.find({ voterId })
          .select('verificationMethod verificationResult timestamp boothId operatorId ipAddress')
          .sort({ timestamp: -1 })
          .limit(10)
          .lean();
        
        voterData.recentAuditLogs = auditLogs;
      }

      // Include verification history if requested
      if (includeHistory === 'true' && ['admin', 'supervisor'].includes(req.user.role)) {
        const verificationHistory = await AuditLog.aggregate([
          { $match: { voterId } },
          { 
            $group: {
              _id: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                result: "$verificationResult"
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { "_id.date": -1 } },
          { $limit: 30 }
        ]);
        
        voterData.verificationHistory = verificationHistory;
      }

      // Log access
      logger.info('Voter details accessed', {
        voterId,
        userId: req.user.id,
        userRole: req.user.role,
        boothId: req.user.boothId,
        ip: req.ip,
        includeAudit,
        includeHistory
      });

      res.json({
        success: true,
        data: voterData
      });

    } catch (error) {
      logger.error('Get voter error', {
        error: error.message,
        stack: error.stack,
        voterId: req.params.voterId,
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

// Verify voter eligibility (pre-verification check)
router.post('/:voterId/check-eligibility',
  auth,
  boothAuth,
  [
    param('voterId').trim().isLength({ min: 1 }).withMessage('Voter ID is required'),
    body('boothId').trim().isLength({ min: 1 }).withMessage('Booth ID is required')
  ],
  validateInput,
  async (req, res) => {
    try {
      const { voterId } = req.params;
      const { boothId } = req.body;

      // Find voter
      const voter = await Voter.findOne({ voterId });

      if (!voter) {
        return res.json({
          eligible: false,
          reason: 'VOTER_NOT_FOUND',
          message: 'Voter ID not found in database'
        });
      }

      if (!voter.isActive) {
        return res.json({
          eligible: false,
          reason: 'VOTER_INACTIVE',
          message: 'Voter is marked as inactive'
        });
      }

      // Check for recent successful verification (prevent double voting)
      const recentVerification = await AuditLog.findOne({
        voterId,
        verificationResult: 'SUCCESS',
        timestamp: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).sort({ timestamp: -1 });

      if (recentVerification) {
        return res.json({
          eligible: false,
          reason: 'ALREADY_VERIFIED',
          message: 'Voter already verified within the last 24 hours',
          lastVerification: {
            timestamp: recentVerification.timestamp,
            boothId: recentVerification.boothId,
            method: recentVerification.verificationMethod
          }
        });
      }

      // Check booth assignment (optional warning)
      const response = {
        eligible: true,
        voter: {
          voterId: voter.voterId,
          fullName: voter.fullName,
          district: voter.district,
          pollingBooth: voter.pollingBooth,
          registeredMobile: voter.registeredMobile ? 
            voter.registeredMobile.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2') : null
        },
        message: 'Voter is eligible for verification'
      };

      if (voter.pollingBooth && voter.pollingBooth !== boothId) {
        response.warning = true;
        response.reason = 'DIFFERENT_BOOTH';
        response.message = `Voter is assigned to booth ${voter.pollingBooth} but attempting verification at ${boothId}`;
        response.assignedBooth = voter.pollingBooth;
        response.currentBooth = boothId;
      }

      // Log eligibility check
      logger.info('Voter eligibility checked', {
        voterId,
        boothId,
        eligible: response.eligible,
        warning: response.warning,
        userId: req.user.id,
        ip: req.ip
      });

      res.json(response);

    } catch (error) {
      logger.error('Check eligibility error', {
        error: error.message,
        stack: error.stack,
        voterId: req.params.voterId,
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

// Get voter statistics (admin/supervisor only)
router.get('/stats/overview',
  auth,
  authorize(['admin', 'supervisor']),
  async (req, res) => {
    try {
      const { district, boothId, startDate, endDate } = req.query;

      // Build base query
      let matchQuery = { isActive: true };
      if (district) matchQuery.district = district;
      if (boothId) matchQuery.pollingBooth = boothId;

      // Get basic voter statistics
      const [
        totalVoters,
        activeVoters,
        verifiedToday,
        verificationStats
      ] = await Promise.all([
        Voter.countDocuments(matchQuery),
        Voter.countDocuments({ ...matchQuery, isActive: true }),
        AuditLog.countDocuments({
          timestamp: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999))
          },
          verificationResult: 'SUCCESS'
        }),
        AuditLog.aggregate([
          {
            $match: {
              timestamp: startDate && endDate ? {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              } : {
                $gte: new Date(new Date().setHours(0, 0, 0, 0))
              }
            }
          },
          {
            $group: {
              _id: "$verificationResult",
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      // Get district-wise breakdown
      const districtStats = await Voter.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: "$district",
            totalVoters: { $sum: 1 },
            activeVoters: {
              $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
            }
          }
        },
        { $sort: { totalVoters: -1 } }
      ]);

      // Get booth-wise breakdown
      const boothStats = await Voter.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: "$pollingBooth",
            totalVoters: { $sum: 1 },
            averageVerifications: { $avg: "$verificationCount" }
          }
        },
        { $sort: { totalVoters: -1 } },
        { $limit: 20 }
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            totalVoters,
            activeVoters,
            verifiedToday,
            inactiveVoters: totalVoters - activeVoters
          },
          verificationStats,
          districtStats,
          boothStats,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Get voter statistics error', {
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

// Bulk update voters (admin only)
router.patch('/bulk-update',
  auth,
  authorize(['admin']),
  [
    body('voterIds').isArray({ min: 1 }).withMessage('Voter IDs array is required'),
    body('updates').isObject().withMessage('Updates object is required'),
    body('reason').trim().isLength({ min: 1 }).withMessage('Reason is required for bulk updates')
  ],
  validateInput,
  async (req, res) => {
    try {
      const { voterIds, updates, reason } = req.body;
      
      // Validate update fields
      const allowedFields = ['isActive', 'district', 'pollingBooth'];
      const updateFields = Object.keys(updates);
      const invalidFields = updateFields.filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid update fields: ${invalidFields.join(', ')}`
        });
      }

      // Perform bulk update
      const result = await Voter.updateMany(
        { voterId: { $in: voterIds } },
        { 
          ...updates,
          updatedAt: new Date(),
          updatedBy: req.user.id
        }
      );

      // Log bulk update
      await AuditLog.create({
        action: 'BULK_UPDATE',
        targetType: 'VOTER',
        targetIds: voterIds,
        changes: updates,
        reason,
        operatorId: req.user.id,
        boothId: req.user.boothId,
        ipAddress: req.ip,
        timestamp: new Date()
      });

      logger.info('Bulk voter update performed', {
        voterIds,
        updates,
        reason,
        modifiedCount: result.modifiedCount,
        userId: req.user.id,
        ip: req.ip
      });

      res.json({
        success: true,
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          reason
        }
      });

    } catch (error) {
      logger.error('Bulk update voters error', {
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

// Export voter data (admin/supervisor only)
router.get('/export/:format',
  auth,
  authorize(['admin', 'supervisor']),
  [
    param('format').isIn(['csv', 'json']).withMessage('Format must be csv or json'),
    query('district').optional().trim(),
    query('boothId').optional().trim(),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],
  validateInput,
  async (req, res) => {
    try {
      const { format } = req.params;
      const { district, boothId, startDate, endDate, includeInactive = false } = req.query;

      // Build query
      let query = {};
      if (!includeInactive) query.isActive = true;
      if (district) query.district = district;
      if (boothId) query.pollingBooth = boothId;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // Get voters with limited sensitive data
      const voters = await Voter.find(query)
        .select('voterId fullName district pollingBooth isActive verificationCount lastVerified createdAt')
        .sort({ voterId: 1 })
        .lean();

      // Log export activity
      logger.info('Voter data export', {
        format,
        filters: { district, boothId, startDate, endDate },
        recordCount: voters.length,
        userId: req.user.id,
        ip: req.ip
      });

      if (format === 'csv') {
        const csv = [
          'Voter ID,Full Name,District,Polling Booth,Active,Verification Count,Last Verified,Created At',
          ...voters.map(v => [
            v.voterId,
            v.fullName,
            v.district,
            v.pollingBooth,
            v.isActive,
            v.verificationCount || 0,
            v.lastVerified ? v.lastVerified.toISOString() : '',
            v.createdAt.toISOString()
          ].join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="voters-export-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
      } else {
        res.json({
          success: true,
          data: {
            exportDate: new Date().toISOString(),
            filters: { district, boothId, startDate, endDate },
            totalRecords: voters.length,
            voters
          }
        });
      }

    } catch (error) {
      logger.error('Export voters error', {
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
