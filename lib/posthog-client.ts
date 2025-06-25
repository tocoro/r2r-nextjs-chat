import posthog from 'posthog-js';

// Posthog configuration
const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY || 'phc_demo_key';
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let isInitialized = false;

// Initialize PostHog client (following R2R-Application pattern)
export function initializePostHog() {
  if (typeof window === 'undefined' || isInitialized) {
    return;
  }

  try {
    posthog.init(posthogApiKey, {
      api_host: posthogHost,
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      loaded: (posthog) => {
        console.log('PostHog initialized successfully');
      }
    });

    // Check for telemetry opt-out (following R2R pattern)
    if (process.env.NEXT_PUBLIC_DISABLE_TELEMETRY === 'true') {
      posthog.opt_out_capturing();
      console.log('PostHog telemetry disabled');
    }

    isInitialized = true;
  } catch (error) {
    console.error('PostHog initialization failed:', error);
  }
}

// Custom hook for tracking events
export function useAnalytics() {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && posthog && isInitialized) {
      try {
        posthog.capture(eventName, {
          timestamp: new Date().toISOString(),
          ...properties
        });
      } catch (error) {
        console.error('PostHog tracking error:', error);
      }
    }
  };

  const identifyUser = (userId: string, traits?: Record<string, any>) => {
    if (typeof window !== 'undefined' && posthog && isInitialized) {
      try {
        posthog.identify(userId, traits);
      } catch (error) {
        console.error('PostHog identify error:', error);
      }
    }
  };

  const setUserProperties = (properties: Record<string, any>) => {
    if (typeof window !== 'undefined' && posthog && isInitialized) {
      try {
        posthog.people.set(properties);
      } catch (error) {
        console.error('PostHog user properties error:', error);
      }
    }
  };

  return {
    trackEvent,
    identifyUser,
    setUserProperties,
    posthog: typeof window !== 'undefined' ? posthog : null
  };
}

// Pre-defined event tracking functions for common actions
export const analytics = {
  // Chat events
  chatMessage: (properties: { 
    searchMode: 'rag' | 'agent';
    messageLength: number;
    hasContext: boolean;
  }) => {
    if (typeof window !== 'undefined' && posthog && isInitialized) {
      posthog.capture('chat_message_sent', {
        search_mode: properties.searchMode,
        message_length: properties.messageLength,
        has_context: properties.hasContext,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Document events
  documentUpload: (properties: {
    fileName: string;
    fileSize: number;
    fileType: string;
    success: boolean;
  }) => {
    if (typeof window !== 'undefined' && posthog && isInitialized) {
      posthog.capture('document_upload', {
        file_name: properties.fileName,
        file_size: properties.fileSize,
        file_type: properties.fileType,
        upload_success: properties.success,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Search mode events
  searchModeChanged: (properties: {
    fromMode: 'rag' | 'agent';
    toMode: 'rag' | 'agent';
  }) => {
    if (typeof window !== 'undefined' && posthog && isInitialized) {
      posthog.capture('search_mode_changed', {
        from_mode: properties.fromMode,
        to_mode: properties.toMode,
        timestamp: new Date().toISOString()
      });
    }
  },

  // App lifecycle events
  appStarted: () => {
    if (typeof window !== 'undefined' && posthog && isInitialized) {
      posthog.capture('app_started', {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent
      });
    }
  }
};

export default posthog;