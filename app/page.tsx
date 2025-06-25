'use client';

import { useChat } from 'ai/react';
import { useState, useRef, DragEvent, useEffect } from 'react';
import { Upload, Send, FileText, X, Loader2, Bot, Search, LogOut } from 'lucide-react';
import { analytics, useAnalytics } from '@/lib/posthog-client';
import MessageWithCitations from '@/components/MessageWithCitations';
import SearchResultsAccordion from '@/components/SearchResultsAccordion';
import { signOut, useSession } from 'next-auth/react';

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

export default function Chat() {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [searchMode, setSearchMode] = useState<'rag' | 'agent'>('rag');
  const [previousSearchMode, setPreviousSearchMode] = useState<'rag' | 'agent'>('rag');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { trackEvent } = useAnalytics();
  const { data: session } = useSession();

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
  
  const chatHelpers = useChat({
    body: {
      searchMode
    },
    onResponse: async (response) => {
      console.log('Response received:', response);
      console.log('Response headers:', response.headers);
      
      // Parse the stream manually to extract search results
      try {
        const clonedResponse = response.clone();
        const reader = clonedResponse.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.trim()) {
                console.log('Processing line:', line);
                
                // Check if this is a data message (type 8)
                if (line.startsWith('8:')) {
                  try {
                    const dataContent = line.substring(2);
                    const parsed = JSON.parse(dataContent);
                    console.log('Parsed data message:', parsed);
                    
                    // Look for search results
                    if (Array.isArray(parsed)) {
                      const searchResultsItem = parsed.find((item: any) => item.type === 'searchResults');
                      if (searchResultsItem && searchResultsItem.data) {
                        console.log('Found search results:', searchResultsItem.data);
                        setPendingSearchResults(searchResultsItem.data);
                      }
                    }
                  } catch (e) {
                    console.error('Error parsing data message:', e);
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Error reading response:', e);
      }
    },
    onFinish: (message, { usage, finishReason }) => {
      console.log('Message finished:', message, 'finishReason:', finishReason);
      // Track successful chat message
      analytics.chatMessage({
        searchMode,
        messageLength: input.length,
        hasContext: uploadedFiles.length > 0
      });
    },
    onError: (error) => {
      console.error('Chat error:', error);
      // Track chat errors
      trackEvent('chat_error', {
        error_message: error.message,
        search_mode: searchMode,
        message_length: input.length
      });
    }
  });
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, data } = chatHelpers;
  
  // Log all chat helpers to see what's available
  console.log('Chat helpers:', Object.keys(chatHelpers));

  // Extract search results from data stream
  const [messageSearchResults, setMessageSearchResults] = useState<{ [messageId: string]: any }>({});
  const [pendingSearchResults, setPendingSearchResults] = useState<any>(null);
  
  // Debug log to see current state
  useEffect(() => {
    console.log('Current messageSearchResults state:', messageSearchResults);
  }, [messageSearchResults]);
  
  // When we have pending search results and a new assistant message appears, associate them
  useEffect(() => {
    if (pendingSearchResults && messages.length > 0) {
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAssistantMessage && !messageSearchResults[lastAssistantMessage.id]) {
        console.log('Associating pending search results with message:', lastAssistantMessage.id);
        setMessageSearchResults(prev => ({
          ...prev,
          [lastAssistantMessage.id]: pendingSearchResults
        }));
        setPendingSearchResults(null); // Clear pending results
      }
    }
  }, [messages, pendingSearchResults, messageSearchResults]);

  // Also check the data field from useChat in case it works
  useEffect(() => {
    console.log('useChat data:', data);
    console.log('useChat data type:', typeof data);
    console.log('useChat data keys:', data ? Object.keys(data) : 'no data');
    
    if (data) {
      // The data from useChat might not be an array - let's check its structure
      console.log('Data structure:', JSON.stringify(data, null, 2));
      
      if (Array.isArray(data)) {
        console.log('Data is array, length:', data.length);
        // Look for searchResults in the data array
        const searchResultsData = data.find((d: any) => d?.type === 'searchResults');
        console.log('Found searchResultsData:', searchResultsData);
        if (searchResultsData && typeof searchResultsData === 'object' && 'data' in searchResultsData && messages.length > 0) {
          // Associate search results with the latest assistant message
          const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
          console.log('Last assistant message:', lastAssistantMessage);
          if (lastAssistantMessage) {
            console.log('Setting search results for message:', lastAssistantMessage.id, searchResultsData.data);
            setMessageSearchResults(prev => ({
              ...prev,
              [lastAssistantMessage.id]: searchResultsData.data
            }));
          }
        }
      } else if (typeof data === 'object') {
        // Check if data has a different structure
        console.log('Data is object, checking for searchResults property');
        // Handle other possible data structures here
      }
    }
  }, [data, messages]);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    // Track upload attempt
    trackEvent('document_upload_started', {
      file_name: file.name,
      file_size: file.size,
      file_type: file.type
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadedFiles(prev => [...prev, file.name]);
        
        // Track successful upload
        analytics.documentUpload({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          success: true
        });
      } else {
        // Track failed upload
        analytics.documentUpload({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          success: false
        });
        
        trackEvent('document_upload_error', {
          file_name: file.name,
          error_message: data.error
        });
        
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      // Track upload exception
      analytics.documentUpload({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        success: false
      });
      
      trackEvent('document_upload_exception', {
        file_name: file.name,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">R2R Chat</h1>
            <p className="text-sm text-gray-600">Chat with your documents using RAG or Agent</p>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Search Mode Toggle */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Search Mode:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSearchMode('rag')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchMode === 'rag'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Search className="h-4 w-4" />
                  <span>RAG</span>
                </button>
                <button
                  onClick={() => setSearchMode('agent')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchMode === 'agent'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Bot className="h-4 w-4" />
                  <span>Agent</span>
                </button>
              </div>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex items-center space-x-4 border-l pl-6">
              <span className="text-sm text-gray-700">
                {session?.user?.name || 'ユーザー'}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="p-4 bg-white border-b">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInput}
            accept=".pdf,.txt,.md,.docx"
            className="hidden"
          />
          
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Drag and drop files here or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={uploading}
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supported: PDF, TXT, MD, DOCX (max 10MB)
          </p>

          {uploading && (
            <div className="mt-4 flex items-center justify-center">
              <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">Uploading...</span>
            </div>
          )}
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h3>
            <div className="space-y-1">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <FileText className="h-4 w-4 mr-2" />
                  {file}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p>Upload documents and start chatting!</p>
            <p className="text-sm mt-2">
              Current mode: <span className="font-semibold text-blue-600">{searchMode.toUpperCase()}</span>
            </p>
          </div>
        )}
        
        {messages.map((message, index) => {
          // Get search results for this specific message
          const searchResults = messageSearchResults[message.id] || {};
          console.log(`Message ${message.id} searchResults:`, searchResults);

          return (
            <div key={message.id}>
              {/* Show search results accordion for assistant messages */}
              {message.role === 'assistant' && Object.keys(searchResults).length > 0 && (
                <div className="flex justify-start mb-2">
                  <div className="max-w-[70%]">
                    <SearchResultsAccordion searchResults={searchResults} />
                  </div>
                </div>
              )}
              
              {/* Show the message */}
              <div
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border text-gray-800'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <MessageWithCitations
                      content={message.content}
                      searchResults={searchResults}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-lg p-4">
              <Loader2 className="animate-spin h-5 w-5 text-gray-600" />
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question about your documents..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
