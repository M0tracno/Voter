// Demo Sound Service for Enhanced Demo Experience
class DemoSoundService {
  constructor() {
    this.audioContext = null;
    this.audioInitialized = false;
    this.enabled = true;
    this.volume = 0.3;
    this.sounds = new Map();
    this.waitingForUserInteraction = true;
    // Don't automatically initialize audio to avoid warnings
  }

  // Initialize audio only after user interaction
  initializeAudioContext() {
    if (this.audioInitialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.createSounds();
      this.audioInitialized = true;
      this.waitingForUserInteraction = false;
      // Console statement removed
    } catch (error) {
      // Console statement removed
      this.enabled = false;
    }
  }

  // Register event listeners for user interaction
  setupUserInteractionEvents() {
    if (!this.waitingForUserInteraction) return;
    
    const interactionEvents = ['click', 'touchstart', 'keydown'];
    
    const handleInteraction = () => {
      this.initializeAudioContext();
      // Remove event listeners after initialization
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
    
    interactionEvents.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true });
    });
  }

  // This replaces the previous init method
  init() {
    this.setupUserInteractionEvents();
  }

  createSounds() {
    // Success verification sound (pleasant beep)
    this.sounds.set('success', this.createTone(800, 0.2, 'sine'));
    
    // Failure verification sound (lower tone)
    this.sounds.set('failure', this.createTone(300, 0.3, 'sawtooth'));
    
    // New notification sound (gentle chime)
    this.sounds.set('notification', this.createChime());
    
    // System startup sound
    this.sounds.set('startup', this.createStartupChime());
  }

  createTone(frequency, duration, type = 'sine') {
    return () => {
      if (!this.enabled || !this.audioContext) return;
      
      try {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
      } catch (error) {
        // Console statement removed
      }
    };
  }

  createChime() {
    return () => {
      if (!this.enabled || !this.audioContext) return;
      
      const frequencies = [523, 659, 784]; // C, E, G
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);
          
          oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, this.audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
          
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.3);
        }, index * 100);
      });
    };
  }

  createStartupChime() {
    return () => {
      if (!this.enabled || !this.audioContext) return;
      
      const frequencies = [261, 329, 392, 523]; // C, E, G, C
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);
          
          oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, this.audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
          
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.4);
        }, index * 150);
      });
    };
  }

  // Play sound by type
  play(soundType) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(soundType);
    if (sound) {
      try {
        sound();
      } catch (error) {
        // Console statement removed
      }
    }
  }

  // Text-to-speech announcements
  speak(text, options = {}) {
    if (!this.enabled || !window.speechSynthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = options.volume || 0.3;
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    
    // Use a pleasant voice if available
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Alex') || 
      voice.name.includes('Samantha')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    speechSynthesis.speak(utterance);
  }

  // Announcement helpers
  announceVerification(voterName, method, success) {
    if (success) {
      this.play('success');
      this.speak(`Verification successful for ${voterName} using ${method}`, { volume: 0.2 });
    } else {
      this.play('failure');
      this.speak(`Verification failed for ${voterName}`, { volume: 0.2 });
    }
  }

  announceSystemStatus(message) {
    this.play('notification');
    this.speak(message, { volume: 0.2, rate: 1.1 });
  }

  announceStartup() {
    this.play('startup');
    setTimeout(() => {
      this.speak('FastVerify demo system is now active', { volume: 0.3, rate: 0.9 });
    }, 1000);
  }

  // Control methods
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled && window.speechSynthesis) {
      speechSynthesis.cancel();
    }
  }
}

// Create singleton instance
const demoSoundService = new DemoSoundService();

// Initialize after a small delay to ensure DOM is loaded
setTimeout(() => {
  demoSoundService.init();
}, 1000);

export default demoSoundService;
