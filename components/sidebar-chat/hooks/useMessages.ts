'use client';

import { useState, useEffect } from 'react';
import { Message } from '../types';

const STORAGE_KEY = 'sidebar-chat-messages';

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (error) {
        console.error('Failed to parse saved messages:', error);
        setMessages([
          {
            id: 1,
            type: 'bot',
            content: "What do you want to know today?",
            subtitle: "I'm Max, here to help you build a successful product."
          }
        ]);
      }
    } else {
      setMessages([
        {
          id: 1,
          type: 'bot',
          content: "What do you want to know today?",
          subtitle: "I'm Max, here to help you build a successful product."
        }
      ]);
    }
    setIsLoaded(true);
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, isLoaded]);

  const addMessage = (message: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...message, id: prev.length + 1 }]);
  };

  const clearMessages = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: "What do you want to know today?",
        subtitle: "I'm Max, here to help you build a successful product."
      }
    ]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { messages, addMessage, clearMessages };
};