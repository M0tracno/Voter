import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Clock,
  Cpu,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isDemoMode } from '../../config/demoConfig';

function LiveDashboard() {
  const { activeSessions } = useApp();
  const displaySessions = activeSessions || [];
  
  // Console statement removed
  const [systemMetrics, setSystemMetrics] = useState({
    cpuUsage: 45,
    memoryUsage: 68,
    diskUsage: 23,
    networkLatency: 12,
    activeConnections: 847,
    uptime: '99.9%'
  });

  const [realtimeStats, setRealtimeStats] = useState({
    verificationsPerMinute: 8,
    averageResponseTime: 1.2,
    successRate: 94.5,
    errorRate: 0.8
  });

  // Simulate live system metrics updates
  useEffect(() => {
    if (!isDemoMode()) return;

    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        cpuUsage: Math.max(20, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(30, Math.min(85, prev.memoryUsage + (Math.random() - 0.5) * 8)),
        diskUsage: Math.max(15, Math.min(95, prev.diskUsage + (Math.random() - 0.5) * 2)),
        networkLatency: Math.max(5, Math.min(50, prev.networkLatency + (Math.random() - 0.5) * 8)),
        activeConnections: Math.max(500, Math.min(1200, prev.activeConnections + Math.floor((Math.random() - 0.5) * 50))),
        uptime: '99.9%'
      }));

      setRealtimeStats(prev => ({
        verificationsPerMinute: Math.max(2, Math.min(15, prev.verificationsPerMinute + (Math.random() - 0.5) * 3)),
        averageResponseTime: Math.max(0.5, Math.min(3.0, prev.averageResponseTime + (Math.random() - 0.5) * 0.4)),
        successRate: Math.max(85, Math.min(98, prev.successRate + (Math.random() - 0.5) * 2)),
        errorRate: Math.max(0.1, Math.min(5.0, prev.errorRate + (Math.random() - 0.5) * 0.5))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!isDemoMode()) return null;

  const getMetricColor = (value, thresholds = { good: 70, warning: 85 }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricBgColor = (value, thresholds = { good: 70, warning: 85 }) => {
    if (value <= thresholds.good) return 'bg-green-50 border-green-200';
    if (value <= thresholds.warning) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Real-time Performance Metrics */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            System Performance
          </h3>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Monitoring
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className={`p-3 rounded-lg border ${getMetricBgColor(systemMetrics.cpuUsage)}`}>
            <div className="text-xs text-gray-600 mb-1">CPU Usage</div>
            <div className={`text-lg font-bold ${getMetricColor(systemMetrics.cpuUsage)}`}>
              {systemMetrics.cpuUsage.toFixed(1)}%
            </div>
          </div>

          <div className={`p-3 rounded-lg border ${getMetricBgColor(systemMetrics.memoryUsage)}`}>
            <div className="text-xs text-gray-600 mb-1">Memory</div>
            <div className={`text-lg font-bold ${getMetricColor(systemMetrics.memoryUsage)}`}>
              {systemMetrics.memoryUsage.toFixed(1)}%
            </div>
          </div>

          <div className={`p-3 rounded-lg border ${getMetricBgColor(systemMetrics.diskUsage, { good: 80, warning: 90 })}`}>
            <div className="text-xs text-gray-600 mb-1">Disk Usage</div>
            <div className={`text-lg font-bold ${getMetricColor(systemMetrics.diskUsage, { good: 80, warning: 90 })}`}>
              {systemMetrics.diskUsage.toFixed(1)}%
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
            <div className="text-xs text-gray-600 mb-1">Latency</div>
            <div className="text-lg font-bold text-blue-600">
              {systemMetrics.networkLatency.toFixed(0)}ms
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-purple-50 border-purple-200">
            <div className="text-xs text-gray-600 mb-1">Connections</div>
            <div className="text-lg font-bold text-purple-600">
              {systemMetrics.activeConnections}
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-green-50 border-green-200">
            <div className="text-xs text-gray-600 mb-1">Uptime</div>
            <div className="text-lg font-bold text-green-600">
              {systemMetrics.uptime}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Verification Metrics */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Verification Analytics
          </h3>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Verifications/min</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {realtimeStats.verificationsPerMinute.toFixed(1)}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              ↑ {(Math.random() * 10 + 5).toFixed(1)}% from last hour
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {realtimeStats.successRate.toFixed(1)}%
            </div>
            <div className="text-xs text-green-600 mt-1">
              ↑ {(Math.random() * 2 + 1).toFixed(1)}% from yesterday
            </div>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Avg Response</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {realtimeStats.averageResponseTime.toFixed(1)}s
            </div>
            <div className="text-xs text-purple-600 mt-1">
              ↓ {(Math.random() * 5 + 2).toFixed(1)}% improvement
            </div>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Error Rate</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {realtimeStats.errorRate.toFixed(1)}%
            </div>
            <div className="text-xs text-orange-600 mt-1">
              ↓ {(Math.random() * 3 + 1).toFixed(1)}% reduction
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Active Sessions
          </h3>          <div className="text-sm text-gray-500">
            {displaySessions.length} active
          </div>
        </div>        <div className="space-y-2">          {displaySessions.slice(0, 3).map((session) => (
            <div key={session.session_id || session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <div className="font-medium text-gray-900">{session.voter_name || `Session ${session.session_id || session.id}`}</div>
                  <div className="text-sm text-gray-500">
                    {session.verification_method || session.verificationType || 'Verification'} • {session.location || session.booth_id || 'Demo Location'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {session.status || 'Active'}
                </div>
                <div className="text-xs text-gray-500">
                  {Math.floor(Math.random() * 30 + 10)}s elapsed
                </div>
              </div>
            </div>
          ))}
            {displaySessions.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No active sessions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveDashboard;
