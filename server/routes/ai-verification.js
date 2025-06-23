const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const { body, param } = require('express-validator');
const VerificationSession = require('../models/VerificationSession');
const AuditLog = require('../models/AuditLog');
const { auth, authorize } = require('../middleware/auth');
const { validateInput } = require('../middleware/validation');
const winston = require('winston');

const router = express.Router();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/ai-verification.log' }),
    new winston.transports.Console()
  ]
});

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Face verification endpoint
router.post('/face-verify',
  auth,
  upload.single('faceImage'),
  [
    body('voterId').trim().isLength({ min: 1 }).withMessage('Voter ID is required'),
    body('faceImage').optional(),
    body('timestamp').optional().isISO8601().withMessage('Invalid timestamp')
  ],
  validateInput,
  async (req, res) => {
    try {
      const { voterId, timestamp } = req.body;
      const faceImageData = req.body.faceImage; // Base64 data from frontend

      if (!faceImageData && !req.file) {
        return res.status(400).json({
          success: false,
          message: 'Face image is required'
        });
      }

      // Process the image
      let imageBuffer;
      if (faceImageData) {
        // Convert base64 to buffer
        const base64Data = faceImageData.replace(/^data:image\/[a-z]+;base64,/, '');
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        imageBuffer = req.file.buffer;
      }

      // Optimize image
      const processedImage = await sharp(imageBuffer)
        .resize(640, 480, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Generate image hash for security
      const imageHash = crypto.createHash('sha256').update(processedImage).digest('hex');

      // Simulate AI face recognition (replace with actual AI service)
      const faceVerificationResult = await simulateFaceRecognition(voterId, processedImage);

      // Create verification session
      const sessionId = `FV_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const session = new VerificationSession({
        sessionId,
        voter: {
          voterId,
          voterObjectId: null // Will be populated if voter found
        },
        operator: {
          userId: req.user.id,
          username: req.user.username,
          fullName: req.user.fullName
        },
        booth: {
          boothId: req.user.boothId || 'UNKNOWN',
          boothName: req.user.boothName || 'Unknown Booth'
        },
        verification: {
          method: 'FACE',
          status: faceVerificationResult.matched ? 'SUCCESS' : 'FAILED'
        },
        face: {
          imageHash,
          confidence: faceVerificationResult.confidence,
          attempts: [{
            imageHash,
            confidence: faceVerificationResult.confidence,
            timestamp: new Date(),
            result: faceVerificationResult.matched ? 'MATCH' : 'NO_MATCH'
          }]
        },
        results: {
          overallStatus: faceVerificationResult.matched ? 'SUCCESS' : 'FAILED',
          verificationScore: faceVerificationResult.confidence * 100,
          details: faceVerificationResult.details
        }
      });

      await session.save();

      // Log audit event
      await AuditLog.create({
        sessionId,
        action: 'FACE_VERIFICATION',
        targetType: 'VOTER',
        targetId: voterId,
        operatorId: req.user.id,
        boothId: req.user.boothId,
        details: {
          confidence: faceVerificationResult.confidence,
          matched: faceVerificationResult.matched,
          imageHash,
          processingTime: faceVerificationResult.processingTime
        },
        ipAddress: req.ip,
        timestamp: new Date()
      });

      logger.info('Face verification completed', {
        sessionId,
        voterId,
        matched: faceVerificationResult.matched,
        confidence: faceVerificationResult.confidence,
        userId: req.user.id,
        ip: req.ip
      });

      res.json({
        success: true,
        sessionId,
        matched: faceVerificationResult.matched,
        confidence: faceVerificationResult.confidence,
        message: faceVerificationResult.matched 
          ? 'Face verification successful'
          : 'Face verification failed - no match found',
        details: faceVerificationResult.details
      });

    } catch (error) {
      logger.error('Face verification error', {
        error: error.message,
        stack: error.stack,
        voterId: req.body.voterId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Face verification failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Document OCR endpoint
router.post('/document-ocr',
  auth,
  upload.single('document'),
  [
    body('voterId').trim().isLength({ min: 1 }).withMessage('Voter ID is required'),
    body('documentType').isIn(['AADHAAR', 'VOTER_ID', 'PAN', 'PASSPORT', 'DRIVING_LICENSE']).withMessage('Invalid document type')
  ],
  validateInput,
  async (req, res) => {
    try {
      const { voterId, documentType } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Document image is required'
        });
      }

      // Process the document image
      const processedImage = await sharp(req.file.buffer)
        .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();

      // Generate document hash
      const documentHash = crypto.createHash('sha256').update(processedImage).digest('hex');

      // Simulate OCR processing (replace with actual OCR service)
      const ocrResult = await simulateDocumentOCR(documentType, processedImage);

      logger.info('Document OCR completed', {
        voterId,
        documentType,
        documentHash,
        extractedFields: Object.keys(ocrResult.extractedData),
        userId: req.user.id,
        ip: req.ip
      });

      res.json({
        success: true,
        data: ocrResult.extractedData,
        documentHash,
        confidence: ocrResult.confidence,
        processingTime: ocrResult.processingTime
      });

    } catch (error) {
      logger.error('Document OCR error', {
        error: error.message,
        stack: error.stack,
        voterId: req.body.voterId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Document OCR failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Document verification endpoint
router.post('/document-verify',
  auth,
  [
    body('voterId').trim().isLength({ min: 1 }).withMessage('Voter ID is required'),
    body('documentType').isIn(['AADHAAR', 'VOTER_ID', 'PAN', 'PASSPORT', 'DRIVING_LICENSE']).withMessage('Invalid document type'),
    body('extractedData').isObject().withMessage('Extracted data is required'),
    body('documentHash').trim().isLength({ min: 1 }).withMessage('Document hash is required')
  ],
  validateInput,
  async (req, res) => {
    try {
      const { voterId, documentType, extractedData, documentHash } = req.body;

      // Simulate document verification against voter database
      const verificationResult = await simulateDocumentVerification(voterId, documentType, extractedData);

      // Create verification session
      const sessionId = `DV_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const session = new VerificationSession({
        sessionId,
        voter: {
          voterId,
          voterObjectId: null
        },
        operator: {
          userId: req.user.id,
          username: req.user.username,
          fullName: req.user.fullName
        },
        booth: {
          boothId: req.user.boothId || 'UNKNOWN',
          boothName: req.user.boothName || 'Unknown Booth'
        },
        verification: {
          method: 'DOCUMENT',
          status: verificationResult.isValid ? 'SUCCESS' : 'FAILED'
        },
        document: {
          type: documentType,
          imageHash: documentHash,
          ocrResults: extractedData,
          verificationResult: {
            isValid: verificationResult.isValid,
            details: verificationResult.details,
            timestamp: new Date()
          }
        },
        results: {
          overallStatus: verificationResult.isValid ? 'SUCCESS' : 'FAILED',
          verificationScore: verificationResult.matchScore * 100,
          details: verificationResult.details
        }
      });

      await session.save();

      // Log audit event
      await AuditLog.create({
        sessionId,
        action: 'DOCUMENT_VERIFICATION',
        targetType: 'VOTER',
        targetId: voterId,
        operatorId: req.user.id,
        boothId: req.user.boothId,
        details: {
          documentType,
          isValid: verificationResult.isValid,
          matchScore: verificationResult.matchScore,
          documentHash,
          extractedFields: Object.keys(extractedData)
        },
        ipAddress: req.ip,
        timestamp: new Date()
      });

      logger.info('Document verification completed', {
        sessionId,
        voterId,
        documentType,
        isValid: verificationResult.isValid,
        matchScore: verificationResult.matchScore,
        userId: req.user.id,
        ip: req.ip
      });

      res.json({
        success: true,
        sessionId,
        verification: verificationResult
      });

    } catch (error) {
      logger.error('Document verification error', {
        error: error.message,
        stack: error.stack,
        voterId: req.body.voterId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Document verification failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Fraud detection endpoint
router.post('/fraud-detection',
  auth,
  [
    body('voterId').trim().isLength({ min: 1 }).withMessage('Voter ID is required'),
    body('sessionData').isObject().withMessage('Session data is required')
  ],
  validateInput,
  async (req, res) => {
    try {
      const { voterId, sessionData } = req.body;

      // Simulate fraud detection analysis
      const fraudAnalysis = await simulateFraudDetection(voterId, sessionData, req.user);

      logger.info('Fraud detection completed', {
        voterId,
        riskScore: fraudAnalysis.riskScore,
        riskLevel: fraudAnalysis.riskLevel,
        flagsDetected: fraudAnalysis.flags.length,
        userId: req.user.id,
        ip: req.ip
      });

      res.json({
        success: true,
        analysis: fraudAnalysis
      });

    } catch (error) {
      logger.error('Fraud detection error', {
        error: error.message,
        stack: error.stack,
        voterId: req.body.voterId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Fraud detection failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Simulate face recognition (replace with actual AI service)
async function simulateFaceRecognition(voterId, imageBuffer) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  // Simulate AI confidence score
  const confidence = 0.7 + Math.random() * 0.25; // 70-95% confidence
  const matched = confidence > 0.8;

  return {
    matched,
    confidence,
    processingTime: 1000 + Math.random() * 2000,
    details: {
      faceDetected: true,
      qualityScore: 0.8 + Math.random() * 0.2,
      landmarks: 68, // Number of facial landmarks detected
      features: {
        eyes: 'detected',
        nose: 'detected',
        mouth: 'detected'
      }
    }
  };
}

// Simulate document OCR (replace with actual OCR service)
async function simulateDocumentOCR(documentType, imageBuffer) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

  const ocrData = {
    AADHAAR: {
      name: 'John Doe',
      aadhaarNumber: '1234 5678 9012',
      dateOfBirth: '15/01/1990',
      gender: 'Male',
      address: '123 Main Street, City, State - 123456'
    },
    VOTER_ID: {
      name: 'John Doe',
      voterIdNumber: 'ABC1234567',
      dateOfBirth: '15/01/1990',
      gender: 'Male',
      address: '123 Main Street, City, State - 123456',
      pollingStation: 'Station 001'
    },
    PAN: {
      name: 'John Doe',
      panNumber: 'ABCDE1234F',
      dateOfBirth: '15/01/1990',
      fatherName: 'Richard Doe'
    },
    PASSPORT: {
      name: 'John Doe',
      passportNumber: 'A1234567',
      dateOfBirth: '15/01/1990',
      nationality: 'Indian',
      placeOfBirth: 'Mumbai'
    },
    DRIVING_LICENSE: {
      name: 'John Doe',
      licenseNumber: 'DL123456789',
      dateOfBirth: '15/01/1990',
      address: '123 Main Street, City, State - 123456',
      validFrom: '01/01/2020',
      validUpto: '01/01/2040'
    }
  };

  return {
    extractedData: ocrData[documentType] || {},
    confidence: 0.85 + Math.random() * 0.1,
    processingTime: 2000 + Math.random() * 3000
  };
}

// Simulate document verification
async function simulateDocumentVerification(voterId, documentType, extractedData) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  // Simulate verification logic
  const matchScore = 0.8 + Math.random() * 0.15;
  const isValid = matchScore > 0.85;

  const issues = [];
  if (matchScore < 0.9) {
    issues.push('Minor discrepancies in name formatting');
  }
  if (matchScore < 0.8) {
    issues.push('Date of birth mismatch');
  }

  return {
    isValid,
    matchScore,
    issues,
    details: {
      nameMatch: matchScore > 0.9,
      dobMatch: matchScore > 0.85,
      addressMatch: matchScore > 0.8,
      documentValid: true,
      checksumValid: true
    }
  };
}

// Simulate fraud detection
async function simulateFraudDetection(voterId, sessionData, user) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  const flags = [];
  let riskScore = 0;

  // Simulate various fraud checks
  const timeOfDay = new Date().getHours();
  if (timeOfDay < 6 || timeOfDay > 22) {
    flags.push('Unusual verification time');
    riskScore += 20;
  }

  // Simulate multiple verification attempts
  if (Math.random() > 0.8) {
    flags.push('Multiple verification attempts detected');
    riskScore += 30;
  }

  // Simulate location anomalies
  if (Math.random() > 0.9) {
    flags.push('Verification from unusual location');
    riskScore += 25;
  }

  // Simulate device fingerprinting
  if (Math.random() > 0.85) {
    flags.push('Unknown device detected');
    riskScore += 15;
  }

  // Determine risk level
  let riskLevel = 'LOW';
  if (riskScore > 50) riskLevel = 'HIGH';
  else if (riskScore > 25) riskLevel = 'MEDIUM';

  return {
    riskScore,
    riskLevel,
    flags,
    recommendations: riskLevel === 'HIGH' 
      ? ['Require additional verification', 'Manual review recommended']
      : riskLevel === 'MEDIUM'
      ? ['Monitor additional attempts', 'Consider secondary verification']
      : ['Proceed with standard verification'],
    details: {
      timeAnalysis: { unusual: timeOfDay < 6 || timeOfDay > 22 },
      locationAnalysis: { suspicious: false },
      behaviorAnalysis: { rapidAttempts: false },
      deviceAnalysis: { trusted: true }
    }
  };
}

module.exports = router;
