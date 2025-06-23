const mongoose = require('mongoose');

const boothSchema = new mongoose.Schema({
  boothId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  boothName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  boothNumber: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    address: {
      buildingName: String,
      street: String,
      locality: String,
      city: String,
      district: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      pincode: {
        type: String,
        match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
      }
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
      accuracy: Number
    },
    landmarks: [String]
  },
  constituency: {
    assembly: {
      code: String,
      name: {
        type: String,
        required: true
      }
    },
    parliamentary: {
      code: String,
      name: {
        type: String,
        required: true
      }
    }
  },
  capacity: {
    totalVoters: {
      type: Number,
      default: 0,
      min: 0
    },
    maxVotersPerHour: {
      type: Number,
      default: 100,
      min: 10
    },
    estimatedProcessingTime: {
      type: Number, // in minutes
      default: 2
    }
  },
  equipment: {
    devices: [{
      type: {
        type: String,
        enum: ['TABLET', 'SCANNER', 'BIOMETRIC', 'CAMERA', 'PRINTER'],
        required: true
      },
      model: String,
      serialNumber: String,
      status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'FAULTY'],
        default: 'ACTIVE'
      },
      lastChecked: Date,
      notes: String
    }],
    internetConnection: {
      type: {
        type: String,
        enum: ['WIFI', 'CELLULAR', 'ETHERNET', 'SATELLITE'],
        default: 'WIFI'
      },
      status: {
        type: String,
        enum: ['CONNECTED', 'DISCONNECTED', 'POOR'],
        default: 'CONNECTED'
      },
      speed: String, // e.g., "10 Mbps"
      lastChecked: Date
    },
    powerBackup: {
      available: {
        type: Boolean,
        default: false
      },
      type: String, // UPS, Generator, etc.
      capacity: String,
      lastTested: Date
    }
  },
  staff: {
    operators: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        enum: ['PRIMARY', 'SECONDARY', 'SUPERVISOR'],
        default: 'PRIMARY'
      },
      assignedAt: {
        type: Date,
        default: Date.now
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    contactPerson: {
      name: String,
      mobile: String,
      email: String,
      role: String
    }
  },
  schedule: {
    operatingHours: {
      start: String, // "09:00"
      end: String,   // "17:00"
      timezone: {
        type: String,
        default: 'Asia/Kolkata'
      }
    },
    breaks: [{
      name: String, // "Lunch Break"
      start: String,
      end: String
    }],
    holidays: [Date],
    specialSchedule: [{
      date: Date,
      start: String,
      end: String,
      reason: String
    }]
  },
  status: {
    operational: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'SUSPENDED'],
      default: 'ACTIVE'
    },
    lastActiveAt: Date,
    reasonForInactive: String,
    estimatedRestoreTime: Date
  },
  security: {
    apiToken: {
      type: String,
      unique: true,
      required: true
    },
    allowedIPs: [String],
    sslRequired: {
      type: Boolean,
      default: true
    },
    lastTokenRefresh: Date,
    securityLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM'
    }
  },
  statistics: {
    totalVerifications: {
      type: Number,
      default: 0
    },
    successfulVerifications: {
      type: Number,
      default: 0
    },
    failedVerifications: {
      type: Number,
      default: 0
    },
    averageProcessingTime: {
      type: Number, // in seconds
      default: 0
    },
    lastVerification: Date,
    dailyStats: [{
      date: {
        type: Date,
        required: true
      },
      verifications: {
        type: Number,
        default: 0
      },
      successful: {
        type: Number,
        default: 0
      },
      failed: {
        type: Number,
        default: 0
      },
      avgTime: {
        type: Number,
        default: 0
      }
    }]
  },
  sync: {
    lastSyncAt: Date,
    syncVersion: {
      type: Number,
      default: 1
    },
    isSynced: {
      type: Boolean,
      default: false
    },
    syncTarget: String, // Central server URL
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
  },
  audit: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastInspection: {
      date: Date,
      inspector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      notes: String,
      issues: [String],
      rating: {
        type: Number,
        min: 1,
        max: 5
      }
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
boothSchema.index({ boothId: 1 }, { unique: true });
boothSchema.index({ 'location.address.district': 1 });
boothSchema.index({ 'location.address.state': 1 });
boothSchema.index({ 'constituency.assembly.code': 1 });
boothSchema.index({ 'constituency.parliamentary.code': 1 });
boothSchema.index({ 'status.operational': 1 });
boothSchema.index({ 'staff.operators.userId': 1 });
boothSchema.index({ 'security.apiToken': 1 }, { unique: true });
boothSchema.index({ createdAt: 1 });
boothSchema.index({ 'sync.isSynced': 1 });

// Geospatial index for location-based queries
boothSchema.index({ 'location.coordinates': '2dsphere' });

// Text search index
boothSchema.index({
  boothName: 'text',
  'location.address.city': 'text',
  'location.address.locality': 'text'
});

// Virtual for full address
boothSchema.virtual('fullAddress').get(function() {
  const addr = this.location.address;
  const parts = [
    addr.buildingName,
    addr.street,
    addr.locality,
    addr.city,
    addr.district,
    addr.state,
    addr.pincode
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Virtual for success rate
boothSchema.virtual('successRate').get(function() {
  if (this.statistics.totalVerifications === 0) return 0;
  return (this.statistics.successfulVerifications / this.statistics.totalVerifications) * 100;
});

// Virtual for current operators
boothSchema.virtual('currentOperators').get(function() {
  return this.staff.operators.filter(op => op.isActive);
});

// Pre-save middleware
boothSchema.pre('save', function(next) {
  // Generate API token if not provided
  if (!this.security.apiToken) {
    this.security.apiToken = generateApiToken();
  }
  
  // Update sync version on changes
  if (this.isModified() && !this.isNew) {
    this.sync.syncVersion += 1;
    this.sync.isSynced = false;
  }
  
  next();
});

// Instance method to add operator
boothSchema.methods.addOperator = function(userId, role = 'PRIMARY') {
  // Check if operator already exists
  const existingOperator = this.staff.operators.find(
    op => op.userId.toString() === userId.toString()
  );
  
  if (existingOperator) {
    existingOperator.role = role;
    existingOperator.isActive = true;
    existingOperator.assignedAt = new Date();
  } else {
    this.staff.operators.push({
      userId,
      role,
      assignedAt: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

// Instance method to remove operator
boothSchema.methods.removeOperator = function(userId) {
  const operatorIndex = this.staff.operators.findIndex(
    op => op.userId.toString() === userId.toString()
  );
  
  if (operatorIndex > -1) {
    this.staff.operators[operatorIndex].isActive = false;
  }
  
  return this.save();
};

// Instance method to update verification stats
boothSchema.methods.updateVerificationStats = function(isSuccessful, processingTime) {
  this.statistics.totalVerifications += 1;
  if (isSuccessful) {
    this.statistics.successfulVerifications += 1;
  } else {
    this.statistics.failedVerifications += 1;
  }
  
  // Update average processing time
  const totalTime = this.statistics.averageProcessingTime * (this.statistics.totalVerifications - 1);
  this.statistics.averageProcessingTime = (totalTime + processingTime) / this.statistics.totalVerifications;
  
  this.statistics.lastVerification = new Date();
  
  // Update daily stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let dailyStat = this.statistics.dailyStats.find(
    stat => stat.date.getTime() === today.getTime()
  );
  
  if (!dailyStat) {
    dailyStat = {
      date: today,
      verifications: 0,
      successful: 0,
      failed: 0,
      avgTime: 0
    };
    this.statistics.dailyStats.push(dailyStat);
  }
  
  dailyStat.verifications += 1;
  if (isSuccessful) {
    dailyStat.successful += 1;
  } else {
    dailyStat.failed += 1;
  }
  
  // Update daily average time
  const dailyTotalTime = dailyStat.avgTime * (dailyStat.verifications - 1);
  dailyStat.avgTime = (dailyTotalTime + processingTime) / dailyStat.verifications;
  
  // Keep only last 30 days of daily stats
  if (this.statistics.dailyStats.length > 30) {
    this.statistics.dailyStats.sort((a, b) => b.date - a.date);
    this.statistics.dailyStats = this.statistics.dailyStats.slice(0, 30);
  }
  
  return this.save();
};

// Instance method to check if booth is operational
boothSchema.methods.isOperational = function() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  // Check if booth is active
  if (this.status.operational !== 'ACTIVE') return false;
  
  // Check operating hours
  if (this.schedule.operatingHours.start && this.schedule.operatingHours.end) {
    if (currentTime < this.schedule.operatingHours.start || 
        currentTime > this.schedule.operatingHours.end) {
      return false;
    }
  }
  
  // Check if today is a holiday
  const todayDate = now.toDateString();
  if (this.schedule.holidays.some(holiday => holiday.toDateString() === todayDate)) {
    return false;
  }
  
  // Check breaks
  if (this.schedule.breaks) {
    for (const breakTime of this.schedule.breaks) {
      if (currentTime >= breakTime.start && currentTime <= breakTime.end) {
        return false;
      }
    }
  }
  
  return true;
};

// Instance method to refresh API token
boothSchema.methods.refreshApiToken = function() {
  this.security.apiToken = generateApiToken();
  this.security.lastTokenRefresh = new Date();
  return this.save();
};

// Static method to find by API token
boothSchema.statics.findByApiToken = function(token) {
  return this.findOne({ 'security.apiToken': token, 'status.operational': 'ACTIVE' });
};

// Static method to find operational booths
boothSchema.statics.findOperational = function(filters = {}) {
  return this.find({
    'status.operational': 'ACTIVE',
    ...filters
  });
};

// Static method to get analytics
boothSchema.statics.getAnalytics = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [{ $eq: ['$status.operational', 'ACTIVE'] }, 1, 0]
          }
        },
        inactive: {
          $sum: {
            $cond: [{ $eq: ['$status.operational', 'INACTIVE'] }, 1, 0]
          }
        },
        maintenance: {
          $sum: {
            $cond: [{ $eq: ['$status.operational', 'MAINTENANCE'] }, 1, 0]
          }
        },
        totalVerifications: { $sum: '$statistics.totalVerifications' },
        totalSuccessful: { $sum: '$statistics.successfulVerifications' },
        avgProcessingTime: { $avg: '$statistics.averageProcessingTime' }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    total: 0,
    active: 0,
    inactive: 0,
    maintenance: 0,
    totalVerifications: 0,
    totalSuccessful: 0,
    avgProcessingTime: 0
  };
};

// Helper function to generate API token
function generateApiToken() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15);
  return `BT_${timestamp}_${random}`.toUpperCase();
}

// Transform output (hide sensitive information)
boothSchema.methods.toJSON = function() {
  const booth = this.toObject();
  
  // Hide API token in public responses
  if (booth.security) {
    booth.security.apiToken = booth.security.apiToken ? 
      `${booth.security.apiToken.substring(0, 8)}...` : null;
  }
  
  return booth;
};

module.exports = mongoose.model('Booth', boothSchema);
