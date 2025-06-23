import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../services/ApiService';
import { useAuthStore } from '../store';
import notificationService from '../services/NotificationService';

// Query keys
export const QUERY_KEYS = {
  voters: 'voters',
  voterSearch: 'voterSearch',
  voterStats: 'voterStats',
  verification: 'verification',
  verificationStats: 'verificationStats',
  verificationSessions: 'verificationSessions',
  auditLogs: 'auditLogs',
  auditStats: 'auditStats',
  syncStatus: 'syncStatus',
  systemConfig: 'systemConfig',
  boothInfo: 'boothInfo',
  profile: 'profile'
};

// Voter hooks
export const useVoterSearch = (query, type = 'id', options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.voterSearch, query, type],
    queryFn: () => ApiService.searchVoters(query, type),
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

export const useVoter = (voterId, includeAudit = false, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.voters, voterId, includeAudit],
    queryFn: () => ApiService.getVoter(voterId, includeAudit),
    enabled: !!voterId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options
  });
};

export const useVoterStats = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.voterStats, filters],
    queryFn: () => ApiService.getVoterStats(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
    ...options
  });
};

export const useVoterEligibility = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ voterId, boothId }) => 
      ApiService.checkVoterEligibility(voterId, boothId),
    onSuccess: (data) => {
      // Update voter cache
      queryClient.setQueryData([QUERY_KEYS.voters, data.voterId], data.voter);
    },
    onError: (error) => {
      notificationService.error(`Eligibility check failed: ${error.message}`);
    }
  });
};

// Verification hooks
export const useVerificationStatus = (voterId, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.verification, 'status', voterId],
    queryFn: () => ApiService.getVerificationStatus(voterId),
    enabled: !!voterId,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options
  });
};

export const useVerificationStats = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.verificationStats, filters],
    queryFn: () => ApiService.getVerificationStats(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
    ...options
  });
};

export const useVerificationSessions = (filters = {}, page = 1, limit = 50, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.verificationSessions, filters, page, limit],
    queryFn: () => ApiService.getVerificationSessions(filters, page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options
  });
};

export const useSendOTP = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ voterId, boothId }) => 
      ApiService.sendOTP(voterId, boothId),
    onSuccess: (data, variables) => {
      notificationService.otpSent(data.phoneNumber);
      // Invalidate verification status
      queryClient.invalidateQueries([QUERY_KEYS.verification, 'status', variables.voterId]);
    },
    onError: (error) => {
      notificationService.error(`Failed to send OTP: ${error.message}`);
    }
  });
};

export const useVerifyOTP = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ voterId, otpCode, verificationId, boothId }) => 
      ApiService.verifyOTP(voterId, otpCode, verificationId, boothId),
    onSuccess: (data, variables) => {
      notificationService.verificationSuccess(data.voter?.name || 'Voter');
      // Invalidate and refetch related queries
      queryClient.invalidateQueries([QUERY_KEYS.verification]);
      queryClient.invalidateQueries([QUERY_KEYS.verificationStats]);
      queryClient.invalidateQueries([QUERY_KEYS.voters, variables.voterId]);
    },
    onError: (error) => {
      notificationService.error(`Verification failed: ${error.message}`);
    }
  });
};

export const useManualVerification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ voterId, boothId, reason }) => 
      ApiService.manualVerify(voterId, boothId, reason),
    onSuccess: (data, variables) => {
      notificationService.verificationSuccess(data.voter?.name || 'Voter');
      // Invalidate and refetch related queries
      queryClient.invalidateQueries([QUERY_KEYS.verification]);
      queryClient.invalidateQueries([QUERY_KEYS.verificationStats]);
      queryClient.invalidateQueries([QUERY_KEYS.voters, variables.voterId]);
    },
    onError: (error) => {
      notificationService.error(`Manual verification failed: ${error.message}`);
    }
  });
};

// Audit hooks
export const useAuditLogs = (filters = {}, page = 1, limit = 50, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.auditLogs, filters, page, limit],
    queryFn: () => ApiService.getAuditLogs(filters, page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options
  });
};

export const useAuditStats = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.auditStats, filters],
    queryFn: () => ApiService.getAuditStats(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
    ...options
  });
};

// Sync hooks
export const useSyncStatus = (boothId, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.syncStatus, boothId],
    queryFn: () => ApiService.getSyncStatus(boothId),
    enabled: !!boothId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    ...options
  });
};

