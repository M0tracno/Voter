import React from 'react';

const BoltBadge = () => {
  return (
    <a 
      href="https://bolt.new" 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 bg-black text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 hover:bg-gray-800 transition-colors z-50"
    >
      <span className="text-xs font-medium">Built with</span>
      <span className="font-bold text-sm">⚡ Bolt.new</span>
    </a>
  );
};

export default BoltBadge;