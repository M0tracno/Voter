const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const winston = require('winston');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const voterRoutes = require('./routes/voters');
const verificationRoutes = require('./routes/verification');
const syncRoutes = require('./routes/sync');
const auditRoutes = require('./routes/audit');
// Import new routes
const aiVerificationRoutes = require('./routes/ai-verification');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
});

// Different rate limits for different endpoints
const generalLimiter = createRateLimit(15 * 60 * 1000, 100, 'Too many requests from this IP');
const authLimiter = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts');
const verificationLimiter = createRateLimit(15 * 60 * 1000, 20, 'Too many verification attempts');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression());
app.use(mongoSanitize());
app.use(hpp());

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? (process.env.ALLOWED_ORIGINS || '').split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Apply rate limiting
app.use(generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/verification', verificationLimiter);

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/voters', voterRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/sync', syncRoutes);
// New AI and Analytics routes
app.use('/api/verification', aiVerificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint (also under /api for client compatibility)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage()
  });
});

// Version check endpoint
app.get('/api/version', (req, res) => {
  res.json({
    version: process.env.npm_package_version || '2.0.0',
    minimumClientVersion: process.env.MINIMUM_CLIENT_VERSION || '2.0.0',
    updateRequired: false,
    downloadUrl: process.env.CLIENT_DOWNLOAD_URL || null,
    features: {
      otpVerification: true,
      biometricAuth: false,
      realTimeSync: true,
      analytics: true
    }
  });
});

// API documentation endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/docs', (req, res) => {
    res.json({
      title: 'FastVerify API Documentation',
      version: '2.0.0',
      baseUrl: `${req.protocol}://${req.get('host')}/api`,
      endpoints: {
        auth: {
          'POST /auth/login': 'User login',
          'POST /auth/logout': 'User logout',
          'POST /auth/refresh': 'Refresh access token',
          'GET /auth/profile': 'Get user profile',
          'PUT /auth/profile': 'Update user profile'
        },
        voters: {
          'GET /voters/search': 'Search voters',
          'GET /voters/:voterId': 'Get voter details',
          'GET /voters/stats/overview': 'Get voter statistics'
        },
        verification: {
          'POST /verification/send-otp': 'Send OTP for verification',
          'POST /verification/verify-otp': 'Verify OTP',
          'POST /verification/manual-verify': 'Manual verification'
        },
        sync: {
          'POST /sync/audit-logs': 'Sync audit logs',
          'GET /sync/status/:boothId': 'Get sync status'
        },
        audit: {
          'GET /audit/logs': 'Get audit logs',
          'GET /audit/stats': 'Get audit statistics',
          'GET /audit/export/:format': 'Export audit data'
        }
      }
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Application Error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid JSON payload' 
    });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn('404 Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Initialize database and start server
const { connectToDatabase } = require('./database/init');

async function startServer() {
  try {
    // Try to connect to MongoDB (don't fail if it doesn't work)
    try {
      await connectToDatabase();
      logger.info('MongoDB connected successfully');
    } catch (dbError) {
      logger.warn('Failed to connect to MongoDB, continuing without database', {
        error: dbError.message
      });
    }

    // Start the server regardless of database status
    const server = app.listen(PORT, () => {
      logger.info(`FastVerify server started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Close database connection
          const mongoose = require('mongoose');
          await mongoose.connection.close();
          logger.info('Database connection closed');
          
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error: error.message });
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason: reason,
        promise: promise
      });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
