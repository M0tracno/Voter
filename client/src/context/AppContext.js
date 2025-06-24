import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { SyncService } from '../services/SyncService';
import { DatabaseService } from '../services/DatabaseService';
import { isDemoMode, getDemoData, startLiveDemo, stopLiveDemo, generateDemoNotification, generateLiveStats } from '../config/demoConfig';
import demoSoundService from '../services/DemoSoundService';

// Initial state
const initialState = {
  // Authentication
  authToken: null,
  boothConfig: null,
  
  // Network status
  isOnline: navigator.onLine,
  
  // Current verification session
  currentVoter: null,
  verificationStep: 'search', // 'search', 'confirm', 'otp', 'result'
  verificationData: null,
  
  // Data
  recentVerifications: [],
  activeSessions: [],
  
  // Sync status
  syncStatus: {
    lastSync: null,
    pendingLogs: 0,
    isSyncing: false,
    syncError: null
  },
  
  // Statistics
  stats: {
    todayVerifications: 0,
    successfulVerifications: 0,
    failedVerifications: 0
  },
  
  // UI state
  loading: false,
  error: null,
  notification: null
};

// Action types
const ActionTypes = {
  SET_AUTH: 'SET_AUTH',
  SET_BOOTH_CONFIG: 'SET_BOOTH_CONFIG',
  SET_ONLINE: 'SET_ONLINE',
  SET_CURRENT_VOTER: 'SET_CURRENT_VOTER',
  SET_VERIFICATION_STEP: 'SET_VERIFICATION_STEP',
  SET_VERIFICATION_DATA: 'SET_VERIFICATION_DATA',
  UPDATE_SYNC_STATUS: 'UPDATE_SYNC_STATUS',
  UPDATE_STATS: 'UPDATE_STATS',
  SET_RECENT_VERIFICATIONS: 'SET_RECENT_VERIFICATIONS',
  SET_ACTIVE_SESSIONS: 'SET_ACTIVE_SESSIONS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_NOTIFICATION: 'SET_NOTIFICATION',
  CLEAR_ERROR: 'CLEAR_ERROR',
  CLEAR_NOTIFICATION: 'CLEAR_NOTIFICATION',
  RESET_VERIFICATION: 'RESET_VERIFICATION'
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_AUTH:
      return {
        ...state,
        authToken: action.payload
      };
      
    case ActionTypes.SET_BOOTH_CONFIG:
      return {
        ...state,
        boothConfig: action.payload
      };
      
    case ActionTypes.SET_ONLINE:
      return {
        ...state,
        isOnline: action.payload
      };
      
    case ActionTypes.SET_CURRENT_VOTER:
      return {
        ...state,
        currentVoter: action.payload
      };
      
    case ActionTypes.SET_VERIFICATION_STEP:
      return {
        ...state,
        verificationStep: action.payload
      };
      
    case ActionTypes.SET_VERIFICATION_DATA:
      return {
        ...state,
        verificationData: action.payload
      };
      
    case ActionTypes.UPDATE_SYNC_STATUS:
      return {
        ...state,
        syncStatus: {
          ...state.syncStatus,
          ...action.payload
        }
      };
      
    case ActionTypes.UPDATE_STATS:
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.payload
        }
      };
      
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
      
    case ActionTypes.SET_NOTIFICATION:
      return {
        ...state,
        notification: action.payload
      };
      
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
        case ActionTypes.CLEAR_NOTIFICATION:
      return {
        ...state,
        notification: null
      };
        case ActionTypes.SET_RECENT_VERIFICATIONS:
      return {
        ...state,
        recentVerifications: typeof action.payload === 'function' 
          ? action.payload(state.recentVerifications)
          : action.payload
      };
      
    case ActionTypes.SET_ACTIVE_SESSIONS:
      return {
        ...state,
        activeSessions: action.payload
      };
      
    case ActionTypes.RESET_VERIFICATION:
      return {
        ...state,
        currentVoter: null,
        verificationStep: 'search',
        verificationData: null
      };
      
    default:
      return state;
  }
}

// Context
const AppContext = createContext();

