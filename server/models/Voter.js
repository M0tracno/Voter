const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  voterId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]{6,20}$/, 'Please enter a valid voter ID']
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  dateOfBirth: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        // Must be at least 18 years old
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
        return value <= eighteenYearsAgo;
      },
      message: 'Voter must be at least 18 years old'
    }
  },
  gender: {
    type: String,
    enum: ['M', 'F', 'O'],
    required: true
  },
  fatherName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  motherName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  address: {
    houseNumber: String,
    street: String,
    locality: String,
    city: String,
    district: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
    }
  },
  contact: {
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    alternateNumber: {
      type: String,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number']
    }
  },
  pollingStation: {
    boothId: {
      type: String,
      required: true,
      trim: true
    },
    boothName: {
      type: String,
      required: true,
      trim: true
    },
    assemblyConstituency: {
      type: String,
      required: true,
      trim: true
    },
    parliamentaryConstituency: {
      type: String,
      required: true,
      trim: true
    }
  },
  biometric: {
    photoHash: {
      type: String,
      default: null
    },
    faceEmbedding: {
      type: [Number], // Face recognition embedding vector
      default: null
    },
    fingerprintHash: {
      type: String,
      default: null
    }
  },
  verification: {
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING'
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: String,
    lastVerificationAttempt: Date,
    verificationCount: {
      type: Number,
      default: 0
    }
  },
  documents: [{
    type: {
      type: String,
      enum: ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'OTHER'],
      required: true
    },
    documentNumber: {
      type: String,
      required: true,
      trim: true
    },
    documentHash: String, // Hash of the document for verification
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  flags: {
    isActive: {
      type: Boolean,
      default: true
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    blockReason: String,
    blockedAt: Date,
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isDuplicate: {
      type: Boolean,
      default: false
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voter'
    }
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
    importBatch: String, // For bulk imports
    source: {
      type: String,
      enum: ['MANUAL', 'BULK_IMPORT', 'API', 'MIGRATION'],
      default: 'MANUAL'
    },
    ipAddress: String,
    userAgent: String
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

// Compound indexes for performance
voterSchema.index({ fullName: 'text' }); // Text search
voterSchema.index({ 'address.district': 1, 'address.state': 1 });
voterSchema.index({ 'pollingStation.boothId': 1 });
voterSchema.index({ 'verification.status': 1 });
voterSchema.index({ 'flags.isActive': 1 });
voterSchema.index({ 'flags.isBlocked': 1 });
voterSchema.index({ createdAt: 1 });
voterSchema.index({ updatedAt: 1 });
voterSchema.index({ 'sync.isSynced': 1 });

// Geospatial index if we add location data
voterSchema.index({ 'location': '2dsphere' });

// Virtual for age calculation
voterSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for full address
voterSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  const parts = [
    addr.houseNumber,
    addr.street,
    addr.locality,
    addr.city,
    addr.district,
    addr.state,
    addr.pincode
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Virtual for display name
voterSchema.virtual('displayName').get(function() {
  return `${this.fullName} (${this.voterId})`;
});

// Pre-save middleware
voterSchema.pre('save', function(next) {
  // Auto-generate voter ID if not provided (for new registrations)
  if (!this.voterId && this.isNew) {
    this.voterId = generateVoterId(this.address.state, this.address.district);
  }
  
  // Update sync version on changes
  if (this.isModified() && !this.isNew) {
    this.sync.syncVersion += 1;
    this.sync.isSynced = false;
  }
  
  next();
});

// Instance method to mark as verified
voterSchema.methods.markAsVerified = function(verifiedBy, method = 'MANUAL') {
  this.verification.status = 'VERIFIED';
  this.verification.verifiedAt = new Date();
  this.verification.verifiedBy = verifiedBy;
  this.verification.verificationCount += 1;
  this.verification.lastVerificationAttempt = new Date();
  
  return this.save();
};

// Instance method to reject verification
voterSchema.methods.rejectVerification = function(rejectedBy, reason) {
  this.verification.status = 'REJECTED';
  this.verification.rejectionReason = reason;
  this.verification.verifiedBy = rejectedBy;
  this.verification.lastVerificationAttempt = new Date();
  
  return this.save();
};

// Instance method to block voter
voterSchema.methods.blockVoter = function(blockedBy, reason) {
  this.flags.isBlocked = true;
  this.flags.blockReason = reason;
  this.flags.blockedAt = new Date();
  this.flags.blockedBy = blockedBy;
  
  return this.save();
};

// Instance method to unblock voter
voterSchema.methods.unblockVoter = function() {
  this.flags.isBlocked = false;
  this.flags.blockReason = undefined;
  this.flags.blockedAt = undefined;
  this.flags.blockedBy = undefined;
  
  return this.save();
};

// Static method to find by mobile number
voterSchema.statics.findByMobile = function(mobileNumber) {
  return this.findOne({ 'contact.mobileNumber': mobileNumber });
};

// Static method to find by voter ID
voterSchema.statics.findByVoterId = function(voterId) {
  return this.findOne({ voterId: voterId.toUpperCase() });
};

// Static method to search voters
voterSchema.statics.searchVoters = function(searchTerm, filters = {}) {
  const query = { ...filters };
  
  if (searchTerm) {
    query.$or = [
      { voterId: new RegExp(searchTerm, 'i') },
      { fullName: new RegExp(searchTerm, 'i') },
      { 'contact.mobileNumber': new RegExp(searchTerm, 'i') },
      { fatherName: new RegExp(searchTerm, 'i') }
    ];
  }
  
  return this.find(query);
};

// Static method to get analytics
voterSchema.statics.getAnalytics = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        verified: {
          $sum: {
            $cond: [{ $eq: ['$verification.status', 'VERIFIED'] }, 1, 0]
          }
        },
        pending: {
          $sum: {
            $cond: [{ $eq: ['$verification.status', 'PENDING'] }, 1, 0]
          }
        },
        rejected: {
          $sum: {
            $cond: [{ $eq: ['$verification.status', 'REJECTED'] }, 1, 0]
          }
        },
        active: {
          $sum: {
            $cond: ['$flags.isActive', 1, 0]
          }
        },
        blocked: {
          $sum: {
            $cond: ['$flags.isBlocked', 1, 0]
          }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
    active: 0,
    blocked: 0
  };
};

// Helper function to generate voter ID
function generateVoterId(state, district) {
  const stateCode = state.substring(0, 2).toUpperCase();
  const districtCode = district.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `${stateCode}${districtCode}${timestamp}${random}`;
}

// Transform output (remove sensitive fields)
voterSchema.methods.toJSON = function() {
  const voter = this.toObject();
  
  // Remove sensitive biometric data from public output
  if (voter.biometric) {
    delete voter.biometric.faceEmbedding;
    delete voter.biometric.fingerprintHash;
  }
  
  return voter;
};

module.exports = mongoose.model('Voter', voterSchema);
