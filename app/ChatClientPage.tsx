'use client';

import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import { Send, Loader2, Bot, Search } from 'lucide-react';
import { analytics, useAnalytics } from '@/lib/posthog-client';
import MessageWithCitations from '@/components/MessageWithCitations';
import SearchResultsAccordion from '@/components/SearchResultsAccordion';

interface Citation {
  id: string;
  document_id: string;
  chunk_id?: string;
  text: string;
  score: number;
  metadata?: any;
}

interface SearchResult {
  chunk_id: string;
  document_id: string;
  text: string;
  score: number;
  metadata: any;
}

export default function ChatClientPage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMode, setSearchMode] = useState<'rag' | 'agent'>('rag');
  const [previousSearchMode, setPreviousSearchMode] = useState<'rag' | 'agent'>('rag');
  
  const { trackEvent } = useAnalytics();

  // Track search mode changes
  useEffect(() => {
    if (previousSearchMode !== searchMode) {
      analytics.searchModeChanged({
        fromMode: previousSearchMode,
        toMode: searchMode
      });
      setPreviousSearchMode(searchMode);
    }
  }, [searchMode, previousSearchMode]);

  const {
    messages,
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
    onResponse: (response) => {
      // Track message sent
      trackEvent('message_sent', {
        messageLength: input.length,
        searchMode
      });
    },
    onError: (error) => {
      console.error('Chat error:', error);
      // Track error
      trackEvent('chat_error', {
        error: error.message
      });
    },
    onFinish: (message, options) => {
      // Track message received
      const content = message.content || (message.parts ? message.parts.map((part: any) => part.text).join('') : '');
      trackEvent('message_received', {
        responseLength: content.length,
        searchMode
      });
    }
  });

  // Debug only when there are issues
  if (messages.length > 0 && !messages.some(m => m.content || (m.parts && m.parts.length > 0))) {
    console.log('DEBUG: Messages without content detected:', messages);
  }

  // Process streaming search results from tool calls
  useEffect(() => {
    if (streamData) {
      try {
        const dataArray = streamData as any[];
        dataArray.forEach((data) => {
          // Handle search results from metadata events
          if (data && data.type === 'searchResults' && data.data) {
            const searchData = data.data;
            const results = Object.values(searchData).map((result: any) => ({
              chunk_id: result.id,
              document_id: result.documentId,
              text: result.text,
              score: result.score,
              metadata: result.metadata
            }));
            
            if (results.length > 0) {
              console.log('Search results found:', results.length, 'items');
              setSearchResults(results);
            }
          }
          
          // Handle legacy format for tool calls
          if (data && data.tool_name === 'search' && data.args && data.args.results) {
            const results = data.args.results;
            if (Array.isArray(results) && results.length > 0) {
              // Update search results, avoiding duplicates based on chunk_id
              setSearchResults(prev => {
                const existingIds = new Set(prev.map(r => r.chunk_id));
                const newResults = results.filter(r => !existingIds.has(r.chunk_id));
                return [...prev, ...newResults];
              });
            }
          }
        });
      } catch (error) {
        console.error('Error processing stream data:', error);
      }
    }
  }, [streamData]);

  // Clear search results when starting a new conversation
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setSearchResults([]);
    originalHandleSubmit(e);
  };

  return (
    <main className="flex flex-col h-screen bg-gray-50">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && searchResults.length === 0 && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-gray-900 mb-2">R2R RAG チャットへようこそ</h2>
              <p className="text-gray-600">
                質問を入力してください
              </p>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <SearchResultsAccordion searchResults={searchResults.reduce((acc: any, result: any) => {
              acc[result.chunk_id?.substring(0, 7) || result.document_id?.substring(0, 7)] = result;
              return acc;
            }, {})} />
          )}

          {/* Messages */}
          {messages.map((message, index) => {
            // Extract content from message object
            const messageContent = message.content || (message.parts ? message.parts.map((part: any) => part.text).join('') : '');
            return (
              <div key={message.id} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-3 rounded-lg max-w-3xl ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white ml-auto' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.role === 'assistant' ? (
                    <MessageWithCitations 
                      content={messageContent}
                      searchResults={searchResults.reduce((acc: any, result: any) => {
                        acc[result.chunk_id?.substring(0, 7) || result.id?.substring(0, 7)] = result;
                        return acc;
                      }, {})}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{messageContent}</p>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">考え中...</span>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <div className="mb-2 flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">検索モード:</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setSearchMode('rag')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      searchMode === 'rag'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Search className="inline h-3 w-3 mr-1" />
                    RAG検索
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode('agent')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      searchMode === 'agent'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Bot className="inline h-3 w-3 mr-1" />
                    エージェント
                  </button>
                </div>
              </div>
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder="質問を入力してください..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={3}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="mb-0 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}