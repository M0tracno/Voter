// Demo Mode Configuration
export const DEMO_CONFIG = {
  enabled: true, // Set to false to disable demo mode
  autoLogin: true,
  skipAuthentication: true,
  mockData: true,
  showDemoBanner: true,
  
  // Demo user credentials
  demoUser: {
    id: 'demo-user-001',
    username: 'demo@fastverify.com',
    name: 'Demo Admin',
    role: 'admin',
    permissions: ['read', 'write', 'admin', 'verify', 'audit']
  },

  // Demo booth configuration
  demoBooth: {
    id: 'demo-booth-001',
    name: 'Demo Verification Center',
    location: 'Demo City, Demo State',
    constituency: 'Demo Constituency',
    pollingStation: 'Demo Polling Station 001',
    operatorName: 'Demo Operator',
    isActive: true,
    features: {
      faceVerification: true,
      documentVerification: true,
      fraudDetection: true,
      analytics: true,
      offlineMode: true,
      pushNotifications: true
    }
  },

  // Demo voter data
  demoVoters: [
    {
      id: 'voter-001',
      voterId: 'ABC1234567',
      name: 'John Doe',
      fatherName: 'Robert Doe',
      age: 35,
      gender: 'Male',
      address: '123 Demo Street, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 001',
      verified: false,
      verificationDate: null,
      documents: {
        aadhar: '1234-5678-9012',
        pan: 'ABCDE1234F',
        passport: 'A12345678'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data',
        faceId: 'demo-face-data'
      }
    },
    {
      id: 'voter-002',
      voterId: 'XYZ9876543',
      name: 'Jane Smith',
      fatherName: 'Michael Smith',
      age: 28,
      gender: 'Female',
      address: '456 Demo Avenue, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 001',
      verified: true,
      verificationDate: '2025-06-23T10:30:00Z',
      documents: {
        aadhar: '9876-5432-1098',
        pan: 'ZYXWV9876E',
        passport: 'B98765432'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-2',
        faceId: 'demo-face-data-2'
      }
    },
    {
      id: 'voter-003',
      voterId: 'PQR5555555',
      name: 'Alice Johnson',
      fatherName: 'David Johnson',
      age: 42,
      gender: 'Female',
      address: '789 Demo Road, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 001',
      verified: false,
      verificationDate: null,
      documents: {
        aadhar: '5555-4444-3333',
        pan: 'PQRST5555U',
        passport: 'C55555555'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-3',
        faceId: 'demo-face-data-3'
      }
    }
  ],

  // Demo analytics data
  demoAnalytics: {
    totalVoters: 15420,
    verifiedVoters: 8934,
    pendingVerifications: 6486,
    todayVerifications: 342,
    hourlyStats: [
      { hour: '09:00', verifications: 45 },
      { hour: '10:00', verifications: 67 },
      { hour: '11:00', verifications: 89 },
      { hour: '12:00', verifications: 23 },
      { hour: '13:00', verifications: 56 },
      { hour: '14:00', verifications: 78 },
      { hour: '15:00', verifications: 91 },
      { hour: '16:00', verifications: 65 }
    ],
    verificationTypes: {
      manual: 60,
      face: 25,
      document: 15
    },
    fraudDetection: {
      flagged: 12,
      resolved: 8,
      pending: 4
    }
  },

  // Demo audit logs
  demoAuditLogs: [
    {
      id: 'audit-001',
      timestamp: '2025-06-23T14:30:00Z',
      action: 'VOTER_VERIFIED',
      userId: 'demo-user-001',
      userName: 'Demo Admin',
      voterId: 'XYZ9876543',
      voterName: 'Jane Smith',
      details: 'Voter successfully verified using face recognition',
      ip: '192.168.1.100',
      status: 'SUCCESS'
    },
    {
      id: 'audit-002',
      timestamp: '2025-06-23T14:25:00Z',
      action: 'DOCUMENT_VERIFICATION',
      userId: 'demo-user-001',
      userName: 'Demo Admin',
      voterId: 'ABC1234567',
      voterName: 'John Doe',
      details: 'Document verification initiated for Aadhar card',
      ip: '192.168.1.100',
      status: 'PENDING'
    },
    {
      id: 'audit-003',
      timestamp: '2025-06-23T14:20:00Z',
      action: 'FRAUD_DETECTED',
      userId: 'system',
      userName: 'System',
      voterId: 'PQR5555555',
      voterName: 'Alice Johnson',
      details: 'Potential fraud detected - multiple verification attempts',
      ip: '192.168.1.101',
      status: 'FLAGGED'
    },
    {
      id: 'audit-004',
      timestamp: '2025-06-23T14:15:00Z',
      action: 'USER_LOGIN',
      userId: 'demo-user-001',
      userName: 'Demo Admin',
      details: 'User logged into the system',
      ip: '192.168.1.100',
      status: 'SUCCESS'
    },
    {
      id: 'audit-005',
      timestamp: '2025-06-23T14:10:00Z',
      action: 'SYSTEM_BACKUP',
      userId: 'system',
      userName: 'System',
      details: 'Automatic system backup completed',
      ip: 'localhost',
      status: 'SUCCESS'
    }
  ],

  // Demo verification sessions
  demoSessions: [
    {
      id: 'session-001',
      voterId: 'ABC1234567',
      startTime: '2025-06-23T14:30:00Z',
      endTime: null,
      status: 'IN_PROGRESS',
      verificationType: 'FACE_RECOGNITION',
      operator: 'demo-user-001',
      attempts: 1
    }
  ],

  // Demo settings
  demoSettings: {
    verification: {
      requireFaceMatch: true,
      documentVerificationEnabled: true,
      fraudDetectionEnabled: true,
      minimumMatchScore: 85,
      maxVerificationAttempts: 3
    },
    notifications: {
      pushNotificationsEnabled: true,
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false
    },
    system: {
      autoBackupEnabled: true,
      backupInterval: 24,
      offlineModeEnabled: true,
      debugMode: true
    }
  }
};

// Helper functions for demo mode
export const isDemoMode = () => DEMO_CONFIG.enabled;

export const getDemoData = (type) => {
  switch (type) {
    case 'voters':
      return DEMO_CONFIG.demoVoters;
    case 'analytics':
      return DEMO_CONFIG.demoAnalytics;
    case 'auditLogs':
      return DEMO_CONFIG.demoAuditLogs;
    case 'settings':
      return DEMO_CONFIG.demoSettings;
    case 'booth':
      return DEMO_CONFIG.demoBooth;
    case 'user':
      return DEMO_CONFIG.demoUser;
    case 'sessions':
      return DEMO_CONFIG.demoSessions;
    default:
      return null;
  }
};

export const simulateApiCall = (data, delay = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: data,
        message: 'Demo mode - Simulated API response'
      });
    }, delay);
  });
};

export const simulateApiError = (message = 'Demo error', delay = 1000) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject({
        success: false,
        message: message,
        error: 'DEMO_ERROR'
      });
    }, delay);
  });
};
