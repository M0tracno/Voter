import Dexie from 'dexie';
import CryptoJS from 'crypto-js';

// Local database for offline storage
class FastVerifyDB extends Dexie {
  constructor() {
    super('FastVerifyDB_v2');
    
    this.version(1).stores({
      voters: 'voter_id, full_name, registered_mobile, district, polling_booth, is_active',
      auditLogs: '++id, voter_id, booth_id, verification_method, verification_result, timestamp, is_synced',
      otpVerifications: 'verification_id, voter_id, status, expires_at, created_at',
      config: 'key, value',
      syncStatus: 'key, value, updated_at'
    });
  }
}

// Initialize database instance
const db = new FastVerifyDB();

// Database service class
export class DatabaseService {  static async initialize() {
    // Console statement removed
    
    await db.open();
    // Console statement removed
      // Set default configuration if not exists
    const hasConfig = await db.config.where('key').equals('initialized').first();
    if (!hasConfig) {
      await db.config.add({
        key: 'initialized',
        value: JSON.stringify({
          version: '2.0.0',
          created_at: new Date().toISOString()
        })
      });
      // Console statement removed
    }
    
    return true;
  }
  static async clearDatabase() {
    try {
      // Close any existing connection
      if (db.isOpen()) {
        db.close();
      }
      
      // Delete the database completely
      await db.delete();
      // Console statement removed
      
      return true;
    } catch (error) {
      // Console statement removed
      // Console statement removed
      // Continue anyway, as this might fail if database doesn't exist
      return false;
    }
  }

  // Configuration management
  static async setBoothConfig(config) {
    await db.config.put({
        key: 'booth_config',
        value: JSON.stringify(config)
      });
    
  }

  static async getBoothConfig() {
    try {
      const config = await db.config.where('key').equals('booth_config').first();
      return config ? JSON.parse(config.value) : null;
    } catch (error) {
      // Console statement removed
      return null;
    }
  }

