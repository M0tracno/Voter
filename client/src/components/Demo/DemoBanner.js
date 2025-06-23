import React from 'react';
import { isDemoMode } from '../../config/demoConfig';

const DemoBanner = () => {
  if (!isDemoMode()) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
      <div className="flex items-center justify-center space-x-2">
        <span className="animate-pulse">🧪</span>
        <span>
          <strong>DEMO MODE</strong> - This is a demonstration of the FastVerify app. 
          All data is simulated and no real verifications are performed.
        </span>
        <span className="animate-pulse">🧪</span>
      </div>
    </div>
  );
};

export default DemoBanner;
