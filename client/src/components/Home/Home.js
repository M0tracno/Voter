import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  UserCheck, 
  Activity, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  BarChart3,
  Camera,
  FileText,
  Zap,
  TrendingUp,
  Shield,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isDemoMode, getDemoData } from '../../config/demoConfig';
import LiveDashboard from '../LiveDashboard/LiveDashboard';

function Home() {
  const navigate = useNavigate();  const {
    isOnline,
    syncStatus,
    pendingSyncCount,
    recentVerifications = [],
    activeSessions = [],
    actions,
    error,    loading
  } = useApp();

  const [todayStats, setTodayStats] = useState({
    total: 0,
    successful: 0,
    failed: 0
  });

  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [animateStats, setAnimateStats] = useState(false);

  // Trigger animation when stats change
  useEffect(() => {
    setAnimateStats(true);
    const timer = setTimeout(() => setAnimateStats(false), 500);
    return () => clearTimeout(timer);
  }, [todayStats]);  useEffect(() => {
    loadTodayStats();
  }, [recentVerifications]);

  const loadTodayStats = async () => {
    try {
      if (isDemoMode()) {
        // Use demo analytics data
        const demoAnalytics = getDemoData('analytics');
        setTodayStats({
          total: demoAnalytics.todayVerifications,
          successful: Math.floor(demoAnalytics.todayVerifications * 0.8),
          failed: Math.floor(demoAnalytics.todayVerifications * 0.2)
        });
        return;
      }

      // Calculate today's stats from recent verifications
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = recentVerifications.filter(log => 
        log.timestamp.startsWith(today)
      );

      setTodayStats({
        total: todayLogs.length,
        successful: todayLogs.filter(log => log.verification_result === 'SUCCESS').length,
        failed: todayLogs.filter(log => log.verification_result === 'FAILED').length
      });
    } catch (error) {
      console.error('Failed to load today stats:', error);
    }
  };

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (quickSearchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(quickSearchQuery.trim())}`);
    }
  };
  const handleSyncClick = async () => {
    if (isOnline && pendingSyncCount > 0) {
      await actions.handleSync();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600';
      case 'FAILED': return 'text-red-600';
      case 'PENDING': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle className="w-4 h-4" />;
      case 'FAILED': return <XCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };
  // Ensure recentVerifications is always an array and log for debug
  const displayVerifications = recentVerifications || [];
  const displaySessions = activeSessions || [];
  
  console.log('Home component - recentVerifications:', recentVerifications?.length);
  console.log('Home component - activeSessions:', activeSessions?.length);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FastVerify</h1>
              <p className="text-gray-600">Rapid Voter Identity Validation System</p>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
              
              {/* Sync Status */}
              {pendingSyncCount > 0 && (
                <button
                  onClick={handleSyncClick}
                  disabled={!isOnline || syncStatus === 'syncing'}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isOnline 
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                      : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {syncStatus === 'syncing' ? 'Syncing...' : `${pendingSyncCount} pending`}
                </button>
              )}
            </div>
          </div>          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={actions.clearError}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Voter Search</h2>
          <form onSubmit={handleQuickSearch} className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={quickSearchQuery}
                onChange={(e) => setQuickSearchQuery(e.target.value)}
                placeholder="Enter Voter ID or Name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={!quickSearchQuery.trim() || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-2">
            Search by Voter ID (exact or partial) or full name
          </p>        </div>

        {/* Enhanced Demo Dashboard - Real-time Activity */}
        {isDemoMode() && (
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="w-6 h-6" />
                  Live Demo Mode - Real-time Verification System
                </h2>
                <p className="text-blue-100 text-sm">
                  Simulating active voter verification with AI-powered authentication
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live System</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-green-300" />
                  <span className="text-sm text-blue-100">Active Now</span>
                </div>
                <p className="text-2xl font-bold">{displaySessions.length || 0}</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm text-blue-100">Success Rate</span>
                </div>
                <p className="text-2xl font-bold">
                  {todayStats.total > 0 ? Math.round((todayStats.successful / todayStats.total) * 100) : 85}%
                </p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-purple-300" />
                  <span className="text-sm text-blue-100">Security</span>
                </div>
                <p className="text-lg font-bold text-green-300">Optimal</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-cyan-300" />
                  <span className="text-sm text-blue-100">AI Confidence</span>
                </div>
                <p className="text-2xl font-bold">94%</p>
              </div>
            </div>
          </div>
        )}        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={`bg-white rounded-lg shadow-sm border p-6 transition-all duration-300 ${animateStats ? 'scale-105 shadow-md' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Verifications</p>
                <p className={`text-2xl font-bold text-gray-900 transition-all duration-300 ${animateStats ? 'text-blue-600' : ''}`}>
                  {todayStats.total}
                </p>
                {isDemoMode() && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    +{Math.floor(Math.random() * 5) + 1} in last minute
                  </p>
                )}
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-lg shadow-sm border p-6 transition-all duration-300 ${animateStats ? 'scale-105 shadow-md' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className={`text-2xl font-bold text-green-600 transition-all duration-300 ${animateStats ? 'text-green-500' : ''}`}>
                  {todayStats.successful}
                </p>
                {isDemoMode() && todayStats.total > 0 && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    {Math.round((todayStats.successful / todayStats.total) * 100)}% success rate
                  </p>
                )}
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-lg shadow-sm border p-6 transition-all duration-300 ${animateStats ? 'scale-105 shadow-md' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className={`text-2xl font-bold text-red-600 transition-all duration-300 ${animateStats ? 'text-red-500' : ''}`}>
                  {todayStats.failed}
                </p>
                {isDemoMode() && todayStats.failed > 0 && (
                  <p className="text-xs text-orange-600 font-medium mt-1">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Requires attention
                  </p>
                )}
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>{/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Link
            to="/search"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-blue-100 rounded-full mb-3 group-hover:bg-blue-200 transition-colors">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Search Voters</h3>
              <p className="text-sm text-gray-500">Find and verify voters</p>
            </div>
          </Link>

          <Link
            to="/audit"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-green-100 rounded-full mb-3 group-hover:bg-green-200 transition-colors">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Audit Logs</h3>
              <p className="text-sm text-gray-500">View verification history</p>
            </div>
          </Link>

          {/* Demo Mode: Add Face Verification */}
          {isDemoMode() && (
            <Link
              to="/face-verification"
              className="bg-white border border-orange-200 rounded-lg p-6 hover:bg-orange-50 transition-colors group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-orange-100 rounded-full mb-3 group-hover:bg-orange-200 transition-colors">
                  <Camera className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Face Verification</h3>
                <p className="text-sm text-gray-500">Test face recognition</p>
              </div>
            </Link>
          )}

          {/* Demo Mode: Add Document Verification */}
          {isDemoMode() && (
            <Link
              to="/document-verification"
              className="bg-white border border-purple-200 rounded-lg p-6 hover:bg-purple-50 transition-colors group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-purple-100 rounded-full mb-3 group-hover:bg-purple-200 transition-colors">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Document Verification</h3>
                <p className="text-sm text-gray-500">Test document scanning</p>
              </div>
            </Link>
          )}

          <button
            onClick={handleSyncClick}
            disabled={!isOnline || pendingSyncCount === 0}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-purple-100 rounded-full mb-3 group-hover:bg-purple-200 transition-colors">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Sync Data</h3>
              <p className="text-sm text-gray-500">
                {pendingSyncCount > 0 ? `${pendingSyncCount} pending` : 'All synced'}
              </p>
            </div>
          </button>

          <Link
            to="/settings"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-gray-100 rounded-full mb-3 group-hover:bg-gray-200 transition-colors">
                <UserCheck className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Settings</h3>
              <p className="text-sm text-gray-500">Configuration & setup</p>
            </div>
          </Link>
        </div>        {/* Recent Verifications */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                Recent Verifications
                {isDemoMode() && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Live Updates
                  </span>
                )}
              </h2>
              <Link
                to="/audit"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
          </div>          <div className="divide-y divide-gray-200">
            {displayVerifications.length > 0 ? (
              displayVerifications.slice(0, 5).map((log, index) => (
                <div 
                  key={log.log_id} 
                  className={`px-6 py-4 hover:bg-gray-50 transition-all duration-300 ${
                    index === 0 && isDemoMode() ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`${getStatusColor(log.verification_result)}`}>
                        {getStatusIcon(log.verification_result)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {log.voter_name || log.voter_id}
                          </p>
                          {index === 0 && isDemoMode() && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full animate-pulse">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {log.verification_method} verification • {log.booth_id || log.location}
                        </p>
                        {isDemoMode() && log.details && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getStatusColor(log.verification_result)}`}>
                        {log.verification_result}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                      {isDemoMode() && log.duration && (
                        <p className="text-xs text-gray-400">
                          {(log.duration / 1000).toFixed(1)}s
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  {isDemoMode() ? 'Starting demo verification system...' : 'No verifications yet today'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {isDemoMode() 
                    ? 'Live data will appear shortly' 
                    : 'Start verifying voters to see activity here'
                  }
                </p>
              </div>            )}
          </div>
        </div>

        {/* Live Dashboard - Demo Mode Only */}
        {isDemoMode() && (
          <div className="mb-6">
            <LiveDashboard />
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
