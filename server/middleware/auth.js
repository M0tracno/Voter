const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Booth = require('../models/Booth');
const { logger } = require('../database/init');

// Main authentication middleware
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if it's a user or booth token
      if (decoded.userId) {
        // User token
        const user = await User.findById(decoded.userId).select('-password -refreshTokens');
        
        if (!user || !user.isActive) {
          return res.status(401).json({ error: 'User not found or inactive.' });
        }

        // Check if user account is locked
        if (user.isLocked) {
          return res.status(423).json({ error: 'Account is locked.' });
        }

        req.user = user;
        req.userType = 'user';
      } else if (decoded.boothId) {
        // Booth token
        const booth = await Booth.findByApiToken(decoded.apiToken);
        
        if (!booth) {
          return res.status(401).json({ error: 'Booth not found or inactive.' });
        }

        req.booth = booth;
        req.userType = 'booth';
      } else {
        return res.status(401).json({ error: 'Invalid token format.' });
      }

      // Add token info to request
      req.tokenPayload = decoded;
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token.',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw jwtError;
      }
    }

  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed.' });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.userId) {
        const user = await User.findById(decoded.userId).select('-password -refreshTokens');
        if (user && user.isActive && !user.isLocked) {
          req.user = user;
          req.userType = 'user';
          req.tokenPayload = decoded;
        }
      } else if (decoded.boothId) {
        const booth = await Booth.findByApiToken(decoded.apiToken);
        if (booth) {
          req.booth = booth;
          req.userType = 'booth';
          req.tokenPayload = decoded;
        }
      }
    } catch (jwtError) {
      // Silently ignore token errors for optional auth
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next(); // Continue without authentication
  }
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user && !req.booth) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // If it's a booth request, check if booth access is allowed
    if (req.booth && allowedRoles.includes('booth')) {
      return next();
    }

    // For user requests, check role
    if (req.user) {
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }

      // Special handling for admin role (can access everything)
      if (req.user.role === 'admin') {
        return next();
      }
    }

    res.status(403).json({ 
      error: 'Insufficient permissions.',
      required: allowedRoles,
      current: req.user?.role || req.userType
    });
  };
};

// Permission-based authorization middleware
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Admin users have all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has the specific permission
    const hasPermission = req.user.permissions.some(permission => 
      permission.resource === resource && permission.actions.includes(action)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions.',
        required: `${action} on ${resource}`,
        userPermissions: req.user.permissions
      });
    }

    next();
  };
};

// Booth authentication middleware
const boothAuth = async (req, res, next) => {
  try {
    const { boothId, apiToken } = req.body;

    if (!boothId || !apiToken) {
      return res.status(400).json({ 
        error: 'Booth ID and API token are required in request body.' 
      });
    }

    const booth = await Booth.findOne({
      boothId: boothId.toUpperCase(),
      'security.apiToken': apiToken,
      'status.operational': 'ACTIVE'
    }).populate('staff.operators.userId', 'username fullName');

    if (!booth) {
      return res.status(401).json({ 
        error: 'Invalid booth credentials or booth is inactive.' 
      });
    }

    // Check if booth is operational
    if (!booth.isOperational()) {
      return res.status(403).json({ 
        error: 'Booth is not operational at this time.' 
      });
    }

    // Check IP restrictions if configured
    if (booth.security.allowedIPs && booth.security.allowedIPs.length > 0) {
      const clientIP = req.ip || req.connection.remoteAddress;
      if (!booth.security.allowedIPs.includes(clientIP)) {
        return res.status(403).json({ 
          error: 'Access denied from this IP address.' 
        });
      }
    }

    req.booth = booth;
    req.userType = 'booth';
    
    next();
  } catch (error) {
    logger.error('Booth authentication error:', error);
    res.status(500).json({ error: 'Booth authentication failed.' });
  }
};

// Rate limiting by user/booth
const createUserRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const identifier = req.user?._id?.toString() || 
                     req.booth?._id?.toString() || 
                     req.ip;

    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(identifier)) {
      const userRequests = requests.get(identifier);
      const validRequests = userRequests.filter(time => time > windowStart);
      requests.set(identifier, validRequests);
    } else {
      requests.set(identifier, []);
    }

    const currentRequests = requests.get(identifier);

    if (currentRequests.length >= max) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((currentRequests[0] + windowMs - now) / 1000)
      });
    }

    currentRequests.push(now);
    next();
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS for HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

// Request ID middleware for tracking
const requestId = (req, res, next) => {
  req.id = req.get('X-Request-ID') || 
          `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Session management middleware
const sessionManagement = async (req, res, next) => {
  if (req.user) {
    // Update last activity
    req.user.lastLogin = new Date();
    
    // Clean expired refresh tokens periodically
    if (Math.random() < 0.1) { // 10% chance
      await req.user.cleanExpiredTokens();
    }
  }
  
  next();
};

module.exports = {
  auth,
  optionalAuth,
  authorize,
  requirePermission,  boothAuth,
  createUserRateLimiter,
  securityHeaders,
  requestId,
  sessionManagement
};
