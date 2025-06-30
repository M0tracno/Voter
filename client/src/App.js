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
import DemoBanner from './components/Demo/DemoBanner';
import FaceVerification from './components/FaceVerification/FaceVerification';
import DocumentVerification from './components/DocumentVerification/DocumentVerification';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import Notification from './components/Notification/Notification';

// Services
import { DatabaseService } from './services/DatabaseService';
import { AuthService } from './services/AuthService';

// Context
import { AppProvider } from './context/AppContext';

// Demo Mode
import { isDemoMode, getDemoData } from './config/demoConfig';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [authToken, setAuthToken] = useState(null);
  const [boothConfig, setBoothConfig] = useState(null);

  useEffect(() => {
    initializeApp();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);  const initializeApp = async () => {
    try {
      if (isDemoMode()) {
        // Set demo data immediately
        const demoBoothConfig = getDemoData('booth');
        const demoToken = 'demo-token-' + Date.now();
        
        setBoothConfig(demoBoothConfig);
        setAuthToken(demoToken);
        setIsInitialized(true);
        return;
      }
      
      // Normal mode initialization
      try {
        await DatabaseService.initialize();

        const config = await DatabaseService.getBoothConfig();
        if (config) {
          setBoothConfig(config);
          
          const token = AuthService.getToken();
          if (token && AuthService.isTokenValid(token)) {
            setAuthToken(token);
          }
        }      } catch (error) {
        // Database/config error - will show setup
      }

      setIsInitialized(true);
    } catch (error) {
      // App initialization failed - still show UI
      setIsInitialized(true);
    }
  };
  const handleSetupComplete = (config, token) => {
    setBoothConfig(config);
    setAuthToken(token);
  };

  // Loading screen
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">FastVerify</h2>
          <p className="text-gray-500">Initializing application...</p>
        </div>
      </div>
    );
  }
  // Toast Container Component
  const ToastNotifications = () => (
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
  );  // Main App Content
  const MainApp = ({ showDemoBanner = false }) => {
    return (
      <div className="min-h-screen bg-gray-50">
        {showDemoBanner && <DemoBanner />}
        
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
            <Route path="/face-verification" element={<FaceVerification />} />
            <Route path="/document-verification" element={<DocumentVerification />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>        </Layout>

        <ToastNotifications />
        <Notification />
      </div>
    );
  };// Demo mode - always show main app
  if (isDemoMode()) {
    const demoBoothConfig = boothConfig || getDemoData('booth');
    const demoToken = authToken || 'demo-token';
    
    return (
      <AppProvider initialConfig={{ 
        boothConfig: demoBoothConfig, 
        authToken: demoToken, 
        isOnline 
      }}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <MainApp showDemoBanner={true} />
        </Router>
      </AppProvider>
    );
  }

  // Normal mode - check if setup is needed
  const needsSetup = !boothConfig || !authToken;

  if (needsSetup) {
    return (
      <AppProvider initialConfig={{ boothConfig, authToken, isOnline }}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
            <Setup onSetupComplete={handleSetupComplete} />
          </div>
        </Router>
      </AppProvider>
    );
  }

  // Normal mode with complete setup
  return (
    <AppProvider initialConfig={{ boothConfig, authToken, isOnline }}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MainApp showDemoBanner={false} />
      </Router>
    </AppProvider>
  );
}

export default App;