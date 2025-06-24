// Demo Mode Configuration
export const DEMO_CONFIG = {
  enabled: true, // Set to false to disable demo mode
  autoLogin: true,
  skipAuthentication: true,
  mockData: true,
  showDemoBanner: true,
  liveDemo: true, // Adds new verifications periodically
  
  // Enhanced demo features
  realTimeUpdates: true,
  animatedStats: true,
  simulatedTraffic: true,
  dynamicNotifications: true,
  
  // Live demo intervals (in milliseconds)
  verificationInterval: 8000, // New verification every 8 seconds
  statsUpdateInterval: 3000,  // Update stats every 3 seconds
  notificationInterval: 15000, // Show notifications every 15 seconds
  
  // Demo analytics data
  demoAnalytics: {
    todayVerifications: 438,
    successfulVerifications: 392,
    failedVerifications: 46,
    averageTime: 8.2, // seconds
    activeUsers: 5,
    systemLoad: 65 // percent
  },
  
  // Important: Define demo sessions explicitly so they're available 
  demoSessions: [
    {
      id: 'session-001',
      voter_id: 'TUV4444444',
      voter_name: 'Lisa Thompson',
      verification_method: 'Document Verification',
      status: 'IN_PROGRESS',
      location: 'Central Booth A'
    },
    {
      id: 'session-002',
      voter_id: 'FGH2468135',
      voter_name: 'Anjali Patel',
      verification_method: 'Face Recognition',
      status: 'COMPLETED',
      location: 'North Wing B'
    },
    {
      id: 'session-003',
      voter_id: 'WXY1234567',
      voter_name: 'Rajesh Kumar',
      verification_method: 'Manual Review',
      status: 'COMPLETED',
      location: 'South Section C' 
    },
    {
      id: 'session-004',
      voter_id: 'UVW1111111',
      voter_name: 'Priya Sharma',
      verification_method: 'Biometric Scan',
      status: 'ACTIVE',
      location: 'East Block D'
    },
    {
      id: 'session-005',
      voter_id: 'ZAB9876543',
      voter_name: 'Maria Rodriguez',
      verification_method: 'Document Verification',
      status: 'FLAGGED',
      location: 'West Area E'
    },
    {
      id: 'session-006',
      voter_id: 'RST6666666',
      voter_name: 'David Martinez',
      verification_method: 'Face Recognition',
      status: 'FAILED',
      location: 'Ground Floor F'
    },    {
      id: 'session-007',
      voter_id: 'QRS8888888',
      voter_name: 'James Anderson',
      verification_method: 'QR Code Scan',
      status: 'ACTIVE',
      location: 'Main Hall H'
    }
  ],
  
  // Enhanced demo features
  realTimeUpdates: true,
  animatedStats: true,
  simulatedTraffic: true,
  dynamicNotifications: true,
  
  // Live demo intervals (in milliseconds)
  verificationInterval: 8000, // New verification every 8 seconds
  statsUpdateInterval: 3000,  // Update stats every 3 seconds
  notificationInterval: 15000, // Show notifications every 15 seconds
  
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
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNlNWU3ZWIiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iIzk0YTNiOCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjOTRhM2I4Ii8+PC9zdmc+',
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
      pollingStation: 'Demo Polling Station 001',      verified: true,
      verificationDate: '2025-06-24T10:30:00Z',
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNmM2U4ZmYiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iI2FkOThmOSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjYWQ5OGY5Ii8+PC9zdmc+',
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
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNmZWY5YzMiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iIzg0Y2M3OSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjODRjYzc5Ii8+PC9zdmc+',
      documents: {
        aadhar: '5555-4444-3333',
        pan: 'PQRST5555U',
        passport: 'C55555555'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-3',
        faceId: 'demo-face-data-3'
      }
    },
    {
      id: 'voter-004',
      voterId: 'DEF7777777',
      name: 'Michael Brown',
      fatherName: 'William Brown',
      age: 55,
      gender: 'Male',
      address: '321 Democracy Lane, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 001',      verified: true,
      verificationDate: '2025-06-24T09:15:00Z',
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNkZGY0ZmYiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iIzM5OGVmNyIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjMzk4ZWY3Ii8+PC9zdmc+',
      documents: {
        aadhar: '7777-8888-9999',
        pan: 'DEFGH7777K',
        passport: 'D77777777'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-4',
        faceId: 'demo-face-data-4'
      }
    },
    {
      id: 'voter-005',
      voterId: 'GHI2222222',
      name: 'Sarah Wilson',
      fatherName: 'James Wilson',
      age: 31,
      gender: 'Female',
      address: '654 Liberty Street, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 001',      verified: true,
      verificationDate: '2025-06-24T11:45:00Z',
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNmZWZiZWEiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iI2Y1OWU2MiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjZjU5ZTYyIi8+PC9zdmc+',
      documents: {
        aadhar: '2222-3333-4444',
        pan: 'GHIJK2222L',
        passport: 'E22222222'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-5',
        faceId: 'demo-face-data-5'
      }
    },
    {
      id: 'voter-006',
      voterId: 'JKL9999999',
      name: 'Robert Davis',
      fatherName: 'Charles Davis',
      age: 67,
      gender: 'Male',
      address: '987 Constitution Ave, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 001',
      verified: false,
      verificationDate: null,
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNmY2Y0ZmYiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iIzg4ODVmOSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjODg4NWY5Ii8+PC9zdmc+',
      documents: {
        aadhar: '9999-0000-1111',
        pan: 'JKLMN9999M',
        passport: 'F99999999'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-6',
        faceId: 'demo-face-data-6'
      }
    },
    {
      id: 'voter-007',
      voterId: 'MNO3333333',
      name: 'Emily Garcia',
      fatherName: 'Jose Garcia',
      age: 24,
      gender: 'Female',
      address: '147 Freedom Blvd, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 001',      verified: true,
      verificationDate: '2025-06-24T08:20:00Z',
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNmOWZiZmYiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iIzM5OGVmNyIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjMzk4ZWY3Ii8+PC9zdmc+',
      documents: {
        aadhar: '3333-4444-5555',
        pan: 'MNOPQ3333N',
        passport: 'G33333333'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-7',
        faceId: 'demo-face-data-7'
      }
    },    {
      id: 'voter-008',
      voterId: 'RST6666666',
      name: 'David Martinez',
      fatherName: 'Antonio Martinez',
      age: 39,
      gender: 'Male',
      address: '258 Justice Way, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 001',
      verified: false,
      verificationDate: null,
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNmZWY5YzMiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iI2FiZTdhYiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjYWJlN2FiIi8+PC9zdmc+',
      documents: {
        aadhar: '6666-7777-8888',
        pan: 'RSTUV6666O',
        passport: 'H66666666'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-8',
        faceId: 'demo-face-data-8'
      }
    },
    {
      id: 'voter-009',
      voterId: 'UVW1111111',
      name: 'Priya Sharma',
      fatherName: 'Raj Sharma',
      age: 33,
      gender: 'Female',
      address: '369 Independence Road, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 001',      verified: true,
      verificationDate: '2025-06-24T12:15:00Z',
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNmZmYwZjUiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iI2VjNjhiMSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjZWM2OGIxIi8+PC9zdmc+',
      documents: {
        aadhar: '1111-2222-3333',
        pan: 'UVWXY1111P',
        passport: 'I11111111'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-9',
        faceId: 'demo-face-data-9'
      }
    },
    {
      id: 'voter-010',
      voterId: 'QRS8888888',
      name: 'James Anderson',
      fatherName: 'Thomas Anderson',
      age: 45,
      gender: 'Male',
      address: '741 Republic Street, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 002',      verified: true,
      verificationDate: '2025-06-24T13:22:00Z',
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNmZmY3ZWQiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iI2Y1OWU2MiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjZjU5ZTYyIi8+PC9zdmc+',
      documents: {
        aadhar: '8888-9999-0000',
        pan: 'QRSTU8888Q',
        passport: 'J88888888'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-10',
        faceId: 'demo-face-data-10'
      }
    },
    {
      id: 'voter-011',
      voterId: 'TUV4444444',
      name: 'Lisa Thompson',
      fatherName: 'Mark Thompson',
      age: 29,
      gender: 'Female',
      address: '852 Democracy Plaza, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 002',
      verified: false,
      verificationDate: null,
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNlZmY2ZmYiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iIzA2YjZkNCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjMDZiNmQ0Ii8+PC9zdmc+',
      documents: {
        aadhar: '4444-5555-6666',
        pan: 'TUVWX4444R',
        passport: 'K44444444'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-11',
        faceId: 'demo-face-data-11'
      }
    },
    {
      id: 'voter-012',
      voterId: 'WXY1234567',
      name: 'Rajesh Kumar',
      fatherName: 'Suresh Kumar',
      age: 52,
      gender: 'Male',
      address: '963 Unity Circle, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 003',      verified: true,
      verificationDate: '2025-06-24T11:05:00Z',
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNmZmZiZWIiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iI2Y1OWU2MiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjZjU5ZTYyIi8+PC9zdmc+',
      documents: {
        aadhar: '1234-5678-9012',
        pan: 'WXYZA1234S',
        passport: 'L12345678'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-12',
        faceId: 'demo-face-data-12'
      }
    },
    {
      id: 'voter-013',
      voterId: 'ZAB9876543',
      name: 'Maria Rodriguez',
      fatherName: 'Carlos Rodriguez',
      age: 38,
      gender: 'Female',
      address: '159 Harmony Lane, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 003',
      verified: false,
      verificationDate: null,
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNmZmZkZjIiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iIzg0Y2M3OSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjODRjYzc5Ii8+PC9zdmc+',
      documents: {
        aadhar: '9876-5432-1098',
        pan: 'ZABCD9876T',
        passport: 'M98765432'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-13',
        faceId: 'demo-face-data-13'
      }
    },
    {
      id: 'voter-014',
      voterId: 'CDE5678901',
      name: 'Kevin O\'Brien',
      fatherName: 'Patrick O\'Brien',
      age: 41,
      gender: 'Male',
      address: '357 Progress Avenue, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 004',      verified: true,
      verificationDate: '2025-06-24T09:50:00Z',
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNmOWZiZmYiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iIzM5OGVmNyIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjMzk4ZWY3Ii8+PC9zdmc+',
      documents: {
        aadhar: '5678-9012-3456',
        pan: 'CDEFG5678U',
        passport: 'N56789012'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-14',
        faceId: 'demo-face-data-14'
      }
    },
    {
      id: 'voter-015',
      voterId: 'FGH2468135',
      name: 'Anjali Patel',
      fatherName: 'Mahesh Patel',
      age: 26,
      gender: 'Female',
      address: '468 Equality Street, Demo City',
      constituency: 'Demo Constituency',
      pollingStation: 'Demo Polling Station 004',      verified: true,
      verificationDate: '2025-06-24T14:05:00Z',
      photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNmZmY3ZWQiLz48cGF0aCBkPSJNNzAgNzBjMC0xMS0yMC0yMC0yMC0yMHMtMjAgOS0yMCAyMCIgZmlsbD0iI2Y1OWU2MiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjEyIiBmaWxsPSIjZjU5ZTYyIi8+PC9zdmc+',
      documents: {
        aadhar: '2468-1357-9024',
        pan: 'FGHIJ2468V',
        passport: 'O24681357'
      },
      biometrics: {
        fingerprint: 'demo-fingerprint-data-15',
        faceId: 'demo-face-data-15'
      }
    }
  ],  // Demo analytics data
  demoAnalytics: {
    totalVoters: 19864,
    verifiedVoters: 12847,
    pendingVerifications: 7017,
    todayVerifications: 456,
    verificationRate: 64.7,
    flaggedCases: 38,
    averageVerificationTime: 1.9, // minutes
    peakHour: '14:00',
    hourlyStats: [
      { hour: '08:00', verifications: 32, pending: 48 },
      { hour: '09:00', verifications: 51, pending: 73 },
      { hour: '10:00', verifications: 74, pending: 92 },
      { hour: '11:00', verifications: 95, pending: 86 },
      { hour: '12:00', verifications: 28, pending: 41 },
      { hour: '13:00', verifications: 67, pending: 58 },
      { hour: '14:00', verifications: 103, pending: 97 },
      { hour: '15:00', verifications: 89, pending: 71 },
      { hour: '16:00', verifications: 76, pending: 53 },
      { hour: '17:00', verifications: 54, pending: 38 }
    ],    dailyStats: [
      { date: '2025-06-19', verifications: 312, fraudDetected: 4 },
      { date: '2025-06-20', verifications: 356, fraudDetected: 2 },
      { date: '2025-06-21', verifications: 389, fraudDetected: 6 },
      { date: '2025-06-22', verifications: 341, fraudDetected: 3 },
      { date: '2025-06-23', verifications: 423, fraudDetected: 5 },
      { date: '2025-06-24', verifications: 456, fraudDetected: 3 }
    ],
    verificationTypes: {
      manual: 38,
      face: 41,
      document: 16,
      biometric: 5
    },
    genderDistribution: {
      male: 53,
      female: 45,
      other: 2
    },
    ageGroups: {
      '18-25': 22,
      '26-35': 31,
      '36-50': 28,
      '51-65': 16,
      '65+': 3
    },
    fraudDetection: {
      flagged: 31,
      resolved: 24,
      pending: 7,
      types: {
        multipleAttempts: 12,
        documentMismatch: 8,
        faceMismatch: 6,
        suspiciousBehavior: 5
      }
    },
    performance: {
      systemUptime: 99.9,
      averageResponseTime: 1.1, // seconds
      errorRate: 0.015,
      throughput: 168 // verifications per hour
    },
    topPollingStations: [
      { name: 'Demo Polling Station 001', verifications: 289, efficiency: 94 },
      { name: 'Demo Polling Station 002', verifications: 267, efficiency: 91 },
      { name: 'Demo Polling Station 003', verifications: 234, efficiency: 89 },
      { name: 'Demo Polling Station 004', verifications: 198, efficiency: 87 }    ]
  },
    // Active demo sessions - Complete list with all sessions
  demoSessions: [
    {
      session_id: 'session-001',
      voter_id: 'ABC1234567',
      voter_name: 'John Doe',
      verification_method: 'Face Recognition',
      start_time: new Date().toISOString(),
      status: 'IN_PROGRESS',
      location: 'Central Booth A',
      operator: 'Demo Admin',
      device_id: 'demo-device-001'
    },
    {
      session_id: 'session-002',
      voter_id: 'XYZ9876543',
      voter_name: 'Jane Smith',
      verification_method: 'Document Verification',
      start_time: new Date().toISOString(),
      status: 'WAITING',
      location: 'North Wing B',
      operator: 'Demo Admin',
      device_id: 'demo-device-002'
    },
    {
      session_id: 'session-003',
      voter_id: 'PQR5555555',
      voter_name: 'Alice Johnson',
      verification_method: 'Biometric Scan',
      start_time: new Date().toISOString(),
      status: 'SCANNING',
      location: 'South Section C',
      operator: 'Demo Admin',
      device_id: 'demo-device-003'
    },
    {
      session_id: 'session-004',
      voter_id: 'DEF7777777',
      voter_name: 'Michael Brown',
      verification_method: 'QR Code Scan',
      start_time: new Date().toISOString(),
      status: 'IN_PROGRESS',
      location: 'East Block D',
      operator: 'Demo Admin',
      device_id: 'demo-device-004'
    },
    {
      session_id: 'session-005',
      voter_id: 'GHI2222222',
      voter_name: 'Sarah Wilson',
      verification_method: 'Face Recognition',
      start_time: new Date().toISOString(),
      status: 'VERIFYING',
      location: 'West Area E',
      operator: 'Demo Admin',
      device_id: 'demo-device-005'
    },
    {
      session_id: 'session-006',
      voter_id: 'MNO3333333',
      voter_name: 'Emily Garcia',
      verification_method: 'Manual Review',
      start_time: new Date().toISOString(),
      status: 'WAITING',
      location: 'Ground Floor F',
      operator: 'Demo Admin',
      device_id: 'demo-device-006'
    },
    {
      session_id: 'session-007',
      voter_id: 'RST6666666',
      voter_name: 'David Martinez',
      verification_method: 'Voice Recognition',
      start_time: new Date().toISOString(),
      status: 'SCANNING',
      location: 'Upper Level G',
      operator: 'Demo Admin',
      device_id: 'demo-device-007'
    }
  ],
  
  // Demo audit logs - structured for recent verifications display
  demoAuditLogs: [
    {
      log_id: 'audit-001',
      timestamp: '2025-06-24T14:45:00Z',
      verification_method: 'Face Recognition',
      user_id: 'demo-user-001',
      user_name: 'Demo Admin',
      voter_id: 'FGH2468135',
      voter_name: 'Anjali Patel',
      details: 'Voter successfully verified using face recognition (Match: 96%)',
      ip: '192.168.1.100',
      verification_result: 'SUCCESS',
      booth_id: 'demo-booth-001',
      severity: 'INFO'
    },
    {
      log_id: 'audit-002',
      timestamp: '2025-06-24T14:42:00Z',
      verification_method: 'QR Code',
      user_id: 'demo-user-001',
      user_name: 'Demo Admin',
      voter_id: 'CDE5678901',
      voter_name: 'Kevin O\'Brien',
      details: 'QR code scanned successfully - Voter information retrieved',
      ip: '192.168.1.100',
      verification_result: 'SUCCESS',
      booth_id: 'demo-booth-001',
      severity: 'INFO'
    },
    {
      log_id: 'audit-003',
      timestamp: '2025-06-24T14:38:00Z',
      verification_method: 'Document Scan',
      user_id: 'demo-user-001',
      user_name: 'Demo Admin',
      voter_id: 'TUV4444444',
      voter_name: 'Lisa Thompson',
      details: 'Document verification initiated for Passport',
      ip: '192.168.1.100',
      verification_result: 'PENDING',
      booth_id: 'demo-booth-001',
      severity: 'INFO'
    },
    {
      log_id: 'audit-004',
      timestamp: '2025-06-24T14:35:00Z',
      verification_method: 'Manual Review',
      user_id: 'demo-user-001',
      user_name: 'Demo Admin',
      voter_id: 'WXY1234567',
      voter_name: 'Rajesh Kumar',
      details: 'Manual verification completed - Document review passed',
      ip: '192.168.1.100',
      verification_result: 'SUCCESS',
      booth_id: 'demo-booth-001',
      severity: 'INFO'
    },
    {
      log_id: 'audit-005',
      timestamp: '2025-06-24T14:30:00Z',
      verification_method: 'Biometric Scan',      user_id: 'demo-user-001',
      user_name: 'Demo Admin',
      voter_id: 'UVW1111111',
      voter_name: 'Priya Sharma',
      details: 'Fingerprint scan completed successfully (Quality: 97%)',
      ip: '192.168.1.100',
      verification_result: 'SUCCESS',
      booth_id: 'demo-booth-001',
      severity: 'INFO'
    },
    {
      log_id: 'audit-006',
      timestamp: '2025-06-24T14:25:00Z',
      verification_method: 'Document Scan',
      user_id: 'system',
      user_name: 'System',
      voter_id: 'ZAB9876543',
      voter_name: 'Maria Rodriguez',
      details: 'Potential fraud detected - Document signature mismatch',
      ip: '192.168.1.102',
      verification_result: 'FAILED',
      booth_id: 'demo-booth-001',
      severity: 'HIGH'
    },
    {
      log_id: 'audit-007',
      timestamp: '2025-06-24T14:20:00Z',
      verification_method: 'Face Recognition',
      user_id: 'demo-user-001',
      user_name: 'Demo Admin',
      voter_id: 'RST6666666',
      voter_name: 'David Martinez',
      details: 'Face verification failed - Low match confidence (72%)',
      ip: '192.168.1.100',
      verification_result: 'FAILED',
      booth_id: 'demo-booth-001',
      severity: 'MEDIUM'
    },
    {
      log_id: 'audit-008',
      timestamp: '2025-06-24T14:15:00Z',
      verification_method: 'Manual Search',
      user_id: 'demo-user-001',
      user_name: 'Demo Admin',
      voter_id: 'QRS8888888',
      voter_name: 'Search Query',
      details: 'Voter search performed using ID: QRS8888888',
      ip: '192.168.1.100',
      verification_result: 'SUCCESS',
      booth_id: 'demo-booth-001',
      severity: 'INFO'
    },    {
      log_id: 'audit-009',
      timestamp: '2025-06-24T14:10:00Z',
      verification_method: 'System Login',
      user_id: 'demo-user-001',
      user_name: 'Demo Admin',
      voter_id: '',
      voter_name: 'System Login',
      details: 'User logged into the system successfully',
      ip: '192.168.1.100',
      verification_result: 'SUCCESS',
      booth_id: 'demo-booth-001',
      severity: 'INFO'
    },
    {
      log_id: 'audit-010',
      timestamp: '2025-06-24T13:55:00Z',
      verification_method: 'System Backup',
      user_id: 'system',
      user_name: 'System',
      voter_id: '',
      voter_name: 'System Process',
      details: 'Automatic system backup completed successfully',
      ip: 'localhost',
      verification_result: 'SUCCESS',
      booth_id: 'demo-booth-001',
      severity: 'INFO'
    },
    {
      log_id: 'audit-011',
      timestamp: '2025-06-24T13:45:00Z',
      verification_method: 'Document Upload',
      user_id: 'demo-user-001',
      user_name: 'Demo Admin',
      voter_id: 'ABC1234567',
      voter_name: 'John Doe',
      details: 'Aadhar card document uploaded and processed',
      ip: '192.168.1.100',
      verification_result: 'SUCCESS',
      booth_id: 'demo-booth-001',
      severity: 'INFO'
    },
    {
      log_id: 'audit-012',
      timestamp: '2025-06-24T13:30:00Z',
      verification_method: 'System Alert',
      user_id: 'system',
      user_name: 'System',
      voter_id: '',
      voter_name: 'System Process',
      details: 'Peak verification load detected - Auto-scaling activated',
      ip: 'localhost',
      verification_result: 'SUCCESS',
      booth_id: 'demo-booth-001',
      severity: 'MEDIUM'
    }  ],  // Obsolete demo sessions definition - Using consolidated array defined earlier
  demoSessionsHistory: [
    {
      id: 'session-001',
      voterId: 'TUV4444444',
      voterName: 'Lisa Thompson',
      startTime: '2025-06-24T14:40:00Z',
      endTime: null,
      status: 'IN_PROGRESS',
      verificationType: 'DOCUMENT_VERIFICATION',
      operator: 'demo-user-001',
      attempts: 1,
      confidenceScore: null,
      notes: 'Document verification in progress - Passport analysis'
    },
    {
      id: 'session-002',
      voterId: 'FGH2468135',
      voterName: 'Anjali Patel',
      startTime: '2025-06-24T14:43:00Z',
      endTime: '2025-06-24T14:46:00Z',
      status: 'COMPLETED',
      verificationType: 'FACE_RECOGNITION',
      operator: 'demo-user-001',
      attempts: 1,
      confidenceScore: 96,
      notes: 'Successful verification on first attempt - High confidence match'
    },
    {
      id: 'session-003',
      voterId: 'WXY1234567',
      voterName: 'Rajesh Kumar',
      startTime: '2025-06-24T14:32:00Z',
      endTime: '2025-06-24T14:37:00Z',
      status: 'COMPLETED',
      verificationType: 'MANUAL_REVIEW',
      operator: 'demo-user-001',
      attempts: 1,
      confidenceScore: 100,
      notes: 'Manual verification completed - All documents verified'
    },
    {
      id: 'session-004',
      voterId: 'UVW1111111',
      voterName: 'Priya Sharma',
      startTime: '2025-06-24T14:28:00Z',
      endTime: '2025-06-24T14:31:00Z',
      status: 'COMPLETED',
      verificationType: 'BIOMETRIC',
      operator: 'demo-user-001',
      attempts: 1,
      confidenceScore: 97,
      notes: 'Fingerprint verification successful - High quality scan'
    },
    {
      id: 'session-005',
      voterId: 'ZAB9876543',
      voterName: 'Maria Rodriguez',
      startTime: '2025-06-24T14:22:00Z',
      endTime: '2025-06-24T14:27:00Z',
      status: 'FLAGGED',
      verificationType: 'DOCUMENT_VERIFICATION',
      operator: 'demo-user-001',
      attempts: 2,
      confidenceScore: 45,
      notes: 'Document signature mismatch detected - Requires manual review'
    },
    {
      id: 'session-006',
      voterId: 'RST6666666',
      voterName: 'David Martinez',
      startTime: '2025-06-24T14:18:00Z',
      endTime: '2025-06-24T14:22:00Z',
      status: 'FAILED',
      verificationType: 'FACE_RECOGNITION',
      operator: 'demo-user-001',
      attempts: 3,
      confidenceScore: 72,
      notes: 'Multiple failed attempts - Poor lighting conditions'
    },
    {
      id: 'session-007',
      voterId: 'QRS8888888',
      voterName: 'James Anderson',
      startTime: '2025-06-24T14:12:00Z',
      endTime: '2025-06-24T14:16:00Z',
      status: 'COMPLETED',
      verificationType: 'QR_CODE_SCAN',
      operator: 'demo-user-001',
      attempts: 1,
      confidenceScore: 100,
      notes: 'QR code verification successful - Data retrieved instantly'
    }
  ],
  // Demo notifications
  demoNotifications: [
    {
      id: 'notif-001',
      type: 'FRAUD_ALERT',
      title: 'Document Fraud Detected',
      message: 'Signature mismatch detected for voter Maria Rodriguez - Requires immediate review',
      timestamp: '2025-06-24T14:25:00Z',
      severity: 'HIGH',
      read: false,
      actionRequired: true
    },
    {
      id: 'notif-002',
      type: 'SUCCESS',
      title: 'Peak Performance',
      message: 'System handling peak load efficiently - 456 verifications completed today',
      timestamp: '2025-06-24T14:00:00Z',
      severity: 'INFO',
      read: false,
      actionRequired: false
    },
    {
      id: 'notif-003',
      type: 'VERIFICATION_FAILED',
      title: 'Multiple Failed Attempts',
      message: 'Voter David Martinez failed verification 3 times - Manual review suggested',
      timestamp: '2025-06-24T14:22:00Z',
      severity: 'MEDIUM',
      read: false,
      actionRequired: true
    },
    {
      id: 'notif-004',
      type: 'SYSTEM_ALERT',
      title: 'Auto-scaling Activated',
      message: 'High verification load detected - Additional resources allocated automatically',
      timestamp: '2025-06-24T13:30:00Z',
      severity: 'MEDIUM',
      read: true,
      actionRequired: false
    },
    {
      id: 'notif-005',
      type: 'SUCCESS',
      title: 'Backup Complete',
      message: 'Daily system backup completed successfully at 13:55',
      timestamp: '2025-06-24T13:55:00Z',
      severity: 'INFO',
      read: true,
      actionRequired: false
    },
    {
      id: 'notif-006',
      type: 'MAINTENANCE',
      title: 'Scheduled Maintenance',
      message: 'System maintenance scheduled for tonight 02:00-04:00 AM',
      timestamp: '2025-06-24T12:00:00Z',
      severity: 'INFO',
      read: true,
      actionRequired: false
    }
  ],
  // Demo settings
  demoSettings: {
    verification: {
      requireFaceMatch: true,
      documentVerificationEnabled: true,
      fraudDetectionEnabled: true,
      minimumMatchScore: 85,
      maxVerificationAttempts: 3,
      biometricVerificationEnabled: true,
      qrCodeScanEnabled: true,
      manualOverrideEnabled: true,
      timeoutDuration: 300, // seconds
      autoSaveInterval: 30 // seconds
    },
    notifications: {
      pushNotificationsEnabled: true,
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false,
      fraudAlerts: true,
      systemAlerts: true,
      dailyReports: true,
      weeklyReports: false
    },
    system: {
      autoBackupEnabled: true,
      backupInterval: 24, // hours
      offlineModeEnabled: true,
      debugMode: false,
      autoSyncEnabled: true,
      syncInterval: 15, // minutes
      dataRetentionDays: 365,
      maxConcurrentSessions: 50,
      sessionTimeout: 30 // minutes
    },
    security: {
      twoFactorEnabled: false,
      passwordExpiryDays: 90,
      maxLoginAttempts: 5,
      sessionEncryption: true,
      auditLogging: true,
      dataEncryption: true,
      accessControlEnabled: true
    },
    ui: {
      theme: 'light',
      language: 'en',
      autoRefresh: true,
      refreshInterval: 30, // seconds
      showTooltips: true,
      animationsEnabled: true,
      compactMode: false
    },
    performance: {
      cacheEnabled: true,
      cacheTimeout: 300, // seconds
      batchSize: 100,
      maxImageSize: 5, // MB
      compressionEnabled: true,
      lazyLoadingEnabled: true
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
    case 'notifications':
      return DEMO_CONFIG.demoNotifications;
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

// Live demo data generation
const DEMO_NAMES = [
  'Arjun Sharma', 'Priya Singh', 'Rajesh Kumar', 'Anita Patel', 'Vikram Gupta',
  'Sunita Reddy', 'Amit Joshi', 'Kavita Mehta', 'Suresh Yadav', 'Neha Agarwal',
  'Rahul Verma', 'Deepika Saxena', 'Manoj Tiwari', 'Pooja Bansal', 'Karan Malhotra',
  'Sanjay Kumar', 'Meera Jain', 'Arun Nair', 'Ritu Sharma', 'Ashok Gupta',
  'Shanti Devi', 'Ravi Patel', 'Seema Verma', 'Gopal Singh', 'Lakshmi Reddy',
  'Mukesh Yadav', 'Geeta Agarwal', 'Ramesh Tiwari', 'Shilpa Bansal', 'Ajay Malhotra',
  'Urmila Joshi', 'Naresh Mehta', 'Sudha Saxena', 'Bharat Kumar', 'Lata Singh'
];

const VERIFICATION_METHODS = [
  'Face Recognition', 'QR Code Scan', 'Document Verification', 'Biometric Scan', 
  'Manual Review', 'Voice Recognition', 'Iris Scan', 'Multi-Factor Auth'
];

const DEMO_LOCATIONS = [
  'Central Booth A', 'North Wing B', 'South Section C', 'East Block D', 'West Area E',
  'Ground Floor F', 'Upper Level G', 'Main Hall H', 'Side Wing I', 'Entry Point J'
];

const SUCCESS_MESSAGES = [
  'Identity verified successfully',
  'Perfect biometric match found',
  'Document authentication passed',
  'High confidence verification',
  'All security checks passed',
  'Voter registration confirmed'
];

const FAILURE_MESSAGES = [
  'Biometric mismatch detected',
  'Document verification failed',
  'Low quality image captured',
  'Database lookup failed',
  'Security validation failed',
  'Authentication timeout'
];

export const generateLiveVerification = () => {
  const now = new Date();
  const randomName = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
  const randomMethod = VERIFICATION_METHODS[Math.floor(Math.random() * VERIFICATION_METHODS.length)];
  const randomLocation = DEMO_LOCATIONS[Math.floor(Math.random() * DEMO_LOCATIONS.length)];
  const randomSuccess = Math.random() > 0.15; // 85% success rate
  const confidence = randomSuccess ? 85 + Math.floor(Math.random() * 15) : 30 + Math.floor(Math.random() * 40);
  const randomMessage = randomSuccess ? 
    SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)] :
    FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)];
  
  return {
    log_id: 'live-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    timestamp: now.toISOString(),
    verification_method: randomMethod,
    user_id: 'demo-user-001',
    user_name: 'Demo Admin',
    voter_id: 'LV' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    voter_name: randomName,
    details: `${randomMethod} - ${randomMessage} (Confidence: ${confidence}%)`,
    ip: '192.168.1.100',
    verification_result: randomSuccess ? 'SUCCESS' : 'FAILED',
    booth_id: randomLocation,
    severity: randomSuccess ? 'INFO' : 'MEDIUM',
    duration: Math.floor(Math.random() * 5000) + 1000, // 1-6 seconds
    location: randomLocation
  };
};

