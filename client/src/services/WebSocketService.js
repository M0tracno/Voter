import { io } from 'socket.io-client';
import { AuthService } from './AuthService';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.boothId = null;
  }

  // Initialize WebSocket connection
  connect() {
    try {
      const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001';
      const token = AuthService.getToken();
      const boothId = AuthService.getBoothId();

      if (!token || !boothId) {
        // Console statement removed
        return;
      }

      this.boothId = boothId;

      this.socket = io(wsUrl, {
        auth: {
          token,
          boothId,
          type: 'booth'
        },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000
      });

      this.setupEventHandlers();
      
    } catch (error) {
      // Console statement removed
    }
  }

  // Setup WebSocket event handlers
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      // Console statement removed
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join booth room
      if (this.boothId) {
        this.socket.emit('join-booth', { boothId: this.boothId });
      }

      this.emit('connection', { status: 'connected' });
    });

    this.socket.on('disconnect', (reason) => {
      // Console statement removed
      this.isConnected = false;
      this.emit('connection', { status: 'disconnected', reason });
    });

    this.socket.on('connect_error', (error) => {
      // Console statement removed
      this.reconnectAttempts++;
      this.emit('connection', { 
        status: 'error', 
        error: error.message,
        attempts: this.reconnectAttempts 
      });
    });

    this.socket.on('auth_error', (error) => {
      // Console statement removed
      this.disconnect();
      AuthService.logout();
      this.emit('auth_error', error);
    });

    // Real-time events
    this.socket.on('voter_update', (data) => {
      this.emit('voter_update', data);
    });

    this.socket.on('verification_update', (data) => {
      this.emit('verification_update', data);
    });

    this.socket.on('system_alert', (data) => {
      this.emit('system_alert', data);
    });

    this.socket.on('booth_status_update', (data) => {
      this.emit('booth_status_update', data);
    });

    this.socket.on('sync_request', (data) => {
      this.emit('sync_request', data);
    });
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.boothId = null;
    }
  }

  // Emit event to server
  emitToServer(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      // Console statement removed
    }
  }

  // Listen for events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // Emit event to local listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          // Console statement removed
        }
      });
    }
  }

  // Send verification update
  sendVerificationUpdate(data) {
    this.emitToServer('verification_complete', {
      ...data,
      boothId: this.boothId,
      timestamp: new Date().toISOString()
    });
  }

  // Send booth status update
  sendBoothStatusUpdate(status) {
    this.emitToServer('booth_status_change', {
      boothId: this.boothId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  // Send sync status
  sendSyncStatus(data) {
    this.emitToServer('sync_status', {
      ...data,
      boothId: this.boothId,
      timestamp: new Date().toISOString()
    });
  }

  // Request immediate sync
  requestSync() {
    this.emitToServer('request_sync', {
      boothId: this.boothId,
      timestamp: new Date().toISOString()
    });
  }

  // Send heartbeat
  sendHeartbeat() {
    this.emitToServer('heartbeat', {
      boothId: this.boothId,
      timestamp: new Date().toISOString()
    });
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socket: !!this.socket,
      boothId: this.boothId,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Auto-reconnect with exponential backoff
  autoReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      
      setTimeout(() => {
        // Console statement removed`);
        this.connect();
      }, delay);
    } else {
      // Console statement removed
      this.emit('connection', { status: 'failed', maxAttemptsReached: true });
    }
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

// Auto-connect when auth is available
if (AuthService.isAuthenticated()) {
  webSocketService.connect();
}

export default webSocketService;
export { WebSocketService };
