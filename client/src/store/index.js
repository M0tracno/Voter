import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthService } from '../services/AuthService';
import { ApiService } from '../services/ApiService';
import notificationService from '../services/NotificationService';

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      refreshToken: null,
      boothConfig: null,
      sessionTimeout: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await ApiService.login(credentials);
          
          if (response.success) {
            const { accessToken, refreshToken, user, boothConfig } = response.data;
            
            AuthService.setTokens(accessToken, refreshToken);
            AuthService.setUser(user);
            AuthService.setBoothConfig(boothConfig);
            
            set({
              user,
              isAuthenticated: true,
              token: accessToken,
              refreshToken,
              boothConfig,
              isLoading: false
            });

            notificationService.success('Login successful!');
            return { success: true };
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          notificationService.error(error.message);
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        try {
          await AuthService.logout();
          set({
            user: null,
            isAuthenticated: false,
            token: null,
            refreshToken: null,
            boothConfig: null,
            sessionTimeout: null
          });
          notificationService.info('Logged out successfully');
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      refreshSession: async () => {
        try {
          const newToken = await AuthService.refreshToken();
          set({ token: newToken });
          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      loadFromStorage: () => {
        const user = AuthService.getUser();
        const token = AuthService.getToken();
        const refreshToken = AuthService.getRefreshToken();
        const boothConfig = AuthService.getBoothConfig();
        const isAuthenticated = AuthService.isAuthenticated();

        set({
          user,
          token,
          refreshToken,
          boothConfig,
          isAuthenticated
        });
      },

      setSessionTimeout: (timeout) => {
        set({ sessionTimeout: timeout });
      },

      clearSessionTimeout: () => {
        const { sessionTimeout } = get();
        if (sessionTimeout) {
          clearTimeout(sessionTimeout);
          set({ sessionTimeout: null });
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        boothConfig: state.boothConfig
      })
    }
  )
);

// App Store
export const useAppStore = create((set, get) => ({
  // State
  isOnline: navigator.onLine,
  isLoading: false,
  currentRoute: '/',
  sidebarOpen: false,
  theme: 'light',
  language: 'en',
  notifications: [],
  errors: [],

  // Actions
  setOnlineStatus: (status) => set({ isOnline: status }),
  setLoading: (loading) => set({ isLoading: loading }),
  setCurrentRoute: (route) => set({ currentRoute: route }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  
  addNotification: (notification) => {
    const id = Date.now().toString();
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }]
    }));
    return id;
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },
  
  clearNotifications: () => set({ notifications: [] }),
  
  addError: (error) => {
    const id = Date.now().toString();
    set((state) => ({
      errors: [...state.errors, { ...error, id, timestamp: new Date() }]
    }));
    return id;
  },
  
  removeError: (id) => {
    set((state) => ({
      errors: state.errors.filter(e => e.id !== id)
    }));
  },
  
  clearErrors: () => set({ errors: [] })
}));

