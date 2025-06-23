import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DatabaseService } from '../../services/DatabaseService';
import { isDemoMode, getDemoData, simulateApiCall } from '../../config/demoConfig';
import { 
  DocumentTextIcon, 
  CalendarDaysIcon, 
  ArrowDownTrayIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const AuditLogs = () => {
  const { actions } = useApp();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    result: 'all',
    method: 'all',
    searchTerm: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0
  });

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);
  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      if (isDemoMode()) {
        // Use demo audit logs
        await simulateApiCall(null, 600);
        const demoLogs = getDemoData('auditLogs');
        
        // Convert demo logs to match expected format
        const formattedLogs = demoLogs.map(log => ({
          log_id: log.id,
          timestamp: log.timestamp,
          action: log.action,
          user_id: log.userId,
          user_name: log.userName,
          voter_id: log.voterId,
          voter_name: log.voterName,
          verification_result: log.status,
          verification_method: log.action.includes('FACE') ? 'FACE' : 
                               log.action.includes('DOCUMENT') ? 'DOCUMENT' : 'MANUAL',
          details: log.details,
          ip_address: log.ip,
          booth_id: 'demo-booth-001'
        }));
        
        setLogs(formattedLogs);
        calculateStats(formattedLogs);
      } else {
        const auditLogs = await DatabaseService.getAuditLogs();
        setLogs(auditLogs);
        calculateStats(auditLogs);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      actions.setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (logData) => {
    const stats = {
      total: logData.length,
      successful: logData.filter(log => log.verification_result === 'success').length,
      failed: logData.filter(log => log.verification_result === 'failed').length,
      pending: logData.filter(log => log.verification_result === 'pending').length
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) <= new Date(filters.endDate + 'T23:59:59')
      );
    }

    // Result filter
    if (filters.result !== 'all') {
      filtered = filtered.filter(log => log.verification_result === filters.result);
    }

    // Method filter
    if (filters.method !== 'all') {
      filtered = filtered.filter(log => log.verification_method === filters.method);
    }

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.voter_id?.toLowerCase().includes(term) ||
        log.failure_reason?.toLowerCase().includes(term) ||
        log.operator_id?.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
  };

  const exportToCSV = () => {
    try {
      const headers = [
        'Timestamp',
        'Voter ID',
        'Method',
        'Result',
        'Failure Reason',
        'Operator ID',
        'IP Address'
      ];

      const csvContent = [
        headers.join(','),
        ...filteredLogs.map(log => [
          new Date(log.timestamp).toLocaleString(),
          log.voter_id || '',
          log.verification_method || '',
          log.verification_result || '',
          log.failure_reason || '',
          log.operator_id || '',
          log.ip_address || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);    } catch (error) {
      console.error('Failed to export CSV:', error);
      actions.setError('Failed to export audit logs');
    }
  };

  const clearOldLogs = async () => {
    if (window.confirm('This will delete audit logs older than 30 days. Continue?')) {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        await DatabaseService.clearOldAuditLogs(thirtyDaysAgo.toISOString());        await loadAuditLogs();
        
        actions.setNotification({ message: 'Old audit logs cleared successfully', type: 'success' });
      } catch (error) {
        console.error('Failed to clear old logs:', error);
        actions.setError('Failed to clear old logs');
      }
    }
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <DocumentTextIcon className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filters
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Verifications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <DocumentTextIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <XCircleIcon className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <ClockIcon className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg border mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Result
                  </label>
                  <select
                    value={filters.result}
                    onChange={(e) => setFilters({...filters, result: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Results</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method
                  </label>
                  <select
                    value={filters.method}
                    onChange={(e) => setFilters({...filters, method: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Methods</option>
                    <option value="manual">Manual</option>
                    <option value="qr_scan">QR Scan</option>
                    <option value="mobile_search">Mobile Search</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Voter ID, Operator..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({
                      startDate: '',
                      endDate: '',
                      result: 'all',
                      method: 'all',
                      searchTerm: ''
                    })}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voter ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operator
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No audit logs found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => (
                    <tr key={log.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <CalendarDaysIcon className="w-4 h-4 text-gray-400 mr-2" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.voter_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="capitalize">
                          {log.verification_method?.replace('_', ' ') || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getResultIcon(log.verification_result)}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getResultColor(log.verification_result)}`}>
                            {log.verification_result?.charAt(0).toUpperCase() + log.verification_result?.slice(1) || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.failure_reason || 'Verification completed successfully'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.operator_id || 'System'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Showing {filteredLogs.length} of {logs.length} audit logs
            </p>
          </div>
          <div>
            <button
              onClick={clearOldLogs}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Clear Old Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
