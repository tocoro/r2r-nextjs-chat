'use client';

import { useChat } from 'ai/react';
import { useState, useRef, DragEvent, useEffect } from 'react';
import { Upload, Send, FileText, X, Loader2, Bot, Search } from 'lucide-react';
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMode, setSearchMode] = useState<'rag' | 'agent'>('rag');
  const [previousSearchMode, setPreviousSearchMode] = useState<'rag' | 'agent'>('rag');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      fileArray.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      setUploadedFiles(prev => [...prev, ...fileArray]);
      
      // Track successful upload
      trackEvent('file_uploaded', {
        fileCount: fileArray.length,
        fileTypes: fileArray.map(f => f.type),
        fileSizes: fileArray.map(f => f.size),
        documentIds: result.results.map((r: any) => r.document_id)
      });
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      
      // Track failed upload
      trackEvent('file_upload_failed', {
        error: errorMessage,
        fileCount: fileArray.length
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    data: streamData,
  } = useChat({
    api: '/api/chat',
    experimental_toolCallStreaming: true,
    body: {
      searchMode,
    },
    onResponse: (response) => {
      // Track message sent
      trackEvent('message_sent', {
        messageLength: input.length,
        searchMode,
        hasFiles: uploadedFiles.length > 0
      });
    },
    onError: (error) => {
      // Track error
      trackEvent('chat_error', {
        error: error.message
      });
    },
    onFinish: (message) => {
      // Track message received
      trackEvent('message_received', {
        responseLength: message.content.length,
        searchMode
      });
    }
  });

  console.log('Chat helpers:', Object.keys({ messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading, data: streamData }));

  // Process streaming search results from tool calls
  useEffect(() => {
    if (streamData) {
      try {
        const dataArray = streamData as any[];
        dataArray.forEach((data) => {
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
      {/* File Upload Area */}
      <div className="p-4 bg-white border-b">
        <div 
          className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
            isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              ドラッグ＆ドロップまたは
              <label htmlFor="file-upload" className="ml-1 text-indigo-600 hover:text-indigo-500 cursor-pointer">
                ファイルを選択
              </label>
            </p>
          </div>

          {isUploading && (
            <div className="mt-4 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              <span className="ml-2 text-sm text-gray-600">アップロード中...</span>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{uploadError}</p>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">アップロード済みファイル:</h3>
              <ul className="space-y-1">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{file.name}</span>
                      <span className="ml-2 text-xs text-gray-400">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && searchResults.length === 0 && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-gray-900 mb-2">R2R RAG チャットへようこそ</h2>
              <p className="text-gray-600">
                ドキュメントをアップロードして、質問を始めましょう
              </p>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <SearchResultsAccordion results={searchResults} />
          )}

          {/* Messages */}
          {messages.map((message) => (
            <MessageWithCitations key={message.id} message={message} />
          ))}

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