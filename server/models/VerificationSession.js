const mongoose = require('mongoose');

const verificationSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `VS_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
  },
  voter: {
    voterId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    voterObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voter',
      default: null
    },
    fullName: String,
    mobileNumber: String
  },
  operator: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    fullName: String
  },
  booth: {
    boothId: {
      type: String,
      required: true,
      trim: true
    },
    boothName: String,
    location: String
  },
  verification: {
    method: {
      type: String,
      enum: ['OTP', 'FACE', 'BIOMETRIC', 'MANUAL', 'DOCUMENT'],
      required: true
    },
    status: {
      type: String,
      enum: ['INITIATED', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED'],
      default: 'INITIATED'
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date,
    timeoutAt: {
      type: Date,
      default: function() {
        // Default timeout 10 minutes from now
        return new Date(Date.now() + 10 * 60 * 1000);
      }
    }
  },
  otp: {
    code: String,
    hashedCode: String, // Hashed version for security
    generatedAt: Date,
    verifiedAt: Date,
    expiresAt: Date,
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    provider: {
      type: String,
      enum: ['TWILIO', 'AWS_SNS', 'FAKE'], // For testing
      default: 'TWILIO'
    },
    messageId: String, // Provider's message ID
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'DELIVERED', 'FAILED', 'UNDELIVERED'],
      default: 'PENDING'
    }
  },
  face: {
    capturedImage: String, // Base64 or URL
    imageHash: String,
    confidence: Number, // Matching confidence (0-1)
    threshold: {
      type: Number,
      default: 0.8
    },
    landmarks: [Number], // Facial landmarks
    embedding: [Number], // Face embedding vector
    verificationResult: {
      isMatch: Boolean,
      confidence: Number,
      timestamp: Date
    },
    attempts: [{
      imageHash: String,
      confidence: Number,
      timestamp: {
        type: Date,
        default: Date.now
      },
      result: {
        type: String,
        enum: ['MATCH', 'NO_MATCH', 'ERROR', 'POOR_QUALITY']
      }
    }]
  },
  biometric: {
    fingerprint: {
      template: String, // Encrypted fingerprint template
      quality: Number, // Quality score (0-100)
      matchScore: Number // Matching score
    },
    iris: {
      template: String,
      quality: Number,
      matchScore: Number
    }
  },
  document: {
    type: {
      type: String,
      enum: ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID']
    },
    number: String,
    imageHash: String,
    ocrResults: mongoose.Schema.Types.Mixed,
    verificationResult: {
      isValid: Boolean,
      details: mongoose.Schema.Types.Mixed,
      timestamp: Date
    }
  },
  results: {
    overallStatus: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'PARTIAL', 'TIMEOUT', 'CANCELLED'],
      default: 'FAILED'
    },
    verificationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    failureReason: String,
    details: mongoose.Schema.Types.Mixed,
    recommendations: [String]
  },
  security: {
    hmacSignature: String, // HMAC signature for integrity
    ipAddress: String,
    userAgent: String,
    deviceFingerprint: String,
    geoLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      timestamp: Date
    },
    securityFlags: [{
      flag: String,
      description: String,
      severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  workflow: {
    currentStep: {
      type: String,
      enum: [
        'VOTER_SEARCH',
        'VOTER_FOUND',
        'METHOD_SELECTION',
        'OTP_GENERATION',
        'OTP_VERIFICATION',
        'FACE_CAPTURE',
        'FACE_VERIFICATION',
        'BIOMETRIC_CAPTURE',
        'BIOMETRIC_VERIFICATION',
        'DOCUMENT_UPLOAD',
        'DOCUMENT_VERIFICATION',
        'MANUAL_REVIEW',
        'COMPLETION'
      ],
      default: 'VOTER_SEARCH'
    },
    steps: [{
      step: String,
      status: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED']
      },
      startedAt: Date,
      completedAt: Date,
      data: mongoose.Schema.Types.Mixed,
      errors: [String]
    }],
    metadata: mongoose.Schema.Types.Mixed
  },
  audit: {
    events: [{
      event: String,
      description: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      data: mongoose.Schema.Types.Mixed
    }],
    flags: [String], // e.g., ['SUSPICIOUS_ACTIVITY', 'MULTIPLE_ATTEMPTS']
    notes: String
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
    syncTarget: String, // Central server identifier
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

// Indexes for performance
verificationSessionSchema.index({ sessionId: 1 }, { unique: true });
verificationSessionSchema.index({ 'voter.voterId': 1 });
verificationSessionSchema.index({ 'voter.voterObjectId': 1 });
verificationSessionSchema.index({ 'operator.userId': 1 });
verificationSessionSchema.index({ 'booth.boothId': 1 });
verificationSessionSchema.index({ 'verification.method': 1 });
verificationSessionSchema.index({ 'verification.status': 1 });
verificationSessionSchema.index({ 'results.overallStatus': 1 });
verificationSessionSchema.index({ createdAt: 1 });
verificationSessionSchema.index({ 'verification.timeoutAt': 1 });
verificationSessionSchema.index({ 'sync.isSynced': 1 });

// Compound indexes
verificationSessionSchema.index({ 'voter.voterId': 1, createdAt: -1 });
verificationSessionSchema.index({ 'operator.userId': 1, createdAt: -1 });
verificationSessionSchema.index({ 'booth.boothId': 1, createdAt: -1 });

// TTL index for automatic cleanup of old sessions
verificationSessionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 } // 30 days
);

// Virtual for session duration
verificationSessionSchema.virtual('duration').get(function() {
  if (!this.verification.completedAt) return null;
  return this.verification.completedAt - this.verification.startedAt;
});

// Virtual for time remaining
verificationSessionSchema.virtual('timeRemaining').get(function() {
  if (!this.verification.timeoutAt) return null;
  const remaining = this.verification.timeoutAt - new Date();
  return remaining > 0 ? remaining : 0;
});

// Virtual for is expired
verificationSessionSchema.virtual('isExpired').get(function() {
  return this.verification.timeoutAt && new Date() > this.verification.timeoutAt;
});

// Pre-save middleware
verificationSessionSchema.pre('save', function(next) {
  // Update sync version on changes
  if (this.isModified() && !this.isNew) {
    this.sync.syncVersion += 1;
    this.sync.isSynced = false;
  }
  
  // Add audit event for status changes
  if (this.isModified('verification.status')) {
    this.audit.events.push({
      event: 'STATUS_CHANGE',
      description: `Status changed to ${this.verification.status}`,
      data: { newStatus: this.verification.status }
    });
  }
  
  next();
});

// Instance method to start verification
verificationSessionSchema.methods.startVerification = function(method) {
  this.verification.method = method;
  this.verification.status = 'IN_PROGRESS';
  this.verification.startedAt = new Date();
  
  this.workflow.currentStep = method === 'OTP' ? 'OTP_GENERATION' : 
                             method === 'FACE' ? 'FACE_CAPTURE' :
                             method === 'BIOMETRIC' ? 'BIOMETRIC_CAPTURE' :
                             'METHOD_SELECTION';
  
  return this.save();
};

// Instance method to complete verification
verificationSessionSchema.methods.completeVerification = function(status, results = {}) {
  this.verification.status = status;
  this.verification.completedAt = new Date();
  this.results.overallStatus = status;
  this.results = { ...this.results, ...results };
  this.workflow.currentStep = 'COMPLETION';
  
  return this.save();
};

// Instance method to fail verification
verificationSessionSchema.methods.failVerification = function(reason, details = {}) {
  this.verification.status = 'FAILED';
  this.verification.completedAt = new Date();
  this.results.overallStatus = 'FAILED';
  this.results.failureReason = reason;
  this.results.details = details;
  this.workflow.currentStep = 'COMPLETION';
  
  return this.save();
};

// Instance method to add audit event
verificationSessionSchema.methods.addAuditEvent = function(event, description, data = {}) {
  this.audit.events.push({
    event,
    description,
    data
  });
  
  return this.save();
};

// Instance method to update workflow step
verificationSessionSchema.methods.updateWorkflowStep = function(step, status = 'IN_PROGRESS', data = {}) {
  this.workflow.currentStep = step;
  
  // Find existing step or create new one
  const existingStep = this.workflow.steps.find(s => s.step === step);
  if (existingStep) {
    existingStep.status = status;
    if (status === 'IN_PROGRESS') existingStep.startedAt = new Date();
    if (status === 'COMPLETED' || status === 'FAILED') existingStep.completedAt = new Date();
    existingStep.data = { ...existingStep.data, ...data };
  } else {
    const stepData = {
      step,
      status,
      data
    };
    if (status === 'IN_PROGRESS') stepData.startedAt = new Date();
    if (status === 'COMPLETED' || status === 'FAILED') stepData.completedAt = new Date();
    
    this.workflow.steps.push(stepData);
  }
  
  return this.save();
};

// Static method to find active sessions
verificationSessionSchema.statics.findActiveSessions = function(filters = {}) {
  return this.find({
    'verification.status': { $in: ['INITIATED', 'IN_PROGRESS'] },
    'verification.timeoutAt': { $gt: new Date() },
    ...filters
  });
};

// Static method to find expired sessions
verificationSessionSchema.statics.findExpiredSessions = function() {
  return this.find({
    'verification.status': { $in: ['INITIATED', 'IN_PROGRESS'] },
    'verification.timeoutAt': { $lte: new Date() }
  });
};

// Static method to cleanup expired sessions
verificationSessionSchema.statics.cleanupExpiredSessions = async function() {
  const expiredSessions = await this.findExpiredSessions();
  
  for (const session of expiredSessions) {
    session.verification.status = 'TIMEOUT';
    session.verification.completedAt = new Date();
    session.results.overallStatus = 'TIMEOUT';
    session.results.failureReason = 'Session timeout';
    await session.save();
  }
  
  return expiredSessions.length;
};

// Static method to get session analytics
verificationSessionSchema.statics.getAnalytics = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        successful: {
          $sum: {
            $cond: [{ $eq: ['$results.overallStatus', 'SUCCESS'] }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$results.overallStatus', 'FAILED'] }, 1, 0]
          }
        },
        timeout: {
          $sum: {
            $cond: [{ $eq: ['$results.overallStatus', 'TIMEOUT'] }, 1, 0]
          }
        },
        avgDuration: {
          $avg: {
            $subtract: ['$verification.completedAt', '$verification.startedAt']
          }
        },
        byMethod: {
          $push: '$verification.method'
        }
      }
    }
  ];
  
  const methodPipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$verification.method',
        count: { $sum: 1 },
        successRate: {
          $avg: {
            $cond: [{ $eq: ['$results.overallStatus', 'SUCCESS'] }, 1, 0]
          }
        }
      }
    }
  ];
  
  const [overall, byMethod] = await Promise.all([
    this.aggregate(pipeline),
    this.aggregate(methodPipeline)
  ]);
  
  return {
    overall: overall[0] || { total: 0, successful: 0, failed: 0, timeout: 0 },
    byMethod
  };
};

// Transform output (remove sensitive data)
verificationSessionSchema.methods.toJSON = function() {
  const session = this.toObject();
  
  // Remove sensitive OTP data
  if (session.otp) {
    delete session.otp.code;
    delete session.otp.hashedCode;
  }
  
  // Remove sensitive biometric data
  if (session.biometric) {
    delete session.biometric.fingerprint?.template;
    delete session.biometric.iris?.template;
  }
  
  // Remove sensitive face data
  if (session.face) {
    delete session.face.embedding;
  }
  
  return session;
};

module.exports = mongoose.model('VerificationSession', verificationSessionSchema);
