'use client';

import React from 'react';

interface SuggestionButtonsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const SuggestionButtons: React.FC<SuggestionButtonsProps> = ({ suggestions, onSuggestionClick }) => {
  return (
    <div className="px-4 py-2">
      <p className="text-sm text-gray-600 mb-2">Ask Max about...</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full border transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionButtons;