import axios from 'axios';
import { AuthService } from './AuthService';

// API base URL - can be configured via environment variable
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for file operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and handle refresh
api.interceptors.request.use(
  async (config) => {
    const token = AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add booth ID if available
    const boothId = AuthService.getBoothId();
    if (boothId) {
      config.headers['X-Booth-ID'] = boothId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        await AuthService.refreshToken();
        const newToken = AuthService.getToken();
        
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        AuthService.logout();
        window.location.href = '/setup';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export class ApiService {
  // Health check
  static async healthCheck() {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
      return response.data;
    } catch (error) {
      throw new Error('Server is not available');
    }
  }
  // Authentication
  static async validateBooth(boothId, apiToken) {
    try {
      const response = await api.post('/auth/booth/validate', {
        boothId,
        apiToken
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async refreshToken(refreshToken) {
    try {
      const response = await api.post('/auth/refresh', {
        refreshToken
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async logout() {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Voter operations
  static async searchVoters(query, type = 'id') {
    try {
      const response = await api.get('/voters/search', {
        params: { q: query, type }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getVoter(voterId, includeAudit = false) {
    try {
      const response = await api.get(`/voters/${voterId}`, {
        params: { includeAudit }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async checkVoterEligibility(voterId, boothId) {
    try {
      const response = await api.post(`/voters/${voterId}/check-eligibility`, {
        boothId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Verification operations
  static async sendOTP(voterId, boothId) {
    try {
      const response = await api.post('/verification/send-otp', {
        voterId,
        boothId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async verifyOTP(voterId, otpCode, verificationId, boothId) {
    try {
      const response = await api.post('/verification/verify-otp', {
        voterId,
        otpCode,
        verificationId,
        boothId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async manualVerify(voterId, boothId, reason) {
    try {
      const response = await api.post('/verification/manual', {
        voterId,
        boothId,
        reason
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getVerificationSessions(filters = {}, page = 1, limit = 50) {
    try {
      const response = await api.get('/verification/sessions', {
        params: { ...filters, page, limit }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getVerificationStatus(voterId) {
    try {
      const response = await api.get(`/verification/status/${voterId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);    }
  }

  // System Configuration
  static async getSystemConfig() {
    try {
      const response = await api.get('/system/config');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async updateSystemConfig(config) {
    try {
      const response = await api.put('/system/config', config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Booth Management
  static async getBoothInfo(boothId) {
    try {
      const response = await api.get(`/booths/${boothId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async updateBoothStatus(boothId, status) {
    try {
      const response = await api.put(`/booths/${boothId}/status`, { status });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Statistics and Analytics
  static async getVoterStats(filters = {}) {
    try {
      const response = await api.get('/voters/stats', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getVerificationStats(filters = {}) {
    try {
      const response = await api.get('/verification/stats', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async exportVoters(filters = {}) {
    try {
      const response = await api.get('/voters/export', {
        params: { ...filters, format: 'csv' },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Sync operations
  static async syncAuditLogs(logs, boothId) {
    try {
      const response = await api.post('/sync/audit-logs', {
        logs,
        boothId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getVoterUpdates(boothId, since = null) {
    try {
      const params = { booth_id: boothId };
      if (since) params.since = since;
      
      const response = await api.get('/sync/voters', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getSyncStatus(boothId) {
    try {
      const response = await api.get('/sync/status', {
        params: { booth_id: boothId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Audit operations
  static async getAuditLogs(filters = {}, page = 1, limit = 50) {
    try {
      const response = await api.get('/audit/logs', {
        params: { ...filters, page, limit }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getAuditStats(filters = {}) {
    try {
      const response = await api.get('/audit/stats', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async exportAuditLogs(filters = {}) {
    try {
      const response = await api.get('/audit/export', {
        params: { ...filters, format: 'csv' },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic HTTP methods
  static async get(endpoint, params = {}) {
    try {
      const response = await api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async post(endpoint, data = {}) {
    try {
      const response = await api.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async put(endpoint, data = {}) {
    try {
      const response = await api.put(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async delete(endpoint) {
    try {
      const response = await api.delete(endpoint);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Utility methods
  static async checkVersion() {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/api/version`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  // Set base URL dynamically
  static setBaseURL(url) {
    api.defaults.baseURL = url + '/api';
  }

  // Get current base URL
  static get baseURL() {
    return api.defaults.baseURL.replace('/api', '');
  }

  static handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (data && data.error) {
        return new Error(data.error);
      }
      
      switch (status) {
        case 400:
          return new Error('Invalid request. Please check your input.');
        case 401:
          return new Error('Authentication failed. Please setup the booth again.');
        case 403:
          return new Error('Access denied. Check your permissions.');
        case 404:
          return new Error('Resource not found.');
        case 429:
          return new Error('Too many requests. Please wait and try again.');
        case 500:
          return new Error('Server error. Please contact support.');
        default:
          return new Error(`Server error (${status}). Please try again.`);
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Check your internet connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred.');
    }
  }

  // Check if server is reachable
  static async isServerReachable() {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Batch sync audit logs
  static async batchSyncAuditLogs(logs, boothId) {
    const batchSize = 50;
    const results = { successful: 0, errors: [] };
    
    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize);
      try {
        const response = await this.syncAuditLogs(batch, boothId);
        results.successful += response.sync_results?.successful || 0;
        
        if (response.sync_results?.errors?.length > 0) {
          results.errors.push(...response.sync_results.errors);
        }
      } catch (error) {
        results.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      }
    }
    
    return { sync_results: results };
  }

  // Upload file helper (for future use)
  static async uploadFile(file, endpoint) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export default ApiService;
