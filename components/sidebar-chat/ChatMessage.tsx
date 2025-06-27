'use client';

import React from 'react';
import { User, Bot } from 'lucide-react';
import MessageWithCitations from '@/components/MessageWithCitations';
import { Message } from './types';
import { SearchResult } from './hooks/useSidebarChat';

interface ChatMessageProps {
  message: Message;
  searchResults?: SearchResult[];
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, searchResults = [] }) => {
  // Create search results mapping for citations
  const searchResultsMap = searchResults.reduce((acc: any, result: any) => {
    const shortId = result.chunk_id?.substring(0, 7) || result.id?.substring(0, 7);
    if (shortId) {
      acc[shortId] = result;
    }
    return acc;
  }, {});

  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          message.type === 'user' ? 'bg-blue-600' : 'bg-purple-600'
        }`}>
          {message.type === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>
        <div className={`rounded-lg p-3 ${
          message.type === 'user' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {message.type === 'bot' && searchResults.length > 0 ? (
            <div className="text-sm">
              <MessageWithCitations 
                content={message.content}
                searchResults={searchResultsMap}
              />
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
          {message.subtitle && (
            <p className="text-xs text-gray-600 mt-1">{message.subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;