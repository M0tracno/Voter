import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Activity, 
  Settings, 
  Wifi, 
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Camera,
  FileText,
  BarChart3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isDemoMode } from '../../config/demoConfig';

function Layout() {
  const location = useLocation();
  const { 
    isOnline, 
    boothConfig, 
    syncStatus, 
    pendingSyncCount,
    isAuthenticated 
  } = useApp();
  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Audit', href: '/audit', icon: Activity },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Add demo-specific navigation items
  const demoNavigation = [
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Face Verification', href: '/face-verification', icon: Camera },
    { name: 'Document Verification', href: '/document-verification', icon: FileText },
  ];

  const allNavigation = isDemoMode() ? [...navigation, ...demoNavigation] : navigation;

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  if (!isAuthenticated || !boothConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Setup Required</h2>
          <p className="text-gray-600 mb-4">
            Please complete the booth setup to continue.
          </p>
          <Link
            to="/setup"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Setup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Booth Info */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-blue-600">FastVerify</h1>
              </div>
              <div className="ml-6 text-sm text-gray-600">
                <span className="font-medium">{boothConfig.boothName}</span>
                {boothConfig.location && (
                  <span className="ml-2 text-gray-400">• {boothConfig.location}</span>
                )}
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center">
                {isOnline ? (
                  <div className="flex items-center text-green-600">
                    <Wifi className="w-4 h-4 mr-1" />
                    <span className="text-xs font-medium">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <WifiOff className="w-4 h-4 mr-1" />
                    <span className="text-xs font-medium">Offline</span>
                  </div>
                )}
              </div>

              {/* Sync Status */}
              <div className="flex items-center">
                {syncStatus === 'syncing' ? (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent mr-1"></div>
                    <span className="text-xs font-medium">Syncing</span>
                  </div>
                ) : pendingSyncCount > 0 ? (
                  <div className="flex items-center text-yellow-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs font-medium">{pendingSyncCount} pending</span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-600">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    <span className="text-xs font-medium">All synced</span>
                  </div>
                )}
              </div>

              {/* Current Time */}
              <div className="text-xs text-gray-500">
                {new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-sm border-r border-gray-200">          <div className="p-4">
            <ul className="space-y-2">
              {allNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.href);
                
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mr-3 ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                      {item.name}
                      {isDemoMode() && demoNavigation.includes(item) && (
                        <span className="ml-auto text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                          Demo
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Booth Info Card */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gray-50 rounded-lg p-3 border">
              <div className="text-xs text-gray-600 mb-1">Booth ID</div>
              <div className="font-mono text-sm font-medium text-gray-900">
                {boothConfig.boothId}
              </div>
              {boothConfig.district && (
                <>
                  <div className="text-xs text-gray-600 mt-2 mb-1">District</div>
                  <div className="text-sm text-gray-900">{boothConfig.district}</div>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