// Voter Store
export const useVoterStore = create((set, get) => ({
  // State
  voters: [],
  searchResults: [],
  currentVoter: null,
  isSearching: false,
  searchQuery: '',
  searchType: 'id',
  totalVoters: 0,
  verifiedCount: 0,
  pendingCount: 0,

  // Actions
  setVoters: (voters) => set({ voters }),
  
  setSearchResults: (results) => set({ searchResults: results }),
  
  setCurrentVoter: (voter) => set({ currentVoter: voter }),
  
  searchVoters: async (query, type = 'id') => {
    set({ isSearching: true, searchQuery: query, searchType: type });
    try {
      const response = await ApiService.searchVoters(query, type);
      if (response.success) {
        set({ 
          searchResults: response.data.voters,
          isSearching: false 
        });
        return response.data.voters;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({ isSearching: false });
      notificationService.error(`Search failed: ${error.message}`);
      return [];
    }
  },
  
  clearSearch: () => {
    set({ 
      searchResults: [], 
      searchQuery: '', 
      currentVoter: null 
    });
  },
  
  updateVoterStats: (stats) => {
    set({
      totalVoters: stats.total || 0,
      verifiedCount: stats.verified || 0,
      pendingCount: stats.pending || 0
    });
  },
  
  addVoter: (voter) => {
    set((state) => ({
      voters: [...state.voters, voter],
      totalVoters: state.totalVoters + 1
    }));
  },
  
  updateVoter: (voterId, updates) => {
    set((state) => ({
      voters: state.voters.map(v => 
        v.id === voterId ? { ...v, ...updates } : v
      ),
      currentVoter: state.currentVoter?.id === voterId 
        ? { ...state.currentVoter, ...updates }
        : state.currentVoter
    }));
  },
  
  removeVoter: (voterId) => {
    set((state) => ({
      voters: state.voters.filter(v => v.id !== voterId),
      currentVoter: state.currentVoter?.id === voterId ? null : state.currentVoter,
      totalVoters: Math.max(0, state.totalVoters - 1)
    }));
  }
}));

// Verification Store
export const useVerificationStore = create((set, get) => ({
  // State
  sessions: [],
  currentSession: null,
  isVerifying: false,
  otpSent: false,
  verificationStep: 'search', // 'search', 'verify', 'otp', 'complete'
  stats: {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0
  },

  // Actions
  setVerificationStep: (step) => set({ verificationStep: step }),
  
  startVerification: (voter) => {
    const sessionId = Date.now().toString();
    const session = {
      id: sessionId,
      voter,
      startTime: new Date(),
      status: 'pending',
      step: 'verify'
    };
    
    set((state) => ({
      currentSession: session,
      sessions: [...state.sessions, session],
      verificationStep: 'verify',
      isVerifying: true
    }));
    
    return sessionId;
  },
  
  sendOTP: async (voterId, boothId) => {
    set({ isVerifying: true });
    try {
      const response = await ApiService.sendOTP(voterId, boothId);
      if (response.success) {
        set({ 
          otpSent: true, 
          verificationStep: 'otp',
          isVerifying: false 
        });
        notificationService.otpSent(response.data.phoneNumber);
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({ isVerifying: false });
      notificationService.verificationError(error.message);
      throw error;
    }
  },
  
  verifyOTP: async (voterId, otpCode, verificationId, boothId) => {
    set({ isVerifying: true });
    try {
      const response = await ApiService.verifyOTP(voterId, otpCode, verificationId, boothId);
      if (response.success) {
        const { currentSession } = get();
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            status: 'completed',
            endTime: new Date(),
            result: response.data
          };
          
          set((state) => ({
            currentSession: updatedSession,
            sessions: state.sessions.map(s => 
              s.id === currentSession.id ? updatedSession : s
            ),
            verificationStep: 'complete',
            isVerifying: false,
            otpSent: false
          }));
        }
        
        notificationService.verificationSuccess(currentSession?.voter?.name || 'Voter');
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({ isVerifying: false });
      notificationService.verificationError(error.message);
      throw error;
    }
  },
  
  manualVerify: async (voterId, boothId, reason) => {
    set({ isVerifying: true });
    try {
      const response = await ApiService.manualVerify(voterId, boothId, reason);
      if (response.success) {
        const { currentSession } = get();
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            status: 'completed',
            endTime: new Date(),
            result: response.data,
            manual: true,
            reason
          };
          
          set((state) => ({
            currentSession: updatedSession,
            sessions: state.sessions.map(s => 
              s.id === currentSession.id ? updatedSession : s
            ),
            verificationStep: 'complete',
            isVerifying: false
          }));
        }
        
        notificationService.verificationSuccess(currentSession?.voter?.name || 'Voter');
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({ isVerifying: false });
      notificationService.verificationError(error.message);
      throw error;
    }
  },
  
  resetVerification: () => {
    set({
      currentSession: null,
      verificationStep: 'search',
      isVerifying: false,
      otpSent: false
    });
  },
  
  updateStats: (stats) => {
    set({ stats });
  },
  
  addSession: (session) => {
    set((state) => ({
      sessions: [...state.sessions, session]
    }));
  }
}));

// Sync Store
export const useSyncStore = create((set, get) => ({
  // State
  lastSync: null,
  isSyncing: false,
  syncProgress: 0,
  pendingAuditLogs: 0,
  syncErrors: [],
  autoSyncEnabled: true,
  syncInterval: 5 * 60 * 1000, // 5 minutes

  // Actions
  setSyncStatus: (status) => {
    set({
      isSyncing: status.isSyncing,
      syncProgress: status.progress || 0,
      lastSync: status.lastSync ? new Date(status.lastSync) : null,
      pendingAuditLogs: status.pendingLogs || 0
    });
  },
  
  startSync: () => set({ isSyncing: true, syncProgress: 0 }),
  
  updateSyncProgress: (progress) => set({ syncProgress: progress }),
  
  completedSync: (result) => {
    set({
      isSyncing: false,
      syncProgress: 100,
      lastSync: new Date(),
      pendingAuditLogs: 0,
      syncErrors: result.errors || []
    });
    
    if (result.errors?.length > 0) {
      notificationService.syncError(`${result.errors.length} errors occurred`);
    } else {
      notificationService.syncSuccess(result.syncedCount || 0);
    }
  },
  
  addSyncError: (error) => {
    set((state) => ({
      syncErrors: [...state.syncErrors, {
        id: Date.now().toString(),
        error,
        timestamp: new Date()
      }]
    }));
  },
  
  clearSyncErrors: () => set({ syncErrors: [] }),
  
  setAutoSync: (enabled) => set({ autoSyncEnabled: enabled }),
  
  setSyncInterval: (interval) => set({ syncInterval: interval })
}));

// Initialize stores
export const initializeStores = () => {
  useAuthStore.getState().loadFromStorage();
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    useAppStore.getState().setOnlineStatus(true);
    notificationService.connectionRestored();
  });
  
  window.addEventListener('offline', () => {
    useAppStore.getState().setOnlineStatus(false);
    notificationService.connectionLost();
  });
  
  // Auto-refresh token periodically
  setInterval(() => {
    const authStore = useAuthStore.getState();
    if (authStore.isAuthenticated) {
      authStore.refreshSession();
    }
  }, 10 * 60 * 1000); // 10 minutes
};
