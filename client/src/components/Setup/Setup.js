import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AuthService } from '../../services/AuthService';
import { DatabaseService } from '../../services/DatabaseService';
import ApiService from '../../services/ApiService';
import {
  CogIcon,
  ServerIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  WifiIcon
} from '@heroicons/react/24/outline';

const Setup = ({ onSetupComplete }) => {
  const { actions } = useApp();
  const [currentStep, setCurrentStep] = useState(1);  const [setupData, setSetupData] = useState({
    serverUrl: 'http://localhost:3001',
    boothId: '',
    operatorName: '',
    operatorId: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [errors, setErrors] = useState({});
  const steps = [
    {
      id: 1,
      title: 'Server Configuration',
      description: 'Configure connection to the FastVerify server',
      icon: ServerIcon
    },
    {
      id: 2,
      title: 'Booth Registration',
      description: 'Register this device as a polling booth',
      icon: ShieldCheckIcon
    },
    {
      id: 3,
      title: 'Login Credentials',
      description: 'Set up authentication credentials for secure access',
      icon: CogIcon
    },
    {
      id: 4,
      title: 'Verification',
      description: 'Verify setup and initialize the system',
      icon: CheckCircleIcon
    }
  ];

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!setupData.serverUrl) {
          newErrors.serverUrl = 'Server URL is required';
        } else if (!isValidUrl(setupData.serverUrl)) {
          newErrors.serverUrl = 'Please enter a valid URL';
        }
        break;      case 2:
        if (!setupData.boothId) {
          newErrors.boothId = 'Booth ID is required';
        }
        if (!setupData.operatorName) {
          newErrors.operatorName = 'Operator name is required';
        }
        if (!setupData.operatorId) {
          newErrors.operatorId = 'Operator ID is required';
        }
        if (!setupData.location) {
          newErrors.location = 'Location is required';
        }
        break;

      case 3:
        if (!setupData.username) {
          newErrors.username = 'Username is required';
        }
        if (!setupData.email) {
          newErrors.email = 'Email is required';
        } else if (!isValidEmail(setupData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        if (!setupData.password) {
          newErrors.password = 'Password is required';
        } else if (setupData.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters long';
        }
        if (!setupData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (setupData.password !== setupData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      
      // Console statement removed
      
      // Update API service with the new URL
      ApiService.setBaseURL(setupData.serverUrl);
      
      // Console statement removed
      
      // Test the connection
      const response = await fetch(`${setupData.serverUrl}/api/health`);
      
      if (response.ok) {
        setConnectionStatus('success');
        return true;
      } else {
        setConnectionStatus('failed');
        return false;
      }
    } catch (error) {
      // Console statement removed
      setConnectionStatus('failed');
      return false;
    }
  };  const registerBooth = async () => {
    try {
      const response = await ApiService.post('/auth/setup', {
        booth_id: setupData.boothId,
        operator_name: setupData.operatorName,
        operator_id: setupData.operatorId,
        username: setupData.username,
        email: setupData.email,
        password: setupData.password,
        location: setupData.location
      });

      if (response.token) {
        // Store the authentication token
        AuthService.setToken(response.token);
        
        // Store booth configuration
        const boothConfig = {
          booth_id: setupData.boothId,
          operator_name: setupData.operatorName,
          operator_id: setupData.operatorId,
          location: setupData.location,
          role: response.role || 'operator'
        };
        AuthService.setBoothConfig(boothConfig);

        return true;
      }
      
      return false;
    } catch (error) {
      // Console statement removed
      throw error;
    }
  };

  const initializeDatabase = async () => {
    try {
      // Initialize local database
      await DatabaseService.initialize();
      
      // Set initial settings
      const initialSettings = {
        serverUrl: setupData.serverUrl,
        syncInterval: 300,
        maxRetries: 3,
        offlineMode: false,
        debugMode: false,
        autoSync: true,
        encryptionEnabled: true,
        maxAuditLogs: 10000
      };
      
      await DatabaseService.saveSettings(initialSettings);
      
      return true;
    } catch (error) {
      // Console statement removed
      throw error;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);

    try {
      switch (currentStep) {        case 1: {
          // Test server connection
          const connectionSuccess = await testConnection();
          if (!connectionSuccess) {
            setErrors({ serverUrl: 'Failed to connect to server' });
            setLoading(false);
            return;
          }
          break;        }
        
        case 2: {
          // Save booth configuration (without authentication yet)
          break;
        }

        case 3: {
          // Authenticate and register booth with credentials
          await registerBooth();
          break;
        }case 4: {
          // Initialize system
          await initializeDatabase();
          
          // Create the config and token for the callback
          const boothConfig = {
            id: setupData.boothId,
            name: setupData.operatorName,
            location: setupData.location,
            serverUrl: setupData.serverUrl,
            isActive: true
          };
          
          const authToken = AuthService.getToken();
          
          // Update app state
          actions.setAuth(authToken);
          actions.setBoothConfig(boothConfig);
          
          // Call the completion callback if provided
          if (onSetupComplete) {
            onSetupComplete(boothConfig, authToken);
          } else {
            // Fallback to reload if no callback provided
            window.location.reload();
          }
          return;
        }

        default:
          break;
      }

      setCurrentStep(currentStep + 1);    } catch (error) {
      // Console statement removed
      actions.setError(error.message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Server URL *
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={setupData.serverUrl}
                  onChange={(e) => setSetupData({...setupData, serverUrl: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.serverUrl ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="http://localhost:3001"
                />
                {connectionStatus === 'testing' && (
                  <div className="absolute right-3 top-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {connectionStatus === 'success' && (
                  <div className="absolute right-3 top-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  </div>
                )}
                {connectionStatus === 'failed' && (
                  <div className="absolute right-3 top-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.serverUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.serverUrl}</p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <WifiIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Connection Information</h4>
                  <p className="mt-1 text-sm text-blue-700">
                    Enter the URL of your FastVerify server. Make sure the server is running and accessible from this device.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booth ID *
                </label>
                <input
                  type="text"
                  value={setupData.boothId}
                  onChange={(e) => setSetupData({...setupData, boothId: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.boothId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="BOOTH001"
                />
                {errors.boothId && (
                  <p className="mt-1 text-sm text-red-600">{errors.boothId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={setupData.location}
                  onChange={(e) => setSetupData({...setupData, location: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Community Center Hall A"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operator Name *
                </label>
                <input
                  type="text"
                  value={setupData.operatorName}
                  onChange={(e) => setSetupData({...setupData, operatorName: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.operatorName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John Doe"
                />
                {errors.operatorName && (
                  <p className="mt-1 text-sm text-red-600">{errors.operatorName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operator ID *
                </label>
                <input
                  type="text"
                  value={setupData.operatorId}
                  onChange={(e) => setSetupData({...setupData, operatorId: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.operatorId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="OP001"
                />
                {errors.operatorId && (
                  <p className="mt-1 text-sm text-red-600">{errors.operatorId}</p>
                )}
              </div>            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Booth Information</h4>
                  <p className="mt-1 text-sm text-blue-700">
                    Register this device as a polling booth. This information will be used to identify your booth in the system.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">            <div className="text-center mb-6">
              <CogIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Set Up Login Credentials
              </h3>
              <p className="text-gray-600">
                Create secure login credentials for accessing this booth.
              </p>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Fill Demo Credentials (for testing)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={setupData.username}
                  onChange={(e) => setSetupData({...setupData, username: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter username"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={setupData.email}
                  onChange={(e) => setSetupData({...setupData, email: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="operator@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={setupData.password}
                  onChange={(e) => setSetupData({...setupData, password: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={setupData.confirmPassword}
                  onChange={(e) => setSetupData({...setupData, confirmPassword: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start">
                <ShieldCheckIcon className="w-5 h-5 text-green-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-green-900">Security Requirements</h4>
                  <ul className="mt-1 text-sm text-green-700 list-disc list-inside">
                    <li>Password must be at least 6 characters long</li>
                    <li>Use a valid email address for account recovery</li>
                    <li>Keep your credentials secure and private</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Setup Complete!
              </h3>
              <p className="text-gray-600">
                Your FastVerify booth is ready to start verifying voters.
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-green-900">Server:</span>
                  <span className="text-sm text-green-700">{setupData.serverUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-green-900">Booth ID:</span>
                  <span className="text-sm text-green-700">{setupData.boothId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-green-900">Location:</span>
                  <span className="text-sm text-green-700">{setupData.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-green-900">Operator:</span>
                  <span className="text-sm text-green-700">{setupData.operatorName}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Next Steps</h4>
                  <ul className="mt-1 text-sm text-blue-700 list-disc list-inside space-y-1">
                    <li>Local database has been initialized</li>
                    <li>Booth authentication is configured</li>
                    <li>System is ready for voter verification</li>
                    <li>Auto-sync is enabled for data backup</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper function to fill demo credentials for testing
  const fillDemoCredentials = () => {
    setSetupData({
      ...setupData,
      username: 'admin',
      email: 'admin@fastverify.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <CogIcon className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            FastVerify Setup
          </h1>
          <p className="text-gray-600">
            Configure your polling booth for voter verification
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div key={step.id} className="text-center flex-1">
                <p className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Setup Form */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {steps[currentStep - 1]?.title}
          </h2>
          
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                {currentStep === 4 ? 'Complete Setup' : 'Next'}
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setup;
