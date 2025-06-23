import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Layout from './components/Layout/Layout';
import Home from './components/Home/Home';
import VoterSearch from './components/VoterSearch/VoterSearch';
import VoterVerification from './components/Verification/VoterVerification';
import AuditLogs from './components/AuditLogs/AuditLogs';
import Settings from './components/Settings/Settings';
import Setup from './components/Setup/Setup';

// Services
import { DatabaseService } from './services/DatabaseService';
import { AuthService } from './services/AuthService';

// Context
import { AppProvider } from './context/AppContext';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [authToken, setAuthToken] = useState(null);
  const [boothConfig, setBoothConfig] = useState(null);

  useEffect(() => {
    // Initialize the application
    initializeApp();

    // Set up online/offline detection
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);
  const initializeApp = async () => {
    try {
      console.log('Starting app initialization...');
      
      // Initialize local database
      await DatabaseService.initialize();
      console.log('Database initialized successfully');

      // Check for existing booth configuration
      try {
        const config = await DatabaseService.getBoothConfig();
        if (config) {
          setBoothConfig(config);
          
          // Validate authentication
          const token = AuthService.getToken();
          if (token && AuthService.isTokenValid(token)) {
            setAuthToken(token);
          }
        }
      } catch (configError) {
        console.error('Failed to load booth config:', configError);
        // Continue without config - user will need to set up
      }

      setIsInitialized(true);
      console.log('App initialization completed');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      console.error('App initialization error details:', error.name, error.message);
      setIsInitialized(true); // Still show UI even if initialization fails
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">FastVerify</h2>
          <p className="text-gray-500">Initializing application...</p>
        </div>
      </div>
    );
  }  // Show setup page if booth is not configured
  if (!boothConfig || !authToken) {
    return (
      <AppProvider initialConfig={{ boothConfig, authToken, isOnline }}>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
            <Setup />
          </div>
        </Router>
      </AppProvider>
    );
  }
  return (
    <AppProvider initialConfig={{ boothConfig, authToken, isOnline }}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50">
          {/* Offline Indicator */}
          {!isOnline && (
            <div className="bg-yellow-500 text-white text-center py-2 px-4">
              <span className="font-medium">⚠️ Offline Mode - Data will sync when connection is restored</span>
            </div>
          )}

          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<VoterSearch />} />
              <Route path="/verify/:voterId" element={<VoterVerification />} />
              <Route path="/audit" element={<AuditLogs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
