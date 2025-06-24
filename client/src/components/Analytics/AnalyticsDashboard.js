import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Users, CheckCircle, XCircle, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { isDemoMode, getDemoData, simulateApiCall } from '../../config/demoConfig';

function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');
  useEffect(() => {
    loadAnalytics();
  }, [timeRange, loadAnalytics]);
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemoMode()) {
        await simulateApiCall(null, 800);
        const demoAnalytics = getDemoData('analytics');
        setAnalytics(demoAnalytics);
      } else {
        // Real API call for analytics
        const response = await fetch(`/api/analytics?range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        const result = await response.json();
        setAnalytics(result.data);
      }
    } catch (error) {
      // Failed to load analytics
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-600">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Unavailable</h2>
            <p className="text-gray-600">Unable to load analytics data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Real-time verification statistics and insights
              </p>
              {isDemoMode() && (
                <div className="mt-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm inline-block">
                  Demo Mode - Sample Data
                </div>
              )}
            </div>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Voters</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalVoters.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified Voters</p>
                <p className="text-2xl font-bold text-green-600">{analytics.verifiedVoters.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{analytics.pendingVerifications.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Activity className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Verifications</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.todayVerifications}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Simple Charts using CSS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Hourly Verification Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Verification Activity</h3>
            <div className="space-y-3">
              {analytics.hourlyStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-16">{stat.hour}</span>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${(stat.verifications / Math.max(...analytics.hourlyStats.map(s => s.verifications))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{stat.verifications}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Types Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Methods</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-600 rounded mr-3"></div>
                  <span className="text-sm text-gray-600">Manual</span>
                </div>
                <span className="text-sm font-medium">{analytics.verificationTypes.manual}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-600 rounded mr-3"></div>
                  <span className="text-sm text-gray-600">Face Recognition</span>
                </div>
                <span className="text-sm font-medium">{analytics.verificationTypes.face}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-600 rounded mr-3"></div>
                  <span className="text-sm text-gray-600">Document</span>
                </div>
                <span className="text-sm font-medium">{analytics.verificationTypes.document}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fraud Detection Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fraud Detection Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{analytics.fraudDetection.flagged}</p>
              <p className="text-sm text-gray-600">Cases Flagged</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{analytics.fraudDetection.resolved}</p>
              <p className="text-sm text-gray-600">Cases Resolved</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{analytics.fraudDetection.pending}</p>
              <p className="text-sm text-gray-600">Cases Pending</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <h4 className="text-lg font-semibold mb-2">Success Rate</h4>
            <p className="text-3xl font-bold">
              {((analytics.verifiedVoters / analytics.totalVoters) * 100).toFixed(1)}%
            </p>
            <p className="text-blue-100 text-sm mt-1">
              {analytics.verifiedVoters} of {analytics.totalVoters} voters verified
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <h4 className="text-lg font-semibold mb-2">Efficiency Score</h4>
            <p className="text-3xl font-bold">
              {isDemoMode() ? '94.2' : '90.5'}%
            </p>
            <p className="text-green-100 text-sm mt-1">
              Based on verification speed and accuracy
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <h4 className="text-lg font-semibold mb-2">Security Index</h4>
            <p className="text-3xl font-bold">
              {isDemoMode() ? '98.7' : '96.3'}%
            </p>
            <p className="text-purple-100 text-sm mt-1">
              Fraud detection and prevention score
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
