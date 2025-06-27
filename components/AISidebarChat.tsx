'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus } from 'lucide-react';
import ChatMessage from './sidebar-chat/ChatMessage';
import ToggleButton from './sidebar-chat/ToggleButton';
import ChatHeader from './sidebar-chat/ChatHeader';
import SuggestionButtons from './sidebar-chat/SuggestionButtons';
import TypingIndicator from './sidebar-chat/TypingIndicator';
import SearchModeToggle from './sidebar-chat/SearchModeToggle';
import TextInputForm from './sidebar-chat/TextInputForm';
import { useKeyboardShortcut } from './sidebar-chat/hooks/useKeyboardShortcut';
import { useSidebarChat } from './sidebar-chat/hooks/useSidebarChat';
import { useResizable } from './sidebar-chat/hooks/useResizable';

const AISidebarChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    sendMessage,
    isLoading,
    searchResults,
    searchMode,
    setSearchMode,
  } = useSidebarChat();
  
  const { width, isResizing, handleMouseDown } = useResizable(384, 300, 800);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard shortcuts
  useKeyboardShortcut('/', () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  });
  
  useKeyboardShortcut('Escape', () => {
    setIsOpen(false);
  }, isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      handleSubmit(e);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        handleSubmit(new Event('submit') as any);
      }
    }
  };

  const suggestions = [
    'Product analytics',
    'SQL',
    'Session replay',
    'SDK setup',
    'Docs'
  ];

  return (
    <>
      {/* Toggle Button - Always visible */}
      <ToggleButton isOpen={isOpen} onClick={() => setIsOpen(true)} />

      {/* Sidebar Chat */}
      <div 
        className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out border-l border-gray-200 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: `${width}px` }}
      >
        {/* Resize Handle */}
        <div
          className={`absolute left-0 top-0 w-1 h-full bg-transparent hover:bg-blue-400 cursor-ew-resize z-50 ${
            isResizing ? 'bg-blue-400' : ''
          }`}
          onMouseDown={handleMouseDown}
          title="ドラッグしてサイズを変更"
        />
        {/* Header */}
        <ChatHeader 
          isMinimized={isMinimized}
          onToggleMinimize={() => setIsMinimized(!isMinimized)}
          onClose={() => setIsOpen(false)}
        />

        {/* Search Mode Toggle */}
        {!isMinimized && (
          <SearchModeToggle
            searchMode={searchMode}
            onModeChange={setSearchMode}
          />
        )}

        {/* Chat Content */}
        {!isMinimized && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((msg) => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  searchResults={searchResults}
                />
              ))}
              
              {/* Typing Indicator */}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 0 && (
              <SuggestionButtons
                suggestions={suggestions}
                onSuggestionClick={(suggestion) => {
                  sendMessage(suggestion);
                }}
              />
            )}

            {/* Text Input Form with File Upload */}
            <TextInputForm
              input={input}
              onChange={handleInputChange}
              onSubmit={handleSendMessage}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              placeholder="Ask away"
            />
          </div>
        )}
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default AISidebarChat;