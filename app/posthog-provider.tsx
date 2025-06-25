'use client';

import { useEffect } from 'react';
import { initializePostHog, analytics } from '@/lib/posthog-client';

interface PosthogProviderProps {
  children: React.ReactNode;
}

export function PosthogProvider({ children }: PosthogProviderProps) {
  useEffect(() => {
    // Initialize PostHog on client-side
    initializePostHog();
    
    // Track app startup
    analytics.appStarted();
  }, []);

  return <>{children}</>;
}