'use client';

import { useState, useMemo } from 'react';
import CitationModal from './CitationModal';
import SearchResultModal from './SearchResultModal';

interface Citation {
  id: string;
  document_id: string;
  chunk_id?: string;
  text: string;
  score: number;
  metadata?: any;
}

interface SearchResult {
  id: string;
  documentId: string;
  ownerId: string;
  collectionIds: string[];
  score: number;
  text: string;
  metadata?: any;
}

interface MessageWithCitationsProps {
  content: string;
  citations?: Citation[];
  searchResults?: { [key: string]: SearchResult };
  className?: string;
}

export default function MessageWithCitations({ content, citations = [], searchResults = {}, className = '' }: MessageWithCitationsProps) {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [selectedCitationNumber, setSelectedCitationNumber] = useState<number>(0);
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null);
  const [selectedShortId, setSelectedShortId] = useState<string>('');
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const [isSearchResultModalOpen, setIsSearchResultModalOpen] = useState(false);

  // Parse content and replace both citation markers and search result IDs with clickable elements
  const parsedContent = useMemo(() => {
    console.log('MessageWithCitations - content:', content);
    console.log('MessageWithCitations - searchResults:', searchResults);
    // Split content into parts and identify both citation markers and search result IDs
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    
    // Regular expressions to match different types of markers
    const citationRegex = /\[(\d+)\]/g;  // [1], [2], etc.
    const searchResultRegex = /[\[【]([a-f0-9]{7})[\]】]/g;  // [8ec7796] or 【8ec7796】, etc.
    
    // Combine all matches and sort by position
    const allMatches: Array<{match: RegExpExecArray, type: 'citation' | 'searchResult'}> = [];
    
    let match;
    
    // Find citation matches
    while ((match = citationRegex.exec(content)) !== null) {
      allMatches.push({ match, type: 'citation' });
    }
    
    // Find search result matches
    while ((match = searchResultRegex.exec(content)) !== null) {
      allMatches.push({ match, type: 'searchResult' });
    }
    
    // Sort matches by position
    allMatches.sort((a, b) => a.match.index - b.match.index);
    
    for (const { match, type } of allMatches) {
      // Add text before current match
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      if (type === 'citation') {
        const citationNumber = parseInt(match[1]);
        const citationIndex = citationNumber - 1;
        
        if (citations[citationIndex]) {
          // Add clickable citation
          parts.push(
            <button
              key={`citation-${match.index}`}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
              onClick={() => {
                setSelectedCitation(citations[citationIndex]);
                setSelectedCitationNumber(citationNumber);
                setIsCitationModalOpen(true);
              }}
            >
              [{citationNumber}]
            </button>
          );
        } else {
          parts.push(match[0]);
        }
      } else if (type === 'searchResult') {
        const shortId = match[1];
        const searchResult = searchResults[shortId];
        
        if (searchResult) {
          // Add clickable search result ID
          parts.push(
            <button
              key={`search-${match.index}`}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
              onClick={() => {
                setSelectedSearchResult(searchResult);
                setSelectedShortId(shortId);
                setIsSearchResultModalOpen(true);
              }}
            >
              [{shortId}]
            </button>
          );
        } else {
          parts.push(match[0]);
        }
      }
      
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [content];
  }, [content, citations, searchResults]);

  return (
    <>
      <div className={className}>
        {Array.isArray(parsedContent) ? (
          <span>{parsedContent}</span>
        ) : (
          <span>{parsedContent}</span>
        )}
      </div>

      <CitationModal
        isOpen={isCitationModalOpen}
        onClose={() => {
          setIsCitationModalOpen(false);
          setSelectedCitation(null);
        }}
        citation={selectedCitation}
        citationNumber={selectedCitationNumber}
      />
      
      <SearchResultModal
        isOpen={isSearchResultModalOpen}
        onClose={() => {
          setIsSearchResultModalOpen(false);
          setSelectedSearchResult(null);
        }}
        searchResult={selectedSearchResult}
        shortId={selectedShortId}
      />
    </>
  );
}