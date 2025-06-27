'use client';

import { useEffect } from 'react';

export const useKeyboardShortcut = (
  key: string,
  callback: () => void,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key && event.ctrlKey) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback, enabled]);
};