// Provider component
export function AppProvider({ children, initialConfig = {} }) {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    ...initialConfig
  });

  // Ref to track current verifications for live demo
  const currentVerificationsRef = useRef([]);
  // Action creators
  const actions = {
    setAuth: (token) => dispatch({ type: ActionTypes.SET_AUTH, payload: token }),
    
    setBoothConfig: (config) => dispatch({ type: ActionTypes.SET_BOOTH_CONFIG, payload: config }),
    
    setOnline: (isOnline) => dispatch({ type: ActionTypes.SET_ONLINE, payload: isOnline }),
    
    setCurrentVoter: (voter) => dispatch({ type: ActionTypes.SET_CURRENT_VOTER, payload: voter }),
    
    setVerificationStep: (step) => dispatch({ type: ActionTypes.SET_VERIFICATION_STEP, payload: step }),
    
    setVerificationData: (data) => dispatch({ type: ActionTypes.SET_VERIFICATION_DATA, payload: data }),
    
    updateSyncStatus: (status) => dispatch({ type: ActionTypes.UPDATE_SYNC_STATUS, payload: status }),
    
    updateStats: (stats) => dispatch({ type: ActionTypes.UPDATE_STATS, payload: stats }),
    
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    
    setNotification: (notification) => dispatch({ type: ActionTypes.SET_NOTIFICATION, payload: notification }),
    
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),
    
    clearNotification: () => dispatch({ type: ActionTypes.CLEAR_NOTIFICATION }),
    
    resetVerification: () => dispatch({ type: ActionTypes.RESET_VERIFICATION }),
    
    setRecentVerifications: (verifications) => dispatch({ type: ActionTypes.SET_RECENT_VERIFICATIONS, payload: verifications }),
    
    setActiveSessions: (sessions) => dispatch({ type: ActionTypes.SET_ACTIVE_SESSIONS, payload: sessions }),

    // Show notification with auto-clear
    showNotification: (message, type = 'info', duration = 3000) => {
      dispatch({ type: ActionTypes.SET_NOTIFICATION, payload: { message, type } });
      setTimeout(() => dispatch({ type: ActionTypes.CLEAR_NOTIFICATION }), duration);
    }
  };

  // Initialize demo data on mount
  useEffect(() => {
    if (isDemoMode()) {
      // Console statement removed
      const demoAuditLogs = getDemoData('auditLogs') || [];
      const demoSessions = getDemoData('sessions') || [];
        
      // Always ensure we have arrays even if the data is null
      currentVerificationsRef.current = demoAuditLogs;
      dispatch({ type: ActionTypes.SET_RECENT_VERIFICATIONS, payload: demoAuditLogs });
      // Console statement removed
        
      dispatch({ type: ActionTypes.SET_ACTIVE_SESSIONS, payload: demoSessions });
      // Console statement removed
        
      // Start live demo updates
      // Console statement removed
      
      // Announce demo startup - only if sound service is ready
      setTimeout(() => {
        try {
          demoSoundService.announceStartup();
        } catch (error) {
          // Console statement removed
        }
      }, 2000);
      const liveInterval = startLiveDemo((newVerification) => {
        // Console statement removed
          // Add to recent verifications (keep only last 20)
        currentVerificationsRef.current = [newVerification, ...currentVerificationsRef.current].slice(0, 20);
        dispatch({ 
          type: ActionTypes.SET_RECENT_VERIFICATIONS, 
          payload: currentVerificationsRef.current
        });
          // Play sound and announce verification
        const isSuccess = newVerification.verification_result === 'SUCCESS';
        demoSoundService.announceVerification(
          newVerification.voter_name, 
          newVerification.verification_method, 
          isSuccess
        );
        
        // Show notification for successful verifications
        if (newVerification.verification_result === 'SUCCESS') {
          dispatch({ 
            type: ActionTypes.SET_NOTIFICATION, 
            payload: { 
              message: `✅ ${newVerification.voter_name} verified successfully via ${newVerification.verification_method}`,
              type: 'success' 
            } 
          });
          setTimeout(() => dispatch({ type: ActionTypes.CLEAR_NOTIFICATION }), 4000);
        }
      });      // Generate periodic notifications
      const notificationInterval = setInterval(() => {
        const notification = generateDemoNotification();
        dispatch({ 
          type: ActionTypes.SET_NOTIFICATION, 
          payload: { message: notification.message, type: notification.type } 
        });
        setTimeout(() => dispatch({ type: ActionTypes.CLEAR_NOTIFICATION }), 5000);
      }, 20000); // Every 20 seconds

      // Update stats periodically
      const statsInterval = setInterval(() => {
        const liveStats = generateLiveStats();
        dispatch({ type: ActionTypes.UPDATE_STATS, payload: liveStats });
      }, 5000); // Every 5 seconds

      // Cleanup function
      return () => {
        if (liveInterval) stopLiveDemo(liveInterval);
        if (notificationInterval) clearInterval(notificationInterval);
        if (statsInterval) clearInterval(statsInterval);
      };
    }
  }, []);

  // Auto-sync when online
  useEffect(() => {
    let syncInterval;
    
    // Skip sync setup in demo mode
    if (!isDemoMode() && state.isOnline && state.authToken) {
      // Initial sync
      handleSync();
      
      // Set up periodic sync (every 5 minutes)
      syncInterval = setInterval(handleSync, 5 * 60 * 1000);
    }

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isOnline, state.authToken]);
  // Update statistics periodically
  useEffect(() => {
    if (!isDemoMode()) {
      updateStats();
      const statsInterval = setInterval(updateStats, 30000); // Every 30 seconds
      return () => clearInterval(statsInterval);
    }
  }, [updateStats]);
  // Helper functions
  const handleSync = async () => {
    // Skip sync in demo mode
    if (isDemoMode()) {
      // Console statement removed
      return;
    }

    if (!state.isOnline || !state.authToken || state.syncStatus.isSyncing) {
      return;
    }

    try {
      actions.updateSyncStatus({ isSyncing: true, syncError: null });
      
      // Get pending audit logs
      const pendingLogs = await DatabaseService.getPendingAuditLogs();
      
      if (pendingLogs.length > 0) {
        // Sync with server
        await SyncService.syncAuditLogs(pendingLogs, state.boothConfig.booth_id);
        
        // Mark logs as synced
        await DatabaseService.markLogsAsSynced(pendingLogs.map(log => log.id));
      }

      // Get voter updates
      const lastSync = await DatabaseService.getLastSyncTime();
      const voterUpdates = await SyncService.getVoterUpdates(state.boothConfig.booth_id, lastSync);
      
      if (voterUpdates.voters.length > 0) {
        await DatabaseService.updateVoters(voterUpdates.voters);
      }

      // Update sync status
      actions.updateSyncStatus({
        isSyncing: false,
        lastSync: new Date().toISOString(),
        pendingLogs: 0,
        syncError: null
      });

      // Save sync time
      await DatabaseService.setLastSyncTime(new Date().toISOString());
      
    } catch (error) {
      // Console statement removed
      actions.updateSyncStatus({
        isSyncing: false,
        syncError: error.message
      });
    }
  };

  const updateStats = async () => {
    try {
      const stats = await DatabaseService.getTodayStats();
      actions.updateStats(stats);
      
      const pendingCount = await DatabaseService.getPendingLogsCount();
      actions.updateSyncStatus({ pendingLogs: pendingCount });
    } catch (error) {
      // Console statement removed
    }
  };

  // Enhanced actions
  const enhancedActions = {
    ...actions,
      // Manual sync trigger
    triggerSync: handleSync,

    // Demo-specific methods
    searchVoter: async (query) => {
      if (isDemoMode()) {
        const demoVoters = getDemoData('voters');
        return demoVoters.filter(voter => 
          voter.voterId.toLowerCase().includes(query.toLowerCase()) ||
          voter.name.toLowerCase().includes(query.toLowerCase())
        );
      }
      // Normal mode implementation would go here
      return [];
    },

    selectVoter: (voter) => {
      actions.setCurrentVoter(voter);
    },

    handleSync: isDemoMode() ? () => Promise.resolve() : handleSync,
    
    // Add audit log
    addAuditLog: async (logData) => {
      try {
        await DatabaseService.addAuditLog({
          ...logData,
          booth_id: state.boothConfig.booth_id,
          timestamp: new Date().toISOString()
        });
        
        // Update stats
        updateStats();
        
        // Try to sync if online
        if (state.isOnline) {
          setTimeout(handleSync, 1000); // Delay to avoid race conditions
        }
      } catch (error) {
        // Console statement removed
        actions.setError('Failed to record verification');
      }
    },
    
    // Show notification with auto-clear
    showNotification: (message, type = 'info', duration = 3000) => {
      actions.setNotification({ message, type });
      setTimeout(() => actions.clearNotification(), duration);
    }
  };  const value = {
    ...state,
    actions: enhancedActions,
    // Computed properties
    pendingSyncCount: state.syncStatus?.pendingLogs || 0
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export { ActionTypes, AppContext };
