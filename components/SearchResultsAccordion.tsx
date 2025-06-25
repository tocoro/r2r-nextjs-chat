'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Star } from 'lucide-react';

interface SearchResult {
  id: string;
  documentId: string;
  ownerId: string;
  collectionIds: string[];
  score: number;
  text: string;
  metadata?: any;
}

interface SearchResultsAccordionProps {
  searchResults: { [key: string]: SearchResult };
  isOpen?: boolean;
}

export default function SearchResultsAccordion({ searchResults, isOpen = false }: SearchResultsAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const results = Object.entries(searchResults);

  if (results.length === 0) return null;

  return (
    <div className="mb-4 border rounded-lg bg-gray-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-800">
            View Sources ({results.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {results.map(([shortId, result], index) => (
            <div
              key={result.id}
              className="bg-white rounded-lg p-3 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    [{shortId}]
                  </span>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 text-yellow-400 mr-1" />
                    <span className="text-xs text-gray-600">
                      {(result.score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-700 line-clamp-3 mb-2">
                {result.text}
              </p>

              {result.metadata && (
                <div className="text-xs text-gray-500">
                  {result.metadata.documentType && (
                    <span className="mr-3">Type: {result.metadata.documentType}</span>
                  )}
                  {result.metadata.pageNumber && (
                    <span>Page: {result.metadata.pageNumber}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}