const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `AL_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'VOTER_SEARCH',
      'VOTER_VERIFICATION',
      'VOTER_CREATE',
      'VOTER_UPDATE',
      'VOTER_DELETE',
      'VOTER_BLOCK',
      'VOTER_UNBLOCK',
      'OTP_GENERATE',
      'OTP_VERIFY',
      'FACE_VERIFY',
      'MANUAL_VERIFY',
      'BULK_IMPORT',
      'DATA_EXPORT',
      'SETTINGS_UPDATE',
      'USER_CREATE',
      'USER_UPDATE',
      'USER_DELETE',
      'PERMISSION_CHANGE',
      'SYSTEM_CONFIG',
      'DATABASE_BACKUP',
      'DATABASE_RESTORE',
      'API_ACCESS',
      'SECURITY_ALERT',
      'ERROR_OCCURRED'
    ]
  },
  entity: {
    type: {
      type: String,
      enum: ['USER', 'VOTER', 'SYSTEM', 'API', 'DATABASE'],
      required: true
    },
    id: {
      type: String, // Can be ObjectId, voter ID, or system identifier
      required: true
    },
    name: String // Display name for the entity
  },
  actor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function() {
        return this.actor.type === 'USER';
      }
    },
    type: {
      type: String,
      enum: ['USER', 'SYSTEM', 'API', 'SCHEDULER'],
      required: true,
      default: 'USER'
    },
    name: String,
    ipAddress: String,
    userAgent: String,
    sessionId: String
  },
  details: {
    description: {
      type: String,
      required: true,
      maxlength: 1000
    },
    method: String, // HTTP method for API calls
    endpoint: String, // API endpoint accessed
    requestId: String, // Unique request identifier
    oldValues: mongoose.Schema.Types.Mixed, // Previous state (for updates)
    newValues: mongoose.Schema.Types.Mixed, // New state (for updates)
    searchQuery: String, // For search operations
    filters: mongoose.Schema.Types.Mixed, // Applied filters
    resultCount: Number, // Number of results returned
    duration: Number, // Operation duration in milliseconds
    metadata: mongoose.Schema.Types.Mixed // Additional context-specific data
  },
  result: {
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'ERROR', 'WARNING'],
      required: true
    },
    message: String,
    errorCode: String,
    errorDetails: mongoose.Schema.Types.Mixed
  },
  impact: {
    level: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW'
    },
    affectedRecords: {
      type: Number,
      default: 0
    },
    dataModified: {
      type: Boolean,
      default: false
    }
  },
  context: {
    environment: {
      type: String,
      enum: ['DEVELOPMENT', 'STAGING', 'PRODUCTION'],
      default: process.env.NODE_ENV?.toUpperCase() || 'DEVELOPMENT'
    },
    version: String,
    feature: String, // Feature/module where action occurred
    workflow: String, // Business workflow context
    correlationId: String, // For tracking related operations
    parentLogId: String // For hierarchical logging
  },
  compliance: {
    gdprRelevant: {
      type: Boolean,
      default: false
    },
    dataRetentionDays: {
      type: Number,
      default: 2555 // 7 years default
    },
    complianceFlags: [String], // e.g., ['GDPR', 'SOX', 'HIPAA']
    sensitivityLevel: {
      type: String,
      enum: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'],
      default: 'INTERNAL'
    }
  },
  sync: {
    isSynced: {
      type: Boolean,
      default: false
    },
    syncedAt: Date,
    syncVersion: {
      type: Number,
      default: 1
    },
    syncErrors: [{
      error: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      retryCount: {
        type: Number,
        default: 0
      }
    }]
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for performance and querying (logId already has unique index from schema)
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ 'entity.type': 1, 'entity.id': 1 });
auditLogSchema.index({ 'actor.userId': 1 });
auditLogSchema.index({ 'actor.type': 1 });
auditLogSchema.index({ 'result.status': 1 });
auditLogSchema.index({ 'impact.level': 1 });
auditLogSchema.index({ updatedAt: 1 });
auditLogSchema.index({ 'sync.isSynced': 1 });

// Compound indexes for common queries
auditLogSchema.index({ 'entity.id': 1, createdAt: -1 });
auditLogSchema.index({ 'actor.userId': 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ 'result.status': 1, createdAt: -1 });

// Text index for search functionality
auditLogSchema.index({
  'details.description': 'text',
  'details.searchQuery': 'text',
  'result.message': 'text'
});

// TTL index for automatic cleanup based on retention policy
auditLogSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 0, // Will be calculated based on compliance.dataRetentionDays
    partialFilterExpression: { 'compliance.dataRetentionDays': { $exists: true } }
  }
);

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toISOString();
});

// Virtual for human-readable action
auditLogSchema.virtual('actionDescription').get(function() {
  const actionMap = {
    'LOGIN': 'User logged in',
    'LOGOUT': 'User logged out',
    'VOTER_SEARCH': 'Searched for voters',
    'VOTER_VERIFICATION': 'Verified voter',
    'VOTER_CREATE': 'Created new voter',
    'VOTER_UPDATE': 'Updated voter information',
    'VOTER_DELETE': 'Deleted voter',
    'VOTER_BLOCK': 'Blocked voter',
    'VOTER_UNBLOCK': 'Unblocked voter',
    'OTP_GENERATE': 'Generated OTP',
    'OTP_VERIFY': 'Verified OTP',
    'FACE_VERIFY': 'Performed face verification',
    'MANUAL_VERIFY': 'Performed manual verification',
    'BULK_IMPORT': 'Imported bulk data',
    'DATA_EXPORT': 'Exported data',
    'SETTINGS_UPDATE': 'Updated settings',
    'USER_CREATE': 'Created new user',
    'USER_UPDATE': 'Updated user',
    'USER_DELETE': 'Deleted user',
    'PERMISSION_CHANGE': 'Changed permissions',
    'SYSTEM_CONFIG': 'Updated system configuration',
    'DATABASE_BACKUP': 'Created database backup',
    'DATABASE_RESTORE': 'Restored database',
    'API_ACCESS': 'Accessed API',
    'SECURITY_ALERT': 'Security alert triggered',
    'ERROR_OCCURRED': 'Error occurred'
  };
  
  return actionMap[this.action] || this.action;
});

// Pre-save middleware
auditLogSchema.pre('save', function(next) {
  // Set TTL based on retention policy
  if (this.compliance.dataRetentionDays) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.compliance.dataRetentionDays);
    this.set('expiresAt', expiryDate);
  }
  
  // Auto-generate correlation ID if not provided
  if (!this.context.correlationId) {
    this.context.correlationId = `CORR_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
  
  next();
});

