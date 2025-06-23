const mongoose = require('mongoose');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

let isConnected = false;

async function createIndexes() {
  try {
    if (!isConnected || !mongoose.connection.db) {
      logger.warn('Skipping index creation - no database connection');
      return;
    }

    const User = require('../models/User');
    const Voter = require('../models/Voter');
    const AuditLog = require('../models/AuditLog');
    const VerificationSession = require('../models/VerificationSession');

    // Create indexes for better performance
    await User.createIndexes();
    await Voter.createIndexes();
    await AuditLog.createIndexes();
    await VerificationSession.createIndexes();

    logger.info('📋 Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
}

async function initializeDatabase() {
  try {
    if (isConnected) {
      logger.info('Database already connected');
      return;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastverify';
    
    // Try Atlas first, fallback to local if needed
    const connectionOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    try {
      await mongoose.connect(mongoUri, connectionOptions);
      logger.info('🍃 Connected to MongoDB database');
    } catch (atlasError) {
      logger.warn('Failed to connect to Atlas, trying local MongoDB...', { error: atlasError.message });
      
      // Fallback to local MongoDB
      const localUri = 'mongodb://localhost:27017/fastverify';
      await mongoose.connect(localUri, connectionOptions);
      logger.info('🍃 Connected to local MongoDB database');
    }

    isConnected = true;

    // Set up connection event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });    // Create indexes for better performance
    if (isConnected) {
      await createIndexes();
      logger.info('✅ Database initialization completed');
    } else {
      logger.warn('⚠️ Database initialization completed without connection');
    }
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { 
      error: error.message,
      stack: error.stack 
    });
    // Don't throw error, let the application continue
    isConnected = false;
  }
}

async function closeDatabase() {
  try {
    if (isConnected) {
      await mongoose.connection.close();
      isConnected = false;
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
}

function getConnection() {
  return mongoose.connection;
}

function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectToDatabase: initializeDatabase,
  closeDatabase,
  getConnection,
  isDbConnected,
  createIndexes
};