  static async setLastSyncTime(timestamp) {
    try {
      await db.syncStatus.put({
        key: 'last_sync',
        value: timestamp,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      // Console statement removed
    }
  }

  static async getLastSyncTime() {
    try {
      const sync = await db.syncStatus.where('key').equals('last_sync').first();
      return sync ? sync.value : null;
    } catch (error) {
      // Console statement removed
      return null;
    }
  }

  // Voter management
  static async addVoters(voters) {
    await db.voters.bulkPut(voters);
      return voters.length;
    
  }

  static async updateVoters(voters) {
    try {
      // Update existing voters or add new ones
      for (const voter of voters) {
        await db.voters.put({
          ...voter,
          updated_at: new Date().toISOString()
        });
      }
      return voters.length;
    } catch (error) {
      // Console statement removed
      throw error;
    }
  }

  static async getVoter(voterId) {
    try {
      return await db.voters.where('voter_id').equals(voterId).first();
    } catch (error) {
      // Console statement removed
      return null;
    }
  }

  static async searchVoters(query, type = 'id', limit = 20) {
    try {
      let collection;
      
      switch (type) {
        case 'id':
          collection = db.voters.where('voter_id').startsWithIgnoreCase(query);
          break;
        case 'name':
          collection = db.voters.where('full_name').startsWithIgnoreCase(query);
          break;
        case 'mobile':
          collection = db.voters.where('registered_mobile').startsWithIgnoreCase(query);
          break;
        default:
          // Fallback to ID search
          collection = db.voters.where('voter_id').startsWithIgnoreCase(query);
      }
      
      return await collection
        .filter(voter => voter.is_active)
        .limit(limit)
        .toArray();
    } catch (error) {
      // Console statement removed
      return [];
    }
  }
  static async getVoterCount() {
    try {
      // Check if database is ready
      if (!db.isOpen()) {
        await db.open();
      }
      return await db.voters.where('is_active').equals(1).count();
    } catch (error) {
      // Console statement removed
      return 0;
    }
  }

  // Audit log management
  static async addAuditLog(logData) {
    // Generate HMAC signature
      const hmacData = `${logData.voter_id}|${logData.timestamp}|${logData.verification_method}|${logData.verification_result}|${logData.booth_id}`;
      const hmacSecret = await this.getHMACSecret();
      const hmacSignature = CryptoJS.HmacSHA256(hmacData, hmacSecret).toString();

      const auditLog = {
        ...logData,
        hmac_signature: hmacSignature,
        is_synced: 0,
        created_at: new Date().toISOString()
      };

      const id = await db.auditLogs.add(auditLog);
      return { ...auditLog, id };
    
  }

  static async getPendingAuditLogs(limit = 1000) {
    try {      return await db.auditLogs
        .where('is_synced')
        .equals(0)
        .limit(limit)
        .toArray();
    } catch (error) {
      // Console statement removed
      return [];
    }
  }
  static async markLogsAsSynced(logIds) {
    await db.auditLogs
        .where('id')
        .anyOf(logIds)
        .modify({ is_synced: 1, synced_at: new Date().toISOString() });
    
  }
  static async getPendingLogsCount() {
    try {
      // Check if database is ready
      if (!db.isOpen()) {
        await db.open();
      }
      return await db.auditLogs.where('is_synced').equals(0).count();
    } catch (error) {
      // Console statement removed
      return 0;
    }
  }

  static async getAuditLogs(filters = {}, limit = 100) {
    try {
      let collection = db.auditLogs.orderBy('timestamp').reverse();

      // Apply filters
      if (filters.voterId) {
        collection = collection.filter(log => log.voter_id === filters.voterId);
      }

      if (filters.result) {
        collection = collection.filter(log => log.verification_result === filters.result);
      }

      if (filters.method) {
        collection = collection.filter(log => log.verification_method === filters.method);
      }

      if (filters.startDate) {
        collection = collection.filter(log => log.timestamp >= filters.startDate);
      }

      if (filters.endDate) {
        collection = collection.filter(log => log.timestamp <= filters.endDate);
      }

      return await collection.limit(limit).toArray();
    } catch (error) {
      // Console statement removed
      return [];
    }
  }

  static async getTodayStats() {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const todayStart = `${today}T00:00:00.000Z`;
      const todayEnd = `${today}T23:59:59.999Z`;

      const todayLogs = await db.auditLogs
        .where('timestamp')
        .between(todayStart, todayEnd, true, true)
        .toArray();

      const successful = todayLogs.filter(log => log.verification_result === 'SUCCESS').length;
      const failed = todayLogs.filter(log => log.verification_result === 'FAILED').length;

      return {
        todayVerifications: todayLogs.length,
        successfulVerifications: successful,
        failedVerifications: failed,
        successRate: todayLogs.length > 0 ? (successful / todayLogs.length * 100).toFixed(1) : 0
      };
    } catch (error) {
      // Console statement removed
      return {
        todayVerifications: 0,
        successfulVerifications: 0,
        failedVerifications: 0,
        successRate: 0
      };
    }
  }

  // OTP verification management
  static async addOTPVerification(verificationData) {
    return await db.otpVerifications.add({
        ...verificationData,
        created_at: new Date().toISOString()
      });
    
  }

  static async getOTPVerification(verificationId) {
    try {
      return await db.otpVerifications
        .where('verification_id')
        .equals(verificationId)
        .first();
    } catch (error) {
      // Console statement removed
      return null;
    }
  }

  static async updateOTPVerification(verificationId, updates) {
    await db.otpVerifications
        .where('verification_id')
        .equals(verificationId)
        .modify(updates);
    
  }

  // Security helpers
  static async getHMACSecret() {
    try {
      let secret = await db.config.where('key').equals('hmac_secret').first();
      
      if (!secret) {
        // Generate new secret
        const newSecret = CryptoJS.lib.WordArray.random(256/8).toString();
        await db.config.add({
          key: 'hmac_secret',
          value: newSecret
        });
        return newSecret;
      }
      
      return secret.value;
    } catch (error) {
      // Console statement removed
      // Fallback to default (not secure for production)
      return 'default-secret-change-in-production';
    }
  }

  // Export/Import functionality
  static async exportAuditLogs(filters = {}) {
    const logs = await this.getAuditLogs(filters, 10000); // Export up to 10k logs
      
      // Convert to CSV format
      const headers = [
        'ID', 'Voter ID', 'Booth ID', 'Method', 'Result', 
        'Failure Reason', 'Timestamp', 'Is Synced'
      ];
      
      const csvData = logs.map(log => [
        log.id,
        log.voter_id,
        log.booth_id,
        log.verification_method,
        log.verification_result,
        log.failure_reason || '',
        log.timestamp,
        log.is_synced ? 'Yes' : 'No'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          row.map(field => 
            typeof field === 'string' && field.includes(',') 
              ? `"${field.replace(/"/g, '""')}"` 
              : field
          ).join(',')
        )
      ].join('\n');

      return csvContent;
    
  }

  // Cleanup old data
  static async cleanupOldData(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffISO = cutoffDate.toISOString();

      // Clean up old OTP verifications
      await db.otpVerifications
        .where('created_at')
        .below(cutoffISO)
        .delete();

      // Clean up synced audit logs older than retention period
      const deletedLogs = await db.auditLogs
        .where('timestamp')
        .below(cutoffISO)
        .and(log => log.is_synced === 1)
        .delete();

      // Console statement removed
      return deletedLogs;
    } catch (error) {
      // Console statement removed
      return 0;
    }
  }
  // Database info
  static async getDatabaseInfo() {
    try {
      // Check if database is ready
      if (!db.isOpen()) {
        await db.open();
      }
      
      const [voterCount, auditCount, pendingCount] = await Promise.all([
        db.voters.count(),
        db.auditLogs.count(),
        db.auditLogs.where('is_synced').equals(0).count()
      ]);

      return {
        voterCount,
        auditCount,
        pendingCount,
        version: '1.0.0'
      };
    } catch (error) {
      // Console statement removed
      return null;
    }
  }

  // Settings management
  static async saveSettings(settings) {
    const settingsData = {
        key: 'app_settings',
        value: JSON.stringify(settings)
      };
      
      await db.config.put(settingsData);
      return true;
    
  }

  static async getSettings() {
    try {
      const config = await db.config.where('key').equals('app_settings').first();
      return config ? JSON.parse(config.value) : null;
    } catch (error) {
      // Console statement removed
      return null;
    }
  }

  // Cache management
  static async clearCache() {
    // Clear voters cache but keep audit logs
      await db.voters.clear();
      await db.otpVerifications.clear();
      
      // Reset sync status except for audit logs
      await db.syncStatus.where('key').equals('voters_last_sync').delete();
      await db.syncStatus.where('key').equals('otp_last_sync').delete();
      
      return true;
    
  }

  // Clear old audit logs
  static async clearOldAuditLogs(cutoffDate) {
    const count = await db.auditLogs
        .where('timestamp')
        .below(cutoffDate)
        .delete();
      
      return count;
    
  }
  // Mark audit logs as synced
  static async markAuditLogsSynced(logIds) {
    await db.auditLogs
        .where('id')
        .anyOf(logIds)
        .modify({ is_synced: 1, synced_at: new Date().toISOString() });
      
      return true;
    
  }
}

export default DatabaseService;


