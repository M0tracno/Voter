const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const SystemConfig = require('../models/SystemConfig');
const { auth, authorize } = require('../middleware/auth');
const { validateInput, sanitizeInput } = require('../middleware/validation');
const { logger } = require('../database/init');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation schemas
const loginSchema = {
  identifier: { type: 'string', required: true, minLength: 3, maxLength: 100 },
  password: { type: 'string', required: true, minLength: 8, maxLength: 128 },
  rememberMe: { type: 'boolean', default: false },
  twoFactorCode: { type: 'string', optional: true, length: 6 }
};

const registerSchema = {
  username: { type: 'string', required: true, minLength: 3, maxLength: 50, pattern: /^[a-zA-Z0-9_-]+$/ },
  email: { type: 'string', required: true, format: 'email' },
  password: { type: 'string', required: true, minLength: 8, maxLength: 128 },
  confirmPassword: { type: 'string', required: true },
  firstName: { type: 'string', required: true, minLength: 1, maxLength: 50 },
  lastName: { type: 'string', required: true, minLength: 1, maxLength: 50 },
  phoneNumber: { type: 'string', optional: true, pattern: /^\+?[\d\s-()]+$/ },
  role: { type: 'string', optional: true, enum: ['admin', 'operator', 'supervisor', 'viewer'] }
};

const changePasswordSchema = {
  currentPassword: { type: 'string', required: true },
  newPassword: { type: 'string', required: true, minLength: 8, maxLength: 128 },
  confirmNewPassword: { type: 'string', required: true }
};

// Generate JWT tokens
const generateTokens = async (user, req) => {
  const jwtExpiry = await SystemConfig.getValue('JWT_EXPIRY_MINUTES') || 60;
  const refreshTokenExpiry = await SystemConfig.getValue('REFRESH_TOKEN_EXPIRY_DAYS') || 30;
  
  const accessToken = jwt.sign(
    { 
      userId: user._id, 
      username: user.username, 
      role: user.role,
      permissions: user.permissions 
    },
    process.env.JWT_SECRET,
    { expiresIn: `${jwtExpiry}m` }
  );

  const refreshToken = jwt.sign(
    { userId: user._id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${refreshTokenExpiry}d` }
  );

  // Store refresh token in user document
  await user.addRefreshToken(refreshToken, req?.get('User-Agent'));

  return { accessToken, refreshToken, expiresIn: jwtExpiry * 60 };
};

// POST /api/auth/register - Register new user
router.post('/register', authLimiter, validateInput(registerSchema), async (req, res) => {
  try {
    const userData = sanitizeInput(req.body);
    
    // Check if passwords match
    if (userData.password !== userData.confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match',
        field: 'confirmPassword'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email.toLowerCase() },
        { username: userData.username }
      ]
    });

    if (existingUser) {
      const field = existingUser.email === userData.email.toLowerCase() ? 'email' : 'username';
      return res.status(409).json({
        error: `User with this ${field} already exists`,
        field
      });
    }

    // Create new user
    const user = new User({
      username: userData.username,
      email: userData.email.toLowerCase(),
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      role: userData.role || 'operator',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await user.save();

    // Log user creation
    await AuditLog.logSystemAction(
      'USER_CREATE',
      { type: 'USER', id: user._id.toString(), name: user.fullName },
      {
        description: `New user registered: ${user.username}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }    );

    // Generate tokens
    const tokens = await generateTokens(user, req);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions
      },
      tokens
    });

  } catch (error) {
    logger.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const field = Object.keys(error.errors)[0];
      return res.status(400).json({
        error: error.errors[field].message,
        field
      });
    }

    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login - User login
