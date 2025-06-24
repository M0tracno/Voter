import Dexie from 'dexie';

class OfflineDatabase extends Dexie {
  constructor() {
    super('FastVerifyOfflineDB');
    
    this.version(1).stores({
      voters: '++id, voterId, fullName, mobileNumber, district, pollingBooth, isActive, lastSynced',
      verificationSessions: '++id, sessionId, voterId, status, method, timestamp, isSynced',
      auditLogs: '++id, sessionId, action, timestamp, data, isSynced',
      pendingUploads: '++id, type, data, timestamp, retryCount',
      systemConfig: '++id, key, value, lastUpdated',
      syncQueue: '++id, endpoint, method, data, timestamp, status'
    });

    this.voters = this.table('voters');
    this.verificationSessions = this.table('verificationSessions');
    this.auditLogs = this.table('auditLogs');
    this.pendingUploads = this.table('pendingUploads');
    this.systemConfig = this.table('systemConfig');
    this.syncQueue = this.table('syncQueue');
  }

  // Voter Management
  async addVoter(voterData) {
    try {
      const id = await this.voters.add({
        ...voterData,
        lastSynced: new Date(),
        isActive: true
      });
      return id;
    } catch (error) {
      // Console statement removed
      throw error;
    }
  }

  async getVoter(voterId) {
    try {
      const voter = await this.voters.where('voterId').equals(voterId).first();
      return voter;
    } catch (error) {
      // Console statement removed
      return null;
    }
  }

  async searchVoters(searchTerm, searchType = 'all') {
    try {
      let collection = this.voters.where('isActive').equals(true);

      switch (searchType) {
        case 'id':
          collection = this.voters.where('voterId').startsWithIgnoreCase(searchTerm);
          break;
        case 'name':
          collection = this.voters.where('fullName').startsWithIgnoreCase(searchTerm);
          break;
        case 'mobile':
          collection = this.voters.where('mobileNumber').startsWithIgnoreCase(searchTerm);
          break;
        default:
          // Search all fields
          const results = await Promise.all([
            this.voters.where('voterId').startsWithIgnoreCase(searchTerm).toArray(),
            this.voters.where('fullName').startsWithIgnoreCase(searchTerm).toArray(),
            this.voters.where('mobileNumber').startsWithIgnoreCase(searchTerm).toArray()
          ]);
          
          // Combine and deduplicate
          const combined = [...results[0], ...results[1], ...results[2]];
          const unique = combined.filter((voter, index, self) => 
            index === self.findIndex(v => v.voterId === voter.voterId)
          );
          
          return unique.slice(0, 50); // Limit results
      }

      return await collection.limit(50).toArray();
    } catch (error) {
      // Console statement removed
      return [];
    }
  }

  // Verification Session Management
  async createVerificationSession(sessionData) {
    try {
      const session = {
        ...sessionData,
        timestamp: new Date(),
        isSynced: false,
        status: 'pending'
      };
      
      const id = await this.verificationSessions.add(session);
      
      // Add to sync queue
      await this.addToSyncQueue('POST', '/api/verification/sessions', session);
      
      return id;
    } catch (error) {
      // Console statement removed
      throw error;
    }
  }

  async updateVerificationSession(sessionId, updates) {
    try {
      await this.verificationSessions.where('sessionId').equals(sessionId).modify(updates);
      
      // Add update to sync queue
      await this.addToSyncQueue('PUT', `/api/verification/sessions/${sessionId}`, updates);
      
      return true;
    } catch (error) {
      // Console statement removed
      throw error;
    }
  }

  async getVerificationSession(sessionId) {
    try {
      return await this.verificationSessions.where('sessionId').equals(sessionId).first();
    } catch (error) {
      // Console statement removed
      return null;
    }
  }

  // Audit Log Management
  async addAuditLog(logData) {
    try {
      const log = {
        ...logData,
        timestamp: new Date(),
        isSynced: false
      };
      
      const id = await this.auditLogs.add(log);
      
      // Add to sync queue
      await this.addToSyncQueue('POST', '/api/audit/logs', log);
      
      return id;
    } catch (error) {
      // Console statement removed
      throw error;
    }
  }

