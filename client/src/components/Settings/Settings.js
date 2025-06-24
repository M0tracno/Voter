import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { DatabaseService } from '../../services/DatabaseService';
import { AuthService } from '../../services/AuthService';
import { SyncService } from '../../services/SyncService';
import ApiService from '../../services/ApiService';
import { isDemoMode, getDemoData } from '../../config/demoConfig';
import {
  CogIcon,
  ServerIcon,
  ShieldCheckIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  WifiIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';

const Settings = () => {  const { 
    syncStatus,
    actions 
  } = useApp();
  const [settings, setSettings] = useState({
    serverUrl: 'http://localhost:3001',
    syncInterval: 300, // 5 minutes
    maxRetries: 3,
    offlineMode: false,
    debugMode: false,
    autoSync: true,
    encryptionEnabled: true,
    maxAuditLogs: 10000
  });
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [boothConfig, setBoothConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  useEffect(() => {
    loadSettings();
    loadBoothConfig();
    checkConnection();
  }, [loadSettings]);

  const loadSettings = useCallback(async () => {
    try {
      if (isDemoMode()) {
        // Use demo settings
        const demoSettings = getDemoData('settings');
        setSettings({
          serverUrl: 'https://demo.fastverify.com',
          syncInterval: 300,
          maxRetries: 3,
          offlineMode: true,
          debugMode: demoSettings.system.debugMode,
          autoSync: demoSettings.system.autoBackupEnabled,
          encryptionEnabled: true,
          maxAuditLogs: 10000,
          ...demoSettings.verification,
          ...demoSettings.notifications
        });
        return;
      }      const savedSettings = await DatabaseService.getSettings();
      if (savedSettings) {
        setSettings({ ...settings, ...savedSettings });
      }
    } catch (error) {
      // Failed to load settings
    }
  }, [settings]);

  const loadBoothConfig = async () => {
    try {
      const config = AuthService.getBoothConfig();
      setBoothConfig(config);
    } catch (error) {
      // Console statement removed
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      const isReachable = await SyncService.canSync();
      setConnectionStatus(isReachable ? 'connected' : 'disconnected');
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await DatabaseService.saveSettings(settings);
        // Update API service with new server URL
      if (settings.serverUrl) {
        ApiService.setBaseURL(settings.serverUrl);
      }

      actions.setNotification({ message: 'Settings saved successfully', type: 'success' });
    } catch (error) {
      // Console statement removed
      actions.setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      
      // Temporarily update API service with test URL
      const originalUrl = ApiService.baseURL;
      ApiService.setBaseURL(settings.serverUrl);
      
      const isReachable = await SyncService.canSync();
      
      if (isReachable) {        setConnectionStatus('connected');
        actions.setNotification({ message: 'Connection test successful', type: 'success' });
      } else {
        setConnectionStatus('disconnected');
        actions.setError('Connection test failed');
      }
      
      // Restore original URL if test failed
      if (!isReachable) {
        ApiService.setBaseURL(originalUrl);
      }    } catch (error) {
      // Console statement removed
      setConnectionStatus('disconnected');
      actions.setError('Connection test failed: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const clearCache = async () => {
    if (window.confirm('This will clear all cached data except audit logs. Continue?')) {
      try {        await DatabaseService.clearCache();
        actions.setNotification({ message: 'Cache cleared successfully', type: 'success' });
      } catch (error) {
        // Console statement removed
        actions.setError('Failed to clear cache');
      }
    }
  };

  const resetToDefaults = async () => {
    if (window.confirm('This will reset all settings to default values. Continue?')) {
      const defaultSettings = {
        serverUrl: 'http://localhost:3001',
        syncInterval: 300,
        maxRetries: 3,
        offlineMode: false,
        debugMode: false,
        autoSync: true,
        encryptionEnabled: true,
        maxAuditLogs: 10000
      };
      setSettings(defaultSettings);
    }
  };
  const forceSync = async () => {
    try {
      actions.updateSyncStatus({ isSyncing: true });
        const pendingLogs = await DatabaseService.getPendingAuditLogs();
      const result = await SyncService.performFullSync(
        boothConfig?.booth_id,
        pendingLogs,
        syncStatus?.lastSync
      );

      if (result.success) {
        actions.updateSyncStatus({ 
          lastSync: result.timestamp,
          isSyncing: false,
          syncError: null
        });
        actions.setNotification({ 
          message: `Sync completed: ${result.results.auditLogsSynced} logs synced, ${result.results.votersUpdated} voters updated`,
          type: 'success'
        });
      } else {
        actions.updateSyncStatus({ 
          isSyncing: false,
          syncError: result.error
        });
        actions.setError('Sync failed: ' + result.error);
      }
    } catch (error) {
      // Console statement removed
      actions.updateSyncStatus({ 
        isSyncing: false,
        syncError: error.message
      });
      actions.setError('Force sync failed');
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <WifiIcon className="w-5 h-5 text-green-500" />;
      case 'disconnected':
        return <NoSymbolIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ArrowPathIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <CogIcon className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connection Settings */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ServerIcon className="w-6 h-6 mr-2" />
              Connection Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Server URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={settings.serverUrl}
                    onChange={(e) => setSettings({...settings, serverUrl: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="http://localhost:3001"
                  />
                  <button
                    onClick={testConnection}
                    disabled={testing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {testing ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {getConnectionStatusIcon()}
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Connection Status
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConnectionStatusColor()}`}>
                  {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Interval (seconds)
                </label>
                <input
                  type="number"
                  min="30"
                  max="3600"
                  value={settings.syncInterval}
                  onChange={(e) => setSettings({...settings, syncInterval: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Retry Attempts
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxRetries}
                  onChange={(e) => setSettings({...settings, maxRetries: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Application Settings */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CogIcon className="w-6 h-6 mr-2" />
              Application Settings
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Auto Sync
                  </label>
                  <p className="text-xs text-gray-500">
                    Automatically sync data when online
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSync}
                    onChange={(e) => setSettings({...settings, autoSync: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Offline Mode
                  </label>
                  <p className="text-xs text-gray-500">
                    Work without server connection
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.offlineMode}
                    onChange={(e) => setSettings({...settings, offlineMode: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Encryption
                  </label>
                  <p className="text-xs text-gray-500">
                    Encrypt sensitive data locally
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.encryptionEnabled}
                    onChange={(e) => setSettings({...settings, encryptionEnabled: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Debug Mode
                  </label>
                  <p className="text-xs text-gray-500">
                    Enable detailed logging
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.debugMode}
                    onChange={(e) => setSettings({...settings, debugMode: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Audit Logs
                </label>
                <input
                  type="number"
                  min="1000"
                  max="100000"
                  value={settings.maxAuditLogs}
                  onChange={(e) => setSettings({...settings, maxAuditLogs: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Booth Information */}
          {boothConfig && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <ShieldCheckIcon className="w-6 h-6 mr-2" />
                Booth Information
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Booth ID:</span>
                  <span className="text-sm text-gray-900">{boothConfig.booth_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Location:</span>
                  <span className="text-sm text-gray-900">{boothConfig.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Operator:</span>
                  <span className="text-sm text-gray-900">{boothConfig.operator_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Role:</span>
                  <span className="text-sm text-gray-900 capitalize">{boothConfig.role}</span>
                </div>
              </div>
            </div>
          )}

          {/* System Actions */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ArrowPathIcon className="w-6 h-6 mr-2" />
              System Actions
            </h2>            <div className="space-y-3">
              <button
                onClick={forceSync}
                disabled={syncStatus?.isSyncing}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${syncStatus?.isSyncing ? 'animate-spin' : ''}`} />
                {syncStatus?.isSyncing ? 'Syncing...' : 'Force Sync'}
              </button>

              <button
                onClick={clearCache}
                className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Clear Cache
              </button>

              <button
                onClick={resetToDefaults}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
