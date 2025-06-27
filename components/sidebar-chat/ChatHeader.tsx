'use client';

import React from 'react';
import { Bot, Minimize2, X } from 'lucide-react';

interface ChatHeaderProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ isMinimized, onToggleMinimize, onClose }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Max AI</h3>
          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded font-bold">
            BETA
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMinimize}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <Minimize2 size={16} className="text-gray-600" />
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <X size={16} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;