'use client';

import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import { Message } from '../types';

export interface SearchResult {
  chunk_id: string;
  document_id: string;
  text: string;
  score: number;
  metadata: any;
}

export const useSidebarChat = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMode, setSearchMode] = useState<'rag' | 'agent'>('rag');

  const {
    messages: aiMessages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    data: streamData,
  } = useChat({
    api: '/api/chat',
    body: {
      searchMode,
    },
    onError: (error) => {
      console.error('Sidebar chat error:', error);
      // Continue processing even with streaming errors
    },
  });

  // Process streaming search results from tool calls
  useEffect(() => {
    if (streamData) {
      try {
        const dataArray = Array.isArray(streamData) ? streamData : [streamData];
        dataArray.forEach((data: any) => {
          try {
            // Handle search results from metadata events
            if (data && typeof data === 'object' && 'type' in data && data.type === 'searchResults' && 'data' in data && data.data) {
              const searchData = data.data;
              if (searchData && typeof searchData === 'object') {
                const results = Object.values(searchData)
                  .filter((result: any) => result && typeof result === 'object')
                  .map((result: any) => ({
                    chunk_id: result.id || '',
                    document_id: result.documentId || '',
                    text: result.text || '',
                    score: result.score || 0,
                    metadata: result.metadata || {}
                  }));
                
                if (results.length > 0) {
                  setSearchResults(results);
                }
              }
            }
          } catch (itemError) {
            console.warn('Error processing stream data item:', itemError);
            // Continue processing other items
          }
        });
      } catch (error) {
        console.error('Error processing stream data:', error);
      }
    }
  }, [streamData]);

  // Convert AI messages to sidebar message format
  const messages: Message[] = aiMessages.map((msg, index) => {
    // Extract content safely - match main chat implementation exactly
    let content = '';
    
    try {
      if (typeof msg.content === 'string') {
        content = msg.content;
      } else if ('parts' in msg && Array.isArray(msg.parts)) {
        // Handle parts format from useChat - match ChatClientPage implementation
        content = msg.parts
          .filter((part: any) => part && typeof part === 'object' && part.type !== 'error' && typeof part.text === 'string')
          .map((part: any) => part.text)
          .join('');
      } else if (msg.content && typeof msg.content === 'object' && msg.content !== null) {
        // Handle structured content
        const contentObj = msg.content as any;
        if ('text' in contentObj && typeof contentObj.text === 'string') {
          content = contentObj.text;
        } else if (Array.isArray(contentObj)) {
          content = contentObj
            .filter((part: any) => part && typeof part === 'object' && part.type === 'text' && typeof part.text === 'string')
            .map((part: any) => part.text)
            .join('');
        }
      }
    } catch (error) {
      console.warn('Error extracting message content:', error);
      content = '[メッセージの処理中にエラーが発生しました]';
    }
    
    return {
      id: index + 1,
      type: msg.role === 'user' ? 'user' : 'bot',
      content: content || '',
    };
  });

  // Clear search results when starting a new conversation
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setSearchResults([]);
    originalHandleSubmit(e);
  };

  const sendMessage = (messageContent: string) => {
    // Create a form submission event
    const event = new Event('submit', { bubbles: true, cancelable: true });
    const form = document.createElement('form');
    
    // Set the input value
    handleInputChange({ target: { value: messageContent } } as any);
    
    // Submit after the input value is set
    setTimeout(() => {
      Object.defineProperty(event, 'target', { value: form });
      Object.defineProperty(event, 'currentTarget', { value: form });
      handleSubmit(event as any);
    }, 10);
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    sendMessage,
    isLoading,
    searchResults,
    searchMode,
    setSearchMode,
  };
};