'use client';

import React from 'react';
import { Search, Bot } from 'lucide-react';

interface SearchModeToggleProps {
  searchMode: 'rag' | 'agent';
  onModeChange: (mode: 'rag' | 'agent') => void;
}

const SearchModeToggle: React.FC<SearchModeToggleProps> = ({ searchMode, onModeChange }) => {
  return (
    <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center space-x-2">
        <span className="text-xs font-medium text-gray-600">検索モード:</span>
        <div className="flex space-x-1">
          <button
            type="button"
            onClick={() => onModeChange('rag')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              searchMode === 'rag'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Search className="inline h-3 w-3 mr-1" />
            RAG
          </button>
          <button
            type="button"
            onClick={() => onModeChange('agent')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              searchMode === 'agent'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Bot className="inline h-3 w-3 mr-1" />
            エージェント
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchModeToggle;