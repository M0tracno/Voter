const validator = require('validator');
const { logger } = require('../database/init');

// Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const sanitizedData = {};

    try {
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];

        // Check if field is required
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push({
            field,
            message: `${field} is required`,
            code: 'REQUIRED'
          });
          continue;
        }

        // Skip validation if field is optional and not provided
        if (!rules.required && (value === undefined || value === null || value === '')) {
          if (rules.default !== undefined) {
            sanitizedData[field] = rules.default;
          }
          continue;
        }

        // Type validation
        if (rules.type) {
          switch (rules.type) {
            case 'string':
              if (typeof value !== 'string') {
                errors.push({
                  field,
                  message: `${field} must be a string`,
                  code: 'INVALID_TYPE'
                });
                continue;
              }
              break;
            case 'number':
              if (typeof value !== 'number' && !validator.isNumeric(String(value))) {
                errors.push({
                  field,
                  message: `${field} must be a number`,
                  code: 'INVALID_TYPE'
                });
                continue;
              }
              break;
            case 'boolean':
              if (typeof value !== 'boolean') {
                errors.push({
                  field,
                  message: `${field} must be a boolean`,
                  code: 'INVALID_TYPE'
                });
                continue;
              }
              break;
            case 'email':
              if (!validator.isEmail(String(value))) {
                errors.push({
                  field,
                  message: `${field} must be a valid email address`,
                  code: 'INVALID_FORMAT'
                });
                continue;
              }
              break;
            case 'array':
              if (!Array.isArray(value)) {
                errors.push({
                  field,
                  message: `${field} must be an array`,
                  code: 'INVALID_TYPE'
                });
                continue;
              }
              break;
          }
        }

        // String validations
        if (typeof value === 'string') {
          // Length validations
          if (rules.minLength && value.length < rules.minLength) {
            errors.push({
              field,
              message: `${field} must be at least ${rules.minLength} characters long`,
              code: 'MIN_LENGTH'
            });
            continue;
          }

          if (rules.maxLength && value.length > rules.maxLength) {
            errors.push({
              field,
              message: `${field} must be no more than ${rules.maxLength} characters long`,
              code: 'MAX_LENGTH'
            });
            continue;
          }

          if (rules.length && value.length !== rules.length) {
            errors.push({
              field,
              message: `${field} must be exactly ${rules.length} characters long`,
              code: 'EXACT_LENGTH'
            });
            continue;
          }

          // Pattern validation
          if (rules.pattern && !rules.pattern.test(value)) {
            errors.push({
              field,
              message: `${field} format is invalid`,
              code: 'INVALID_FORMAT'
            });
            continue;
          }

          // Format validations
          if (rules.format) {
            switch (rules.format) {
              case 'email':
                if (!validator.isEmail(value)) {
                  errors.push({
                    field,
                    message: `${field} must be a valid email address`,
                    code: 'INVALID_FORMAT'
                  });
                  continue;
                }
                break;
              case 'url':
                if (!validator.isURL(value)) {
                  errors.push({
                    field,
                    message: `${field} must be a valid URL`,
                    code: 'INVALID_FORMAT'
                  });
                  continue;
                }
                break;
              case 'uuid':
                if (!validator.isUUID(value)) {
                  errors.push({
                    field,
                    message: `${field} must be a valid UUID`,
                    code: 'INVALID_FORMAT'
                  });
                  continue;
                }
                break;
              case 'phone':
                if (!validator.isMobilePhone(value, 'any')) {
                  errors.push({
                    field,
                    message: `${field} must be a valid phone number`,
                    code: 'INVALID_FORMAT'
                  });
                  continue;
                }
                break;
            }
          }
        }

        // Number validations
        if (typeof value === 'number' || validator.isNumeric(String(value))) {
          const numValue = Number(value);

          if (rules.min && numValue < rules.min) {
            errors.push({
              field,
              message: `${field} must be at least ${rules.min}`,
              code: 'MIN_VALUE'
            });
            continue;
          }

          if (rules.max && numValue > rules.max) {
            errors.push({
              field,
              message: `${field} must be no more than ${rules.max}`,
              code: 'MAX_VALUE'
            });
            continue;
          }
        }

        // Enum validation
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push({
            field,
            message: `${field} must be one of: ${rules.enum.join(', ')}`,
            code: 'INVALID_ENUM'
          });
          continue;
        }

        // Custom validation
        if (rules.custom && typeof rules.custom === 'function') {
          const customResult = rules.custom(value);
          if (customResult !== true) {
            errors.push({
              field,
              message: customResult || `${field} is invalid`,
              code: 'CUSTOM_VALIDATION'
            });
            continue;
          }
        }

        // If we get here, the field is valid
        sanitizedData[field] = value;
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
          code: 'VALIDATION_ERROR'
        });
      }

      // Replace req.body with sanitized data
      req.validatedData = sanitizedData;
      next();

    } catch (error) {
      logger.error('Validation middleware error:', error);
      res.status(500).json({
        error: 'Validation error',
        code: 'VALIDATION_SYSTEM_ERROR'
      });
    }
  };
};

// Input sanitization helper
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    // Remove null bytes and normalize
    return validator.escape(data.replace(/\0/g, '').trim());
  }
  
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(sanitizeInput);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
};

// Common validation schemas
const commonSchemas = {
  // User schemas
  userLogin: {
    identifier: { type: 'string', required: true, minLength: 3, maxLength: 100 },
    password: { type: 'string', required: true, minLength: 8, maxLength: 128 }
  },

  userRegistration: {
    username: { 
      type: 'string', 
      required: true, 
      minLength: 3, 
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_-]+$/
    },
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, minLength: 8, maxLength: 128 },
    firstName: { type: 'string', required: true, minLength: 1, maxLength: 50 },
    lastName: { type: 'string', required: true, minLength: 1, maxLength: 50 }
  },

  // Voter schemas
  voterSearch: {
    query: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    searchType: { 
      type: 'string', 
      required: true, 
      enum: ['voterId', 'mobile', 'name', 'all'] 
    },
    limit: { type: 'number', optional: true, min: 1, max: 100, default: 25 },
    offset: { type: 'number', optional: true, min: 0, default: 0 }
  },

  voterCreate: {
    voterId: { 
      type: 'string', 
      required: true, 
      pattern: /^[A-Z0-9]{6,20}$/,
      minLength: 6,
      maxLength: 20
    },
    fullName: { type: 'string', required: true, minLength: 1, maxLength: 200 },
    dateOfBirth: { type: 'string', required: true, format: 'date' },
    gender: { type: 'string', required: true, enum: ['M', 'F', 'O'] },
    mobileNumber: { 
      type: 'string', 
      required: true, 
      pattern: /^[6-9]\d{9}$/
    }
  },

  // Verification schemas
  otpGenerate: {
    voterId: { type: 'string', required: true, minLength: 6, maxLength: 20 },
    mobileNumber: { type: 'string', required: true, pattern: /^[6-9]\d{9}$/ }
  },

  otpVerify: {
    sessionId: { type: 'string', required: true },
    otpCode: { type: 'string', required: true, length: 6, pattern: /^\d{6}$/ }
  },

  // Booth schemas
  boothAuth: {
    boothId: { type: 'string', required: true, minLength: 3, maxLength: 50 },
    apiToken: { type: 'string', required: true, minLength: 32 }
  }
};

// File upload validation
const validateFileUpload = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    required = false
  } = options;

  return (req, res, next) => {
    if (!req.file && required) {
      return res.status(400).json({
        error: 'File upload is required',
        code: 'FILE_REQUIRED'
      });
    }

    if (!req.file) {
      return next();
    }

    // Check file size
    if (req.file.size > maxSize) {
      return res.status(400).json({
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
        code: 'FILE_TOO_LARGE'
      });
    }

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: `File type must be one of: ${allowedTypes.join(', ')}`,
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Sanitize filename
    if (req.file.originalname) {
      req.file.safeName = req.file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .toLowerCase();
    }

    next();
  };
};

// Rate limiting validation
const validateRateLimit = (windowMs = 60000, maxRequests = 60) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(key)) {
      const userRequests = requests.get(key);
      const validRequests = userRequests.filter(time => time > windowStart);
      requests.set(key, validRequests);
    } else {
      requests.set(key, []);
    }

    const currentRequests = requests.get(key);

    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((currentRequests[0] + windowMs - now) / 1000),
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    currentRequests.push(now);
    next();
  };
};

// SQL injection prevention
const preventSQLInjection = (req, res, next) => {
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', 'EVAL'
  ];

  const checkForSQL = (obj) => {
    if (typeof obj === 'string') {
      const upperValue = obj.toUpperCase();
      for (const keyword of sqlKeywords) {
        if (upperValue.includes(keyword)) {
          return true;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        if (checkForSQL(value)) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkForSQL(req.body) || checkForSQL(req.query) || checkForSQL(req.params)) {
    logger.warn('Potential SQL injection attempt detected', {
      ip: req.ip,
      url: req.url,
      body: req.body,
      query: req.query,
      params: req.params
    });

    return res.status(400).json({
      error: 'Invalid input detected',
      code: 'INVALID_INPUT'
    });
  }

  next();
};

module.exports = {
  validateInput,
  sanitizeInput,
  commonSchemas,
  validateFileUpload,
  validateRateLimit,
  preventSQLInjection
};