export const startLiveDemo = (callback) => {
  if (!DEMO_CONFIG.liveDemo) return null;
  
  // Add a new verification every 5-15 seconds for more activity
  const interval = setInterval(() => {
    const newVerification = generateLiveVerification();
    callback(newVerification);
  }, 5000 + Math.random() * 10000); // Random interval between 5-15 seconds
  
  return interval;
};

export const stopLiveDemo = (interval) => {
  if (interval) {
    clearInterval(interval);
  }
};

// Generate random demo notifications
export const generateDemoNotification = () => {
  const notifications = [
    { type: 'success', message: 'Batch verification completed successfully' },
    { type: 'info', message: 'New security update available' },
    { type: 'warning', message: 'High verification traffic detected' },
    { type: 'info', message: 'System performance optimal' },
    { type: 'success', message: 'Daily backup completed' },
    { type: 'info', message: 'New voter registrations processed' },
    { type: 'warning', message: 'Queue limit approaching maximum' },
    { type: 'success', message: 'All systems operating normally' }
  ];
  
  return notifications[Math.floor(Math.random() * notifications.length)];
};

// Generate live statistics
export const generateLiveStats = () => {
  const baseStats = DEMO_CONFIG.demoAnalytics;
  const variation = 0.1; // 10% variation
  
  return {
    todayVerifications: Math.floor(baseStats.todayVerifications * (1 + (Math.random() - 0.5) * variation)),
    successfulVerifications: Math.floor(baseStats.successfulVerifications * (1 + (Math.random() - 0.5) * variation)),
    failedVerifications: Math.floor(baseStats.failedVerifications * (1 + (Math.random() - 0.5) * variation)),
    averageTime: Math.floor(baseStats.averageTime * (1 + (Math.random() - 0.5) * variation)),
    activeUsers: Math.floor(baseStats.activeUsers * (1 + (Math.random() - 0.5) * variation)),
    systemLoad: Math.min(100, Math.max(10, baseStats.systemLoad + (Math.random() - 0.5) * 20))
  };
};
