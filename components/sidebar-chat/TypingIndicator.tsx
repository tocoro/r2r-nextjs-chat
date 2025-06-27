'use client';

import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="flex gap-2 max-w-[80%]">
        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
        <div className="bg-gray-100 rounded-lg p-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;