router.post('/login', loginLimiter, validateInput(loginSchema), async (req, res) => {
  try {
    const { identifier, password, rememberMe, twoFactorCode } = sanitizeInput(req.body);

    // Find user by email or username
    const user = await User.findByCredentials(identifier, password);

    // Check if 2FA is enabled and required
    if (user.twoFactorEnabled && !twoFactorCode) {
      return res.status(200).json({
        requiresTwoFactor: true,
        message: 'Two-factor authentication required'
      });
    }

    // Verify 2FA code if provided
    if (user.twoFactorEnabled && twoFactorCode) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        await AuditLog.logUserAction(
          user,
          'LOGIN',
          { type: 'USER', id: user._id.toString(), name: user.fullName },
          {
            description: 'Failed login attempt - Invalid 2FA code',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          },
          { status: 'FAILED', message: 'Invalid two-factor code' }
        );

        return res.status(401).json({
          error: 'Invalid two-factor authentication code'
        });
      }
    }    // Generate tokens
    const tokens = await generateTokens(user, req);

    // Log successful login
    await AuditLog.logUserAction(
      user,
      'LOGIN',
      { type: 'USER', id: user._id.toString(), name: user.fullName },
      {
        description: 'Successful login',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { rememberMe, twoFactorUsed: user.twoFactorEnabled }
      }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions,
        lastLogin: user.lastLogin,
        preferences: user.preferences
      },
      tokens
    });

  } catch (error) {
    logger.error('Login error:', error);

    // Log failed login attempt
    await AuditLog.logSystemAction(
      'LOGIN',
      { type: 'SYSTEM', id: 'UNKNOWN', name: 'Failed Login' },
      {
        description: `Failed login attempt for: ${req.body.identifier}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { identifier: req.body.identifier }
      },
      { status: 'FAILED', message: error.message }
    );

    if (error.message.includes('locked')) {
      return res.status(423).json({ error: error.message });
    }

    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if refresh token exists in user's token list
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken && rt.expiresAt > new Date());
    
    if (!tokenExists) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Clean expired tokens
    await user.cleanExpiredTokens();

    // Generate new tokens
    const tokens = await generateTokens(user, req);

    res.json({
      message: 'Token refreshed successfully',
      tokens
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', auth, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await req.user.removeRefreshToken(refreshToken);
    }

    // Log logout
    await AuditLog.logUserAction(
      req.user,
      'LOGOUT',
      { type: 'USER', id: req.user._id.toString(), name: req.user.fullName },
      {
        description: 'User logout',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({ message: 'Logout successful' });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// POST /api/auth/change-password - Change password
router.post('/change-password', auth, validateInput(changePasswordSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = sanitizeInput(req.body);

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        error: 'New passwords do not match',
        field: 'confirmNewPassword'
      });
    }

    // Verify current password
    const isValidPassword = await req.user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Current password is incorrect',
        field: 'currentPassword'
      });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    // Invalidate all refresh tokens (force re-login on all devices)
    req.user.refreshTokens = [];
    await req.user.save();

    // Log password change
    await AuditLog.logUserAction(
      req.user,
      'USER_UPDATE',
      { type: 'USER', id: req.user._id.toString(), name: req.user.fullName },
      {
        description: 'Password changed',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      { status: 'SUCCESS', message: 'Password updated successfully' }
    );

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// GET /api/auth/profile - Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshTokens -passwordResetToken -emailVerificationToken')
      .lean();

    res.json({ user });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'preferences'];
    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = sanitizeInput(req.body[field]);
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        ...updateData,
        'metadata.updatedBy': req.user._id,
        'metadata.ipAddress': req.ip,
        'metadata.userAgent': req.get('User-Agent')
      },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    // Log profile update
    await AuditLog.logUserAction(
      req.user,
      'USER_UPDATE',
      { type: 'USER', id: req.user._id.toString(), name: req.user.fullName },
      {
        description: 'Profile updated',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        oldValues: req.user.toObject(),
        newValues: updateData
      }
    );

    res.json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// POST /api/auth/setup-2fa - Setup two-factor authentication
router.post('/setup-2fa', auth, async (req, res) => {
  try {
    if (req.user.twoFactorEnabled) {
      return res.status(400).json({ error: 'Two-factor authentication is already enabled' });
    }

    const secret = speakeasy.generateSecret({
      name: `FastVerify (${req.user.email})`,
      issuer: 'FastVerify'
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });

  } catch (error) {
    logger.error('Setup 2FA error:', error);
    res.status(500).json({ error: 'Failed to setup two-factor authentication' });
  }
});

// POST /api/auth/verify-2fa - Verify and enable two-factor authentication
router.post('/verify-2fa', auth, async (req, res) => {
  try {
    const { secret, token } = req.body;

    if (!secret || !token) {
      return res.status(400).json({ error: 'Secret and token are required' });
    }

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Enable 2FA for user
    req.user.twoFactorSecret = secret;
    req.user.twoFactorEnabled = true;
    await req.user.save();

    // Log 2FA enablement
    await AuditLog.logUserAction(
      req.user,
      'SECURITY_ALERT',
      { type: 'USER', id: req.user._id.toString(), name: req.user.fullName },
      {
        description: 'Two-factor authentication enabled',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({ message: 'Two-factor authentication enabled successfully' });

  } catch (error) {
    logger.error('Verify 2FA error:', error);
    res.status(500).json({ error: 'Failed to verify two-factor authentication' });
  }
});

// POST /api/auth/disable-2fa - Disable two-factor authentication
router.post('/disable-2fa', auth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to disable 2FA' });
    }

    // Verify password
    const isValidPassword = await req.user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Disable 2FA
    req.user.twoFactorSecret = null;
    req.user.twoFactorEnabled = false;
    await req.user.save();

    // Log 2FA disablement
    await AuditLog.logUserAction(
      req.user,
      'SECURITY_ALERT',
      { type: 'USER', id: req.user._id.toString(), name: req.user.fullName },
      {
        description: 'Two-factor authentication disabled',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({ message: 'Two-factor authentication disabled successfully' });

  } catch (error) {
    logger.error('Disable 2FA error:', error);
    res.status(500).json({ error: 'Failed to disable two-factor authentication' });
  }
});

// POST /api/auth/setup - Setup booth and operator account
router.post('/setup', authLimiter, async (req, res) => {
  try {
    const {
      booth_id,
      operator_name,
      operator_id,
      username,
      email,
      password,
      location
    } = req.body;

    // Validate required fields
    if (!booth_id || !operator_name || !operator_id || !username || !email || !password) {
      return res.status(400).json({
        error: 'All fields are required',
        required: ['booth_id', 'operator_name', 'operator_id', 'username', 'email', 'password']
      });
    }    // Check if booth already exists
    const Booth = require('../models/Booth');
    const existingBooth = await Booth.findOne({ boothId: booth_id.toUpperCase() });
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username }
      ]
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
      return res.status(409).json({
        error: `User with this ${field} already exists`,
        field
      });
    }

    // Create new user (operator)
    const user = new User({
      username: username,
      email: email.toLowerCase(),
      password: password,
      firstName: operator_name.split(' ')[0] || operator_name,
      lastName: operator_name.split(' ').slice(1).join(' ') || '',
      role: 'operator',
      metadata: {
        operatorId: operator_id,
        boothId: booth_id.toUpperCase(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });    await user.save();

    // Create or update booth
    let booth;
    if (existingBooth) {
      // Update existing booth with new operator
      booth = existingBooth;      booth.staff.operators.push({
        userId: user._id,
        role: 'PRIMARY',
        assignedAt: new Date(),
        isActive: true
      });
    } else {
      // Create new booth
      booth = new Booth({
        boothId: booth_id.toUpperCase(),
        boothName: `Booth ${booth_id}`,
        boothNumber: booth_id,
        location: {
          address: {
            district: location?.district || 'Unknown',
            state: location?.state || 'Unknown',
            city: location?.city || 'Unknown',
            locality: location?.locality || '',
            street: location?.street || '',
            pincode: location?.pincode || ''
          }
        },
        constituency: {
          assembly: {
            name: location?.constituency || 'Unknown'
          },
          parliamentary: {
            name: location?.parliamentary || 'Unknown'
          }
        },
        staff: {
          operators: [{
            userId: user._id,
            role: 'PRIMARY',
            assignedAt: new Date(),
            isActive: true
          }],
          contactPerson: {
            name: operator_name,
            email: email,
            role: 'Operator'
          }
        },
        security: {
          // apiToken will be auto-generated by pre-save hook
        },
        audit: {
          createdBy: user._id
        },
        status: 'SETUP'
      });
    }    await booth.save();

    // Log booth setup
    await AuditLog.logSystemAction(
      'BOOTH_SETUP',
      { type: 'BOOTH', id: booth._id.toString(), name: booth.boothName },
      {
        description: `Booth setup completed: ${booth_id} by ${operator_name}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: {
          boothId: booth_id,
          operatorName: operator_name,
          operatorId: operator_id
        }
      }
    );    // Generate tokens
    const tokens = await generateTokens(user, req);

    res.status(201).json({
      message: 'Booth setup completed successfully',
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions
      },
      booth: {
        id: booth._id,
        boothId: booth.boothId,
        boothName: booth.boothName,
        location: booth.location
      }
    });  } catch (error) {
    logger.error('Booth setup error:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: `${field} already exists`,
        field
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to setup booth. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/auth/verify-token - Verify if token is valid
router.get('/verify-token', auth, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      fullName: req.user.fullName,
      role: req.user.role,
      permissions: req.user.permissions
    }
  });
});

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth routes are working', 
    timestamp: new Date(),
    server: 'fastverify'
  });
});

module.exports = router;
