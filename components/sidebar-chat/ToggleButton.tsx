'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface ToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ isOpen, onClick }) => {
  return (
    <div className="fixed top-1/2 right-0 transform -translate-y-1/2 z-50">
      <button
        onClick={onClick}
        className={`bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-l-lg shadow-lg transition-all duration-300 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{
          writingMode: 'vertical-lr',
          textOrientation: 'mixed'
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <MessageCircle size={20} />
          <span className="text-sm font-medium tracking-wider">Max AI</span>
          <span className="bg-orange-400 text-black text-xs px-1 py-0.5 rounded text-center font-bold">
            BETA
          </span>
        </div>
      </button>
    </div>
  );
};

export default ToggleButton;