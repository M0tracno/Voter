import ApiService from './ApiService';

export class SyncService {
  static async syncAuditLogs(logs, boothId) {
    if (!logs || logs.length === 0) {
      return { success: true, message: 'No logs to sync' };
    }

    try {
      // Prepare logs for sync (remove local database IDs)
      const syncLogs = logs.map(log => ({
        voter_id: log.voter_id,
        verification_method: log.verification_method,
        verification_result: log.verification_result,
        failure_reason: log.failure_reason,
        timestamp: log.timestamp,
        operator_id: log.operator_id,
        hmac_signature: log.hmac_signature,
        ip_address: log.ip_address,
        user_agent: log.user_agent
      }));

      // Use batch sync for large datasets
      if (syncLogs.length > 100) {
        return await ApiService.batchSyncAuditLogs(syncLogs, boothId);
      } else {
        return await ApiService.syncAuditLogs(syncLogs, boothId);
      }
    } catch (error) {
      // Console statement removed
      throw error;
    }
  }

  static async getVoterUpdates(boothId, since = null) {
    try {
      return await ApiService.getVoterUpdates(boothId, since);
    } catch (error) {
      // Console statement removed
      throw error;
    }
  }

  static async getSyncStatus(boothId) {
    try {
      return await ApiService.getSyncStatus(boothId);
    } catch (error) {
      // Console statement removed
      throw error;
    }
  }

  static async performFullSync(boothId, pendingLogs = [], lastSyncTime = null) {
    const results = {
      auditLogsSynced: 0,
      votersUpdated: 0,
      errors: []
    };

    try {
      // Step 1: Sync pending audit logs
      if (pendingLogs.length > 0) {
        const auditResult = await this.syncAuditLogs(pendingLogs, boothId);
        results.auditLogsSynced = auditResult.sync_results?.successful || 0;
        
        if (auditResult.sync_results?.errors?.length > 0) {
          results.errors.push(...auditResult.sync_results.errors);
        }
      }

      // Step 2: Get voter updates
      const voterUpdates = await this.getVoterUpdates(boothId, lastSyncTime);
      if (voterUpdates.voters && voterUpdates.voters.length > 0) {
        results.votersUpdated = voterUpdates.voters.length;
      }

      return {
        success: true,
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      results.errors.push(error.message);
      return {
        success: false,
        results,
        error: error.message
      };
    }
  }

  // Check if server is available for sync
  static async canSync() {
    try {
      return await ApiService.isServerReachable();
    } catch (error) {
      return false;
    }
  }

  // Get sync health status
  static async getSyncHealth(boothId, pendingLogsCount = 0) {
    try {
      const canConnect = await this.canSync();
      
      if (!canConnect) {
        return {
          status: 'offline',
          message: 'Server not reachable',
          pending_logs: pendingLogsCount,
          last_sync: null
        };
      }

      const syncStatus = await this.getSyncStatus(boothId);
      
      return {
        status: pendingLogsCount === 0 ? 'healthy' : 'pending',
        message: pendingLogsCount === 0 ? 'All data synced' : `${pendingLogsCount} logs pending`,
        pending_logs: pendingLogsCount,
        last_sync: syncStatus.booth?.last_sync,
        server_status: syncStatus
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        pending_logs: pendingLogsCount,
        last_sync: null
      };
    }
  }
}

export default SyncService;
