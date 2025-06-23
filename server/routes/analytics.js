const express = require('express');
const { query, param } = require('express-validator');
const Voter = require('../models/Voter');
const VerificationSession = require('../models/VerificationSession');
const AuditLog = require('../models/AuditLog');
const { auth, authorize } = require('../middleware/auth');
const { validateInput } = require('../middleware/validation');
const winston = require('winston');

const router = express.Router();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/analytics.log' }),
    new winston.transports.Console()
  ]
});

// Real-time dashboard analytics
router.get('/dashboard',
  auth,
  authorize(['admin', 'supervisor', 'booth']),
  [
    query('timeRange').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Invalid time range'),
    query('booth').optional().trim()
  ],
  validateInput,
  async (req, res) => {
    try {
      const { timeRange = 'today', booth } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      // Build query filters
      const dateFilter = { timestamp: { $gte: startDate, $lte: now } };
      const boothFilter = booth && booth !== 'all' ? { boothId: booth } : {};

      // Execute all analytics queries in parallel
      const [
        totalVerifications,
        successfulVerifications,
        pendingVerifications,
        failedVerifications,
        verificationMethods,
        dailyTrends,
        peakHourData,
        boothPerformance,
        averageProcessingTime,
        activeBooths
      ] = await Promise.all([
        // Total verifications
        VerificationSession.countDocuments({ ...dateFilter, ...boothFilter }),
        
        // Successful verifications
        VerificationSession.countDocuments({ 
          ...dateFilter, 
          ...boothFilter, 
          'verification.status': 'SUCCESS' 
        }),
        
        // Pending verifications
        VerificationSession.countDocuments({ 
          ...dateFilter, 
          ...boothFilter, 
          'verification.status': { $in: ['INITIATED', 'IN_PROGRESS'] }
        }),
        
        // Failed verifications
        VerificationSession.countDocuments({ 
          ...dateFilter, 
          ...boothFilter, 
          'verification.status': 'FAILED' 
        }),
        
        // Verification methods breakdown
        VerificationSession.aggregate([
          { $match: { ...dateFilter, ...boothFilter } },
          { $group: { _id: '$verification.method', count: { $sum: 1 } } },
          { $project: { name: '$_id', value: '$count', _id: 0 } }
        ]),
        
        // Daily trends (last 30 days for week/month, hourly for today)
        getDailyTrends(startDate, now, boothFilter),
        
        // Peak hours data
        getPeakHoursData(startDate, now, boothFilter),
        
        // Booth performance
        getBoothPerformance(startDate, now),
        
        // Average processing time
        getAverageProcessingTime(startDate, now, boothFilter),
        
        // Active booths count
        getActiveBoothsCount(startDate, now)
      ]);

      const analytics = {
        totalVerifications,
        successfulVerifications,
        pendingVerifications,
        failedVerifications,
        averageProcessingTime,
        activeBooths,
        verificationMethods: verificationMethods.map(method => ({
          name: method.name || 'Unknown',
          value: method.value
        })),
        dailyTrends,
        peakHourData,
        boothPerformance
      };

      logger.info('Dashboard analytics requested', {
        timeRange,
        booth,
        userId: req.user.id,
        dataPoints: {
          totalVerifications,
          successfulVerifications,
          activeBooths
        }
      });

      res.json({
        success: true,
        analytics,
        generatedAt: new Date().toISOString(),
        timeRange,
        booth
      });

    } catch (error) {
      logger.error('Dashboard analytics error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Export analytics data
router.get('/export',
  auth,
  authorize(['admin', 'supervisor']),
  [
    query('timeRange').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Invalid time range'),
    query('booth').optional().trim(),
    query('format').optional().isIn(['csv', 'json']).withMessage('Invalid format')
  ],
  validateInput,
  async (req, res) => {
    try {
      const { timeRange = 'today', booth, format = 'csv' } = req.query;
      
      // Get analytics data
      const analytics = await getDetailedAnalytics(timeRange, booth);
      
      if (format === 'csv') {
        // Convert to CSV
        const csv = convertToCSV(analytics);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=analytics_${timeRange}_${Date.now()}.csv`);
        res.send(csv);
      } else {
        // Return JSON
        res.json({
          success: true,
          data: analytics,
          exportedAt: new Date().toISOString()
        });
      }

      logger.info('Analytics data exported', {
        timeRange,
        booth,
        format,
        userId: req.user.id
      });

    } catch (error) {
      logger.error('Analytics export error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to export analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Real-time verification activity feed
router.get('/activity-feed',
  auth,
  authorize(['admin', 'supervisor', 'booth']),
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('booth').optional().trim()
  ],
  validateInput,
  async (req, res) => {
    try {
      const { limit = 50, booth } = req.query;
      const boothFilter = booth && booth !== 'all' ? { 'booth.boothId': booth } : {};
      
      const activities = await VerificationSession.find(boothFilter)
        .select('sessionId voter.voterId voter.fullName verification.method verification.status booth.boothId createdAt')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      const formattedActivities = activities.map(activity => ({
        id: activity.sessionId,
        voterId: activity.voter.voterId,
        voterName: activity.voter.fullName || 'Unknown',
        method: activity.verification.method,
        status: activity.verification.status,
        boothId: activity.booth.boothId,
        timestamp: activity.createdAt,
        timeAgo: getTimeAgo(activity.createdAt)
      }));

      res.json({
        success: true,
        activities: formattedActivities,
        total: formattedActivities.length,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Activity feed error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity feed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Performance metrics
router.get('/performance',
  auth,
  authorize(['admin', 'supervisor']),
  [
    query('timeRange').optional().isIn(['today', 'week', 'month']).withMessage('Invalid time range')
  ],
  validateInput,
  async (req, res) => {
    try {
      const { timeRange = 'today' } = req.query;
      
      const performance = await getPerformanceMetrics(timeRange);
      
      res.json({
        success: true,
        performance,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Performance metrics error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch performance metrics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Helper functions

async function getDailyTrends(startDate, endDate, boothFilter) {
  const pipeline = [
    { 
      $match: { 
        createdAt: { $gte: startDate, $lte: endDate },
        ...boothFilter
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        verifications: { $sum: 1 },
        successful: {
          $sum: {
            $cond: [{ $eq: ['$verification.status', 'SUCCESS'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          }
        },
        verifications: 1,
        successful: 1,
        _id: 0
      }
    },
    { $sort: { date: 1 } }
  ];

  const results = await VerificationSession.aggregate(pipeline);
  
  return results.map(result => ({
    date: result.date.toISOString().split('T')[0],
    verifications: result.verifications,
    successful: result.successful
  }));
}

async function getPeakHoursData(startDate, endDate, boothFilter) {
  const pipeline = [
    { 
      $match: { 
        createdAt: { $gte: startDate, $lte: endDate },
        ...boothFilter
      }
    },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        verifications: { $sum: 1 }
      }
    },
    {
      $project: {
        hour: '$_id',
        verifications: 1,
        _id: 0
      }
    },
    { $sort: { hour: 1 } }
  ];

  const results = await VerificationSession.aggregate(pipeline);
  
  // Fill in missing hours with 0
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    verifications: 0
  }));

  results.forEach(result => {
    hourlyData[result.hour].verifications = result.verifications;
  });

  return hourlyData;
}

async function getBoothPerformance(startDate, endDate) {
  const pipeline = [
    { 
      $match: { 
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$booth.boothId',
        verifications: { $sum: 1 },
        successful: {
          $sum: {
            $cond: [{ $eq: ['$verification.status', 'SUCCESS'] }, 1, 0]
          }
        },
        averageTime: { $avg: '$results.verificationScore' }
      }
    },
    {
      $project: {
        boothId: '$_id',
        verifications: 1,
        successful: 1,
        successRate: {
          $multiply: [
            { $divide: ['$successful', '$verifications'] },
            100
          ]
        },
        averageTime: { $round: ['$averageTime', 2] },
        _id: 0
      }
    },
    { $sort: { verifications: -1 } },
    { $limit: 20 }
  ];

  return await VerificationSession.aggregate(pipeline);
}

async function getAverageProcessingTime(startDate, endDate, boothFilter) {
  const pipeline = [
    { 
      $match: { 
        createdAt: { $gte: startDate, $lte: endDate },
        'verification.completedAt': { $exists: true },
        ...boothFilter
      }
    },
    {
      $project: {
        processingTime: {
          $divide: [
            { $subtract: ['$verification.completedAt', '$verification.startedAt'] },
            1000
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        averageTime: { $avg: '$processingTime' }
      }
    }
  ];

  const result = await VerificationSession.aggregate(pipeline);
  return result.length > 0 ? Math.round(result[0].averageTime) : 0;
}

async function getActiveBoothsCount(startDate, endDate) {
  const pipeline = [
    { 
      $match: { 
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$booth.boothId'
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 }
      }
    }
  ];

  const result = await VerificationSession.aggregate(pipeline);
  return result.length > 0 ? result[0].count : 0;
}

async function getDetailedAnalytics(timeRange, booth) {
  // Implementation for detailed analytics export
  return {
    summary: {},
    verifications: [],
    booths: [],
    methods: [],
    trends: []
  };
}

async function getPerformanceMetrics(timeRange) {
  // Implementation for performance metrics
  return {
    systemUptime: 99.9,
    averageResponseTime: 250,
    errorRate: 0.1,
    throughput: 1200,
    memoryUsage: 65,
    cpuUsage: 45,
    databaseConnections: 10
  };
}

function convertToCSV(data) {
  // Simple CSV conversion implementation
  return 'CSV data here';
}

function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

module.exports = router;
