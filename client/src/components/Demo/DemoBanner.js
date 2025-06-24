import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isDemoMode } from '../../config/demoConfig';
import demoSoundService from '../../services/DemoSoundService';

const DemoBanner = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!isDemoMode()) {
    return null;
  }

  const toggleSound = () => {
    demoSoundService.toggle();
    setSoundEnabled(!soundEnabled);
  };

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center justify-center space-x-2 flex-1">
          <span className="animate-pulse">🧪</span>
          <span>
            <strong>DEMO MODE</strong> - This is a live demonstration of the FastVerify app with real-time simulations.
            All data is simulated and no real verifications are performed.
          </span>
          <span className="animate-pulse">🧪</span>
        </div>
        
        <button
          onClick={toggleSound}
          className="ml-4 p-1 rounded hover:bg-white/20 transition-colors"
          title={`${soundEnabled ? 'Disable' : 'Enable'} demo sounds`}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;