  async getAuditLogs(filters = {}) {
    try {
      let collection = this.auditLogs.orderBy('timestamp').reverse();
      
      if (filters.voterId) {
        collection = collection.filter(log => log.data?.voterId === filters.voterId);
      }
      
      if (filters.startDate) {
        collection = collection.filter(log => log.timestamp >= filters.startDate);
      }
      
      if (filters.endDate) {
        collection = collection.filter(log => log.timestamp <= filters.endDate);
      }
      
      return await collection.limit(100).toArray();
    } catch (error) {
      // Console statement removed
      return [];
    }
  }

  // Sync Queue Management
  async addToSyncQueue(method, endpoint, data) {
    try {
      await this.syncQueue.add({
        method,
        endpoint,
        data,
        timestamp: new Date(),
        status: 'pending',
        retryCount: 0
      });
    } catch (error) {
      // Console statement removed
    }
  }

  async getPendingSyncItems() {
    try {
      return await this.syncQueue.where('status').equals('pending').toArray();
    } catch (error) {
      // Console statement removed
      return [];
    }
  }

  async markSyncItemCompleted(id) {
    try {
      await this.syncQueue.update(id, { status: 'completed', syncedAt: new Date() });
    } catch (error) {
      // Console statement removed
    }
  }

  async markSyncItemFailed(id, error) {
    try {
      await this.syncQueue.where('id').equals(id).modify(item => {
        item.status = 'failed';
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = error;
        item.lastAttempt = new Date();
      });
    } catch (dbError) {
      // Console statement removed
    }
  }

  // System Configuration
  async setConfig(key, value) {
    try {
      await this.systemConfig.put({
        key,
        value,
        lastUpdated: new Date()
      });
    } catch (error) {
      // Console statement removed
    }
  }

  async getConfig(key, defaultValue = null) {
    try {
      const config = await this.systemConfig.where('key').equals(key).first();
      return config ? config.value : defaultValue;
    } catch (error) {
      // Console statement removed
      return defaultValue;
    }
  }

  // Data Management
  async clearAllData() {
    try {
      await Promise.all([
        this.voters.clear(),
        this.verificationSessions.clear(),
        this.auditLogs.clear(),
        this.pendingUploads.clear(),
        this.syncQueue.clear()
      ]);
      // Console statement removed
    } catch (error) {
      // Console statement removed
      throw error;
    }
  }

  async getStorageStats() {
    try {
      const stats = {
        voters: await this.voters.count(),
        verificationSessions: await this.verificationSessions.count(),
        auditLogs: await this.auditLogs.count(),
        pendingSyncItems: await this.syncQueue.where('status').equals('pending').count(),
        failedSyncItems: await this.syncQueue.where('status').equals('failed').count()
      };
      
      return stats;
    } catch (error) {
      // Console statement removed
      return {};
    }
  }

  // Bulk Operations
  async bulkAddVoters(voters) {
    try {
      const votersWithMetadata = voters.map(voter => ({
        ...voter,
        lastSynced: new Date(),
        isActive: true
      }));
      
      await this.voters.bulkAdd(votersWithMetadata);
      // Console statement removed
    } catch (error) {
      // Console statement removed
      throw error;
    }
  }

  async bulkUpdateVoters(updates) {
    try {
      for (const update of updates) {
        await this.voters.where('voterId').equals(update.voterId).modify(update.data);
      }
      // Console statement removed
    } catch (error) {
      // Console statement removed
      throw error;
    }
  }

  // Sync Status
  async getSyncStatus() {
    try {
      const [
        pendingVerifications,
        pendingAudits,
        pendingSyncItems,
        failedSyncItems,
        lastSyncTime
      ] = await Promise.all([
        this.verificationSessions.where('isSynced').equals(false).count(),
        this.auditLogs.where('isSynced').equals(false).count(),
        this.syncQueue.where('status').equals('pending').count(),
        this.syncQueue.where('status').equals('failed').count(),
        this.getConfig('lastSyncTime')
      ]);

      return {
        pendingVerifications,
        pendingAudits,
        pendingSyncItems,
        failedSyncItems,
        lastSyncTime: lastSyncTime ? new Date(lastSyncTime) : null,
        needsSync: pendingVerifications > 0 || pendingAudits > 0 || pendingSyncItems > 0
      };
    } catch (error) {
      // Console statement removed
      return { needsSync: false };
    }
  }
}

// Create singleton instance
const offlineDB = new OfflineDatabase();

export default offlineDB;