export const useSyncAuditLogs = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ logs, boothId }) => 
      ApiService.syncAuditLogs(logs, boothId),
    onSuccess: (data) => {
      notificationService.syncSuccess(data.sync_results?.successful || 0);
      // Invalidate sync status
      queryClient.invalidateQueries([QUERY_KEYS.syncStatus]);
    },
    onError: (error) => {
      notificationService.error(`Sync failed: ${error.message}`);
    }
  });
};

export const useVoterUpdates = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ boothId, since }) => 
      ApiService.getVoterUpdates(boothId, since),
    onSuccess: (data) => {
      if (data.updates?.length > 0) {
        notificationService.voterUpdate({
          type: 'updated',
          count: data.updates.length
        });
        // Invalidate voter queries
        queryClient.invalidateQueries([QUERY_KEYS.voters]);
        queryClient.invalidateQueries([QUERY_KEYS.voterStats]);
      }
    },
    onError: (error) => {
      notificationService.error(`Failed to get voter updates: ${error.message}`);
    }
  });
};

// System hooks
export const useSystemConfig = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.systemConfig],
    queryFn: () => ApiService.getSystemConfig(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    ...options
  });
};

export const useUpdateSystemConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (config) => ApiService.updateSystemConfig(config),
    onSuccess: () => {
      notificationService.success('System configuration updated');
      queryClient.invalidateQueries([QUERY_KEYS.systemConfig]);
    },
    onError: (error) => {
      notificationService.error(`Failed to update configuration: ${error.message}`);
    }
  });
};

export const useBoothInfo = (boothId, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.boothInfo, boothId],
    queryFn: () => ApiService.getBoothInfo(boothId),
    enabled: !!boothId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
};

export const useUpdateBoothStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ boothId, status }) => 
      ApiService.updateBoothStatus(boothId, status),
    onSuccess: (data, variables) => {
      notificationService.boothStatusUpdate(variables.status);
      queryClient.invalidateQueries([QUERY_KEYS.boothInfo, variables.boothId]);
    },
    onError: (error) => {
      notificationService.error(`Failed to update booth status: ${error.message}`);
    }
  });
};

// Auth hooks
export const useProfile = (options = {}) => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: [QUERY_KEYS.profile],
    queryFn: () => ApiService.getProfile(),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();
  
  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      // Invalidate all queries on successful login
      queryClient.invalidateQueries();
    }
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    }
  });
};

// Export data hooks
export const useExportAuditLogs = () => {
  return useMutation({
    mutationFn: (filters) => ApiService.exportAuditLogs(filters),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      notificationService.success('Audit logs exported successfully');
    },
    onError: (error) => {
      notificationService.error(`Export failed: ${error.message}`);
    }
  });
};

export const useExportVoters = () => {
  return useMutation({
    mutationFn: (filters) => ApiService.exportVoters(filters),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `voters-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      notificationService.success('Voter data exported successfully');
    },
    onError: (error) => {
      notificationService.error(`Export failed: ${error.message}`);
    }
  });
};

// Custom hook for real-time updates
export const useRealTimeUpdates = () => {
  const queryClient = useQueryClient();
  
  const invalidateVoterQueries = () => {
    queryClient.invalidateQueries([QUERY_KEYS.voters]);
    queryClient.invalidateQueries([QUERY_KEYS.voterStats]);
  };
  
  const invalidateVerificationQueries = () => {
    queryClient.invalidateQueries([QUERY_KEYS.verification]);
    queryClient.invalidateQueries([QUERY_KEYS.verificationStats]);
    queryClient.invalidateQueries([QUERY_KEYS.verificationSessions]);
  };
  
  const invalidateAuditQueries = () => {
    queryClient.invalidateQueries([QUERY_KEYS.auditLogs]);
    queryClient.invalidateQueries([QUERY_KEYS.auditStats]);
  };
  
  const invalidateSyncQueries = () => {
    queryClient.invalidateQueries([QUERY_KEYS.syncStatus]);
  };
  
  return {
    invalidateVoterQueries,
    invalidateVerificationQueries,
    invalidateAuditQueries,
    invalidateSyncQueries,
    invalidateAllQueries: () => queryClient.invalidateQueries()
  };
};
