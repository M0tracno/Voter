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
  BarChart3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

function Home() {
  const navigate = useNavigate();
  const {
    isOnline,
    syncStatus,
    pendingSyncCount,
    recentVerifications,
    handleSync,
    clearError,
    error,
    loading
  } = useApp();

  const [todayStats, setTodayStats] = useState({
    total: 0,
    successful: 0,
    failed: 0
  });

  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  useEffect(() => {
    loadTodayStats();
  }, [recentVerifications]);

  const loadTodayStats = async () => {
    try {
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
      await handleSync();
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
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={clearError}
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
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Verifications</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.successful}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{todayStats.failed}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
        </div>

        {/* Recent Verifications */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Verifications</h2>
              <Link
                to="/audit"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentVerifications.length > 0 ? (
              recentVerifications.slice(0, 5).map((log) => (
                <div key={log.log_id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`${getStatusColor(log.verification_result)}`}>
                        {getStatusIcon(log.verification_result)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {log.voter_name || log.voter_id}
                        </p>
                        <p className="text-sm text-gray-500">
                          {log.verification_method} verification • {log.booth_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getStatusColor(log.verification_result)}`}>
                        {log.verification_result}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No verifications yet today</p>
                <p className="text-sm text-gray-400 mt-1">
                  Start verifying voters to see activity here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
