import { jwtDecode } from 'jwt-decode';

export class AuthService {
  static TOKEN_KEY = 'fastverify_token';
  static REFRESH_TOKEN_KEY = 'fastverify_refresh_token';
  static BOOTH_CONFIG_KEY = 'fastverify_booth_config';
  static USER_KEY = 'fastverify_user';
  static BOOTH_ID_KEY = 'fastverify_booth_id';

  // Store authentication tokens
  static setTokens(accessToken, refreshToken = null) {
    try {
      localStorage.setItem(this.TOKEN_KEY, accessToken);
      if (refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      }
      return true;
    } catch (error) {
      // Console statement removed
      return false;
    }
  }

  // Store authentication token
  static setToken(token) {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      return true;
    } catch (error) {
      // Console statement removed
      return false;
    }
  }

  // Get stored token
  static getToken() {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      // Console statement removed
      return null;
    }
  }

  // Get refresh token
  static getRefreshToken() {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      // Console statement removed
      return null;
    }
  }

  // Remove tokens
  static removeTokens() {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      return true;
    } catch (error) {
      // Console statement removed
      return false;
    }
  }

  // Remove token (backwards compatibility)
  static removeToken() {
    return this.removeTokens();
  }

  // Check if token is valid and not expired
  static isTokenValid(token = null) {
    try {
      const authToken = token || this.getToken();
      if (!authToken) return false;

      const decoded = jwtDecode(authToken);
      const currentTime = Date.now() / 1000;

      // Check if token expires within 5 minutes
      if (decoded.exp < currentTime + 300) {
        return false;
      }

      return true;
    } catch (error) {
      // Console statement removed
      return false;
    }
  }

  // Check if token exists but is expired
  static isTokenExpired(token = null) {
    try {
      const authToken = token || this.getToken();
      if (!authToken) return true;

      const decoded = jwtDecode(authToken);
      const currentTime = Date.now() / 1000;

      return decoded.exp < currentTime;
    } catch (error) {
      // Console statement removed
      return true;
    }
  }

  // Get decoded token data
  static getTokenData(token = null) {
    try {
      const authToken = token || this.getToken();
      if (!authToken) return null;

      return jwtDecode(authToken);
    } catch (error) {
      // Console statement removed
      return null;
    }
  }

  // Store user data
  static setUser(user) {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      return true;
    } catch (error) {
      // Console statement removed
      return false;
    }
  }

  // Get user data
  static getUser() {
    try {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      // Console statement removed
      return null;
    }
  }

  // Store booth ID
  static setBoothId(boothId) {
    try {
      localStorage.setItem(this.BOOTH_ID_KEY, boothId);
      return true;
    } catch (error) {
      // Console statement removed
      return false;
    }
  }

  // Get booth ID
  static getBoothId() {
    try {
      return localStorage.getItem(this.BOOTH_ID_KEY);
    } catch (error) {
      // Console statement removed
      return null;
    }
  }

  // Store booth configuration
  static setBoothConfig(config) {
    try {
      localStorage.setItem(this.BOOTH_CONFIG_KEY, JSON.stringify(config));
      return true;
    } catch (error) {
      // Console statement removed
      return false;
    }
  }

  // Get booth configuration
  static getBoothConfig() {
    try {
      const config = localStorage.getItem(this.BOOTH_CONFIG_KEY);
      return config ? JSON.parse(config) : null;
    } catch (error) {
      // Console statement removed
      return null;
    }
  }

  // Remove booth configuration
  static removeBoothConfig() {
    try {
      localStorage.removeItem(this.BOOTH_CONFIG_KEY);
      return true;
    } catch (error) {
      // Console statement removed
      return false;
    }
  }
  // Clear all auth data
  static clearAuth() {
    try {
      this.removeTokens();
      this.removeBoothConfig();
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.BOOTH_ID_KEY);
      return true;
    } catch (error) {
      // Console statement removed
      return false;
    }
  }

  // Refresh access token using refresh token
  static async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const { ApiService } = await import('./ApiService');
      const response = await ApiService.refreshToken(refreshToken);
      
      if (response.success && response.data.accessToken) {
        this.setTokens(response.data.accessToken, response.data.refreshToken);
        if (response.data.user) {
          this.setUser(response.data.user);
        }
        return response.data.accessToken;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      // Console statement removed
      this.logout();
      throw error;
    }
  }

  // Check if user is authenticated
  static isAuthenticated() {
    const token = this.getToken();
    const config = this.getBoothConfig();
    
    return token && config && this.isTokenValid(token);
  }

  // Get current booth ID
  static getCurrentBoothId() {
    const config = this.getBoothConfig();
    return config ? config.booth_id : null;
  }

  // Get current booth name
  static getCurrentBoothName() {
    const config = this.getBoothConfig();
    return config ? config.booth_name : null;
  }

  // Check token expiry and return time remaining
  static getTokenTimeRemaining() {
    try {
      const token = this.getToken();
      if (!token) return 0;

      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const timeRemaining = decoded.exp - currentTime;

      return Math.max(0, timeRemaining);
    } catch (error) {
      // Console statement removed
      return 0;
    }
  }

  // Format time remaining for display
  static formatTimeRemaining() {
    const seconds = this.getTokenTimeRemaining();
    
    if (seconds <= 0) return 'Expired';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m remaining`;
    } else {
      return `${Math.floor(seconds)}s remaining`;
    }
  }
  // Auto-refresh token if needed
  static async refreshTokenIfNeeded() {
    try {
      const timeRemaining = this.getTokenTimeRemaining();
      
      // Refresh if less than 5 minutes remaining
      if (timeRemaining > 0 && timeRemaining < 5 * 60) {
        // Console statement removed
        try {
          await this.refreshToken();
          return true;
        } catch (error) {
          // Console statement removed
          return false;
        }
      }
      
      return true;
    } catch (error) {
      // Console statement removed
      return false;
    }
  }

  // Validate booth configuration
  static validateBoothConfig(config) {
    if (!config) return false;
    
    const requiredFields = ['booth_id', 'booth_name', 'api_token'];
    return requiredFields.every(field => config[field]);
  }

  // Get auth header for API requests
  static getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Security helpers
  static generateDeviceId() {
    // Generate a semi-persistent device identifier
    let deviceId = localStorage.getItem('fastverify_device_id');
    
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('fastverify_device_id', deviceId);
    }
    
    return deviceId;
  }

  static getDeviceId() {
    return localStorage.getItem('fastverify_device_id') || this.generateDeviceId();
  }

  // Check if running in secure context (HTTPS)
  static isSecureContext() {
    return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  }

  // Get user info from token
  static getUserInfo() {
    const tokenData = this.getTokenData();
    const boothConfig = this.getBoothConfig();
    
    if (!tokenData || !boothConfig) return null;
    
    return {
      boothId: tokenData.boothId || boothConfig.booth_id,
      boothName: tokenData.boothName || boothConfig.booth_name,      role: tokenData.role || 'booth',
      deviceId: this.getDeviceId(),
      expiresAt: new Date(tokenData.exp * 1000).toISOString(),
      timeRemaining: this.formatTimeRemaining()
    };
  }
  // Logout user and clear all stored data
  static async logout() {
    try {
      // Call logout API if possible
      try {
        const { ApiService } = await import('./ApiService');
        await ApiService.logout();
      } catch (error) {
        // Ignore API logout errors
        // Console statement removed
      }

      // Clear local storage
      this.removeTokens();
      this.removeBoothConfig();
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.BOOTH_ID_KEY);
      
      // Clear any other auth-related data from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fastverify_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          // Console statement removed
        }
      });
      
      return true;
    } catch (error) {
      // Console statement removed
      return false;
    }
  }

  // Clear all data and redirect to setup
  static logoutAndRedirect() {
    this.logout();
    window.location.reload();
  }
}

export default AuthService;
