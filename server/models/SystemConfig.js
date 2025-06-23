const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'GENERAL',
      'SECURITY',
      'OTP',
      'BIOMETRIC',
      'NOTIFICATION',
      'SYNC',
      'AUDIT',
      'PERFORMANCE',
      'UI',
      'INTEGRATION',
      'BACKUP'
    ],
    required: true,
    default: 'GENERAL'
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  defaultValue: mongoose.Schema.Types.Mixed,
  isSecret: {
    type: Boolean,
    default: false
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  validation: {
    required: {
      type: Boolean,
      default: false
    },
    min: Number,
    max: Number,
    pattern: String,
    enum: [String],
    customValidator: String // JavaScript function as string
  },
  metadata: {
    version: {
      type: String,
      default: '1.0.0'
    },
    tags: [String],
    dependencies: [String], // Other config keys this depends on
    impact: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW'
    },
    restartRequired: {
      type: Boolean,
      default: false
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
    changeHistory: [{
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      reason: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
systemConfigSchema.index({ key: 1 }, { unique: true });
systemConfigSchema.index({ category: 1 });
systemConfigSchema.index({ 'metadata.tags': 1 });
systemConfigSchema.index({ isSecret: 1 });
systemConfigSchema.index({ isEditable: 1 });

// Pre-save middleware to track changes
systemConfigSchema.pre('save', function(next) {
  if (this.isModified('value') && !this.isNew) {
    // Add to change history
    this.audit.changeHistory.push({
      oldValue: this._original?.value,
      newValue: this.value,
      changedBy: this.audit.updatedBy,
      reason: 'Value updated'
    });
  }
  next();
});

// Post-init middleware to store original value
systemConfigSchema.post('init', function() {
  this._original = this.toObject();
});

// Instance method to update value
systemConfigSchema.methods.updateValue = function(newValue, updatedBy, reason = 'Value updated') {
  const oldValue = this.value;
  this.value = newValue;
  this.audit.updatedBy = updatedBy;
  
  this.audit.changeHistory.push({
    oldValue,
    newValue,
    changedBy: updatedBy,
    reason
  });
  
  return this.save();
};

// Static method to get config value
systemConfigSchema.statics.getValue = async function(key) {
  const config = await this.findOne({ key: key.toUpperCase() });
  if (!config) {
    throw new Error(`Configuration key '${key}' not found`);
  }
  return config.value;
};

// Static method to set config value
systemConfigSchema.statics.setValue = async function(key, value, updatedBy, reason) {
  const config = await this.findOne({ key: key.toUpperCase() });
  if (!config) {
    throw new Error(`Configuration key '${key}' not found`);
  }
  
  if (!config.isEditable) {
    throw new Error(`Configuration key '${key}' is not editable`);
  }
  
  return config.updateValue(value, updatedBy, reason);
};

// Static method to get configs by category
systemConfigSchema.statics.getByCategory = function(category, includeSecrets = false) {
  const filter = { category: category.toUpperCase() };
  if (!includeSecrets) {
    filter.isSecret = false;
  }
  return this.find(filter);
};

// Static method to initialize default configs
systemConfigSchema.statics.initializeDefaults = async function(adminUserId) {
  const defaultConfigs = [
    // General Settings
    {
      key: 'APP_NAME',
      value: 'FastVerify',
      type: 'STRING',
      category: 'GENERAL',
      description: 'Application name displayed in UI'
    },
    {
      key: 'APP_VERSION',
      value: '1.0.0',
      type: 'STRING',
      category: 'GENERAL',
      description: 'Current application version'
    },
    {
      key: 'MAINTENANCE_MODE',
      value: false,
      type: 'BOOLEAN',
      category: 'GENERAL',
      description: 'Enable/disable maintenance mode'
    },
    
    // Security Settings
    {
      key: 'JWT_EXPIRY_MINUTES',
      value: 60,
      type: 'NUMBER',
      category: 'SECURITY',
      description: 'JWT token expiry time in minutes',
      validation: { min: 5, max: 1440 }
    },
    {
      key: 'REFRESH_TOKEN_EXPIRY_DAYS',
      value: 30,
      type: 'NUMBER',
      category: 'SECURITY',
      description: 'Refresh token expiry time in days',
      validation: { min: 1, max: 365 }
    },
    {
      key: 'MAX_LOGIN_ATTEMPTS',
      value: 5,
      type: 'NUMBER',
      category: 'SECURITY',
      description: 'Maximum failed login attempts before account lock',
      validation: { min: 3, max: 10 }
    },
    {
      key: 'ACCOUNT_LOCK_DURATION_HOURS',
      value: 2,
      type: 'NUMBER',
      category: 'SECURITY',
      description: 'Account lock duration in hours',
      validation: { min: 1, max: 24 }
    },
    
    // OTP Settings
    {
      key: 'OTP_EXPIRY_MINUTES',
      value: 5,
      type: 'NUMBER',
      category: 'OTP',
      description: 'OTP expiry time in minutes',
      validation: { min: 1, max: 15 }
    },
    {
      key: 'OTP_LENGTH',
      value: 6,
      type: 'NUMBER',
      category: 'OTP',
      description: 'Length of generated OTP',
      validation: { min: 4, max: 8 }
    },
    {
      key: 'OTP_MAX_ATTEMPTS',
      value: 3,
      type: 'NUMBER',
      category: 'OTP',
      description: 'Maximum OTP verification attempts',
      validation: { min: 2, max: 5 }
    },
    {
      key: 'OTP_PROVIDER',
      value: 'TWILIO',
      type: 'STRING',
      category: 'OTP',
      description: 'OTP service provider',
      validation: { enum: ['TWILIO', 'AWS_SNS', 'FAKE'] }
    },
    
    // Biometric Settings
    {
      key: 'FACE_MATCH_THRESHOLD',
      value: 0.8,
      type: 'NUMBER',
      category: 'BIOMETRIC',
      description: 'Face matching confidence threshold (0-1)',
      validation: { min: 0.1, max: 1.0 }
    },
    {
      key: 'FINGERPRINT_MATCH_THRESHOLD',
      value: 0.7,
      type: 'NUMBER',
      category: 'BIOMETRIC',
      description: 'Fingerprint matching confidence threshold (0-1)',
      validation: { min: 0.1, max: 1.0 }
    },
    
    // Sync Settings
    {
      key: 'AUTO_SYNC_INTERVAL_MINUTES',
      value: 5,
      type: 'NUMBER',
      category: 'SYNC',
      description: 'Automatic sync interval in minutes',
      validation: { min: 1, max: 60 }
    },
    {
      key: 'SYNC_BATCH_SIZE',
      value: 100,
      type: 'NUMBER',
      category: 'SYNC',
      description: 'Number of records to sync in each batch',
      validation: { min: 10, max: 1000 }
    },
    
    // Audit Settings
    {
      key: 'AUDIT_LOG_RETENTION_DAYS',
      value: 2555, // 7 years
      type: 'NUMBER',
      category: 'AUDIT',
      description: 'Audit log retention period in days',
      validation: { min: 30, max: 3650 }
    },
    {
      key: 'LOG_LEVEL',
      value: 'INFO',
      type: 'STRING',
      category: 'AUDIT',
      description: 'Application log level',
      validation: { enum: ['ERROR', 'WARN', 'INFO', 'DEBUG'] }
    },
    
    // Performance Settings
    {
      key: 'API_RATE_LIMIT_PER_MINUTE',
      value: 100,
      type: 'NUMBER',
      category: 'PERFORMANCE',
      description: 'API rate limit per minute per IP',
      validation: { min: 10, max: 1000 }
    },
    {
      key: 'DATABASE_CONNECTION_POOL_SIZE',
      value: 10,
      type: 'NUMBER',
      category: 'PERFORMANCE',
      description: 'Database connection pool size',
      validation: { min: 5, max: 50 }
    },
    
    // UI Settings
    {
      key: 'DEFAULT_PAGE_SIZE',
      value: 25,
      type: 'NUMBER',
      category: 'UI',
      description: 'Default number of items per page',
      validation: { min: 10, max: 100 }
    },
    {
      key: 'SUPPORTED_LANGUAGES',
      value: ['en', 'hi'],
      type: 'ARRAY',
      category: 'UI',
      description: 'Supported application languages'
    },
    
    // Backup Settings
    {
      key: 'AUTO_BACKUP_ENABLED',
      value: true,
      type: 'BOOLEAN',
      category: 'BACKUP',
      description: 'Enable automatic database backups'
    },
    {
      key: 'BACKUP_RETENTION_DAYS',
      value: 30,
      type: 'NUMBER',
      category: 'BACKUP',
      description: 'Backup retention period in days',
      validation: { min: 7, max: 365 }
    }
  ];
  
  const existingConfigs = await this.find({});
  const existingKeys = existingConfigs.map(c => c.key);
  
  const newConfigs = defaultConfigs
    .filter(config => !existingKeys.includes(config.key))
    .map(config => ({
      ...config,
      audit: {
        createdBy: adminUserId
      },
      metadata: {
        version: '1.0.0',
        impact: 'MEDIUM'
      }
    }));
  
  if (newConfigs.length > 0) {
    await this.insertMany(newConfigs);
    console.log(`✅ Initialized ${newConfigs.length} default configuration entries`);
  }
  
  return newConfigs.length;
};

// Transform output (hide secret values)
systemConfigSchema.methods.toJSON = function() {
  const config = this.toObject();
  
  if (config.isSecret) {
    config.value = '***HIDDEN***';
  }
  
  return config;
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