// Static method to log an action
auditLogSchema.statics.logAction = async function(actionData) {
  try {
    const log = new this(actionData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main operation
    return null;
  }
};

// Static method to log user action
auditLogSchema.statics.logUserAction = async function(user, action, entity, details, result = { status: 'SUCCESS' }) {
  const actionData = {
    action,
    entity,
    actor: {
      userId: user._id,
      type: 'USER',
      name: user.fullName,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      sessionId: details.sessionId
    },
    details: {
      description: details.description,
      ...details
    },
    result,
    impact: details.impact || { level: 'LOW' },
    context: details.context || {}
  };
  
  return this.logAction(actionData);
};

// Static method to log system action
auditLogSchema.statics.logSystemAction = async function(action, entity, details, result = { status: 'SUCCESS' }) {
  const actionData = {
    action,
    entity,
    actor: {
      type: 'SYSTEM',
      name: 'System'
    },
    details,
    result,
    impact: details.impact || { level: 'LOW' },
    context: details.context || {}
  };
  
  return this.logAction(actionData);
};

// Static method to log API access
auditLogSchema.statics.logApiAccess = async function(req, result, details = {}) {
  const actionData = {
    action: 'API_ACCESS',
    entity: {
      type: 'API',
      id: req.path,
      name: `${req.method} ${req.path}`
    },
    actor: {
      userId: req.user?._id,
      type: req.user ? 'USER' : 'API',
      name: req.user?.fullName || 'Anonymous',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionId
    },
    details: {
      description: `API ${req.method} ${req.path}`,
      method: req.method,
      endpoint: req.path,
      requestId: req.id,
      duration: details.duration,
      resultCount: details.resultCount,
      ...details
    },
    result,
    impact: details.impact || { level: 'LOW' }
  };
  
  return this.logAction(actionData);
};

// Static method to get audit trail for entity
auditLogSchema.statics.getEntityAuditTrail = function(entityType, entityId, options = {}) {
  const { limit = 50, skip = 0, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  return this.find({
    'entity.type': entityType,
    'entity.id': entityId
  })
  .sort({ [sortBy]: sortOrder })
  .limit(limit)
  .skip(skip)
  .populate('actor.userId', 'username fullName email')
  .lean();
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = function(userId, options = {}) {
  const { limit = 50, skip = 0, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  return this.find({
    'actor.userId': userId
  })
  .sort({ [sortBy]: sortOrder })
  .limit(limit)
  .skip(skip)
  .lean();
};

// Static method to get analytics
auditLogSchema.statics.getAnalytics = async function(filters = {}, groupBy = 'action') {
  const matchStage = { $match: filters };
  
  const groupStage = {
    $group: {
      _id: `$${groupBy}`,
      count: { $sum: 1 },
      successCount: {
        $sum: {
          $cond: [{ $eq: ['$result.status', 'SUCCESS'] }, 1, 0]
        }
      },
      failureCount: {
        $sum: {
          $cond: [{ $eq: ['$result.status', 'FAILED'] }, 1, 0]
        }
      },
      errorCount: {
        $sum: {
          $cond: [{ $eq: ['$result.status', 'ERROR'] }, 1, 0]
        }
      },
      lastOccurrence: { $max: '$createdAt' }
    }
  };
  
  const sortStage = { $sort: { count: -1 } };
  
  return this.aggregate([matchStage, groupStage, sortStage]);
};

// Transform output (remove sensitive information)
auditLogSchema.methods.toJSON = function() {
  const log = this.toObject();
  
  // Remove sensitive details based on user permissions
  // This would be customized based on the user's access level
  
  return log;
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
