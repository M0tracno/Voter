import toast from 'react-hot-toast';

class NotificationService {
  constructor() {
    this.defaultOptions = {
      duration: 4000,
      position: 'top-right',
      style: {
        borderRadius: '8px',
        background: '#363636',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '500'
      },
      iconTheme: {
        primary: '#0ea5e9',
        secondary: '#fff'
      }
    };

    // Add new properties for enhanced notifications
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.serviceWorkerRegistration = null;
    this.init();
  }

  async init() {
    if (this.isSupported) {
      // Register service worker for push notifications
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered for notifications');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Notifications are not supported in this browser');
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Show browser notification
  async showBrowserNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      // Fallback to toast notification
      return this.info(title);
    }

    const defaultOptions = {
      icon: '/logo192.svg',
      badge: '/logo192.svg',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      renotify: false,
      timestamp: Date.now(),
      ...options
    };

    try {
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(title, defaultOptions);
      } else {
        new Notification(title, defaultOptions);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
      // Fallback to toast
      this.info(title);
    }
  }

  // Subscribe to push notifications
  async subscribeToPush() {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service Worker not registered');
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || '')
      });

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(subscription)
      });

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  // Utility function for VAPID key conversion
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Success notification
  success(message, options = {}) {
    return toast.success(message, {
      ...this.defaultOptions,
      ...options,
      style: {
        ...this.defaultOptions.style,
        background: '#10b981',
        ...options.style
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff'
      }
    });
  }

  // Error notification
  error(message, options = {}) {
    return toast.error(message, {
      ...this.defaultOptions,
      duration: 6000, // Longer duration for errors
      ...options,
      style: {
        ...this.defaultOptions.style,
        background: '#ef4444',
        ...options.style
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff'
      }
    });
  }

  // Warning notification
  warning(message, options = {}) {
    return toast(message, {
      ...this.defaultOptions,
      ...options,
      icon: '⚠️',
      style: {
        ...this.defaultOptions.style,
        background: '#f59e0b',
        ...options.style
      }
    });
  }

  // Info notification
  info(message, options = {}) {
    return toast(message, {
      ...this.defaultOptions,
      ...options,
      icon: 'ℹ️',
      style: {
        ...this.defaultOptions.style,
        background: '#0ea5e9',
        ...options.style
      }
    });
  }

  // Loading notification
  loading(message, options = {}) {
    return toast.loading(message, {
      ...this.defaultOptions,
      ...options,
      style: {
        ...this.defaultOptions.style,
        background: '#6b7280',
        ...options.style
      }
    });
  }

  // Custom notification
  custom(content, options = {}) {
    return toast.custom(content, {
      ...this.defaultOptions,
      ...options
    });
  }

  // Dismiss notification
  dismiss(toastId) {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }

  // Dismiss all notifications
  dismissAll() {
    toast.dismiss();
  }

  // Promise-based notification
  promise(promise, messages, options = {}) {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Error occurred'
      },
      {
        ...this.defaultOptions,
        ...options
      }
    );
  }

  // Enhanced verification success with both toast and browser notification
  async verificationSuccess(voterName, method = 'OTP') {
    const message = `${voterName} verified successfully using ${method}!`;
    
    // Show toast notification
    this.success(message);
    
    // Show browser notification for important events
    await this.showBrowserNotification('Verification Successful! ✅', {
      body: message,
      tag: 'verification-success',
      actions: [
        {
          action: 'view-audit',
          title: 'View Audit Log',
          icon: '/logo192.svg'
        }
      ]
    });
  }

  // Enhanced verification error with persistent notification
  async verificationError(error, voterName = null) {
    const message = voterName 
      ? `Verification failed for ${voterName}: ${error}`
      : `Verification failed: ${error}`;
    
    // Show toast error
    this.error(message);
    
    // Show browser notification for errors
    await this.showBrowserNotification('Verification Failed ❌', {
      body: message,
      tag: 'verification-failure',
      requireInteraction: true,
      actions: [
        {
          action: 'retry',
          title: 'Retry Verification',
          icon: '/logo192.svg'
        }
      ]
    });
  }

  // Enhanced OTP notification
  async otpSent(phoneNumber) {
    const maskedNumber = this.maskPhoneNumber(phoneNumber);
    const message = `OTP sent to ${maskedNumber}`;
    
    // Show toast
    this.info(message);
    
    // Show browser notification
    await this.showBrowserNotification('OTP Sent 📱', {
      body: message,
      tag: 'otp-sent',
      vibrate: [100, 50, 100]
    });
  }

  // System alert with priority levels
  async systemAlert(title, message, priority = 'normal') {
    // Show toast based on priority
    if (priority === 'high') {
      this.error(`${title}: ${message}`, { duration: 8000 });
    } else {
      this.warning(`${title}: ${message}`);
    }

    // Show browser notification
    await this.showBrowserNotification(title, {
      body: message,
      tag: 'system-alert',
      requireInteraction: priority === 'high',
      vibrate: priority === 'high' ? [300, 100, 300, 100, 300] : [200, 100, 200]
    });
  }

  // Sync status notifications
  async syncStatusUpdate(status, details = '') {
    const messages = {
      'syncing': 'Syncing data...',
      'success': 'Data sync completed successfully',
      'failure': 'Data sync failed',
      'offline': 'Working offline - data will sync when connection is restored'
    };

    const message = details || messages[status];
    
    switch (status) {
      case 'success':
        this.success(message);
        break;
      case 'failure':
        this.error(message);
        break;
      case 'offline':
        this.warning(message);
        break;
      default:
        this.info(message);
    }

    // Show browser notification for important sync events
    if (status !== 'syncing') {
      const icons = {
        'success': '✅',
        'failure': '❌',
        'offline': '📴'
      };

      await this.showBrowserNotification(`${icons[status] || '🔄'} Sync Status`, {
        body: message,
        tag: 'sync-status',
        silent: status === 'syncing'
      });
    }
  }

  // Session timeout warning
  async sessionTimeoutWarning(minutesLeft) {
    const message = `Your session will expire in ${minutesLeft} minutes`;
    
    this.warning(message, { duration: 6000 });
    
    await this.showBrowserNotification('Session Expiring ⏰', {
      body: message,
      tag: 'session-timeout',
      requireInteraction: true,
      actions: [
        {
          action: 'extend-session',
          title: 'Extend Session',
          icon: '/logo192.svg'
        }
      ]
    });
  }

  // Utility to mask phone numbers
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 10) return phoneNumber;
    return phoneNumber.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
  }

  // Check if enhanced notifications are enabled
  get isEnhancedEnabled() {
    return this.isSupported && this.permission === 'granted';
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
export { NotificationService };
