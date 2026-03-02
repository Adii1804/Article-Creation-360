/**
 * 🔍 Sentry Configuration for Frontend
 * Error tracking, performance monitoring, and debugging
 */

import * as Sentry from '@sentry/react';

export const initSentry = () => {
  // Only initialize if DSN is provided and not explicitly disabled
  const isEnabled = import.meta.env.VITE_SENTRY_ENABLED !== 'false';
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.info('ℹ️ Sentry monitoring is disabled (no DSN provided)');
    return;
  }
  
  if (!isEnabled) {
    console.info('ℹ️ Sentry monitoring is disabled (VITE_SENTRY_ENABLED=false)');
    return;
  }

  Sentry.init({
    dsn,
    
    // Environment
    environment: import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development',
    
    // Release version (from package.json or git commit)
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
    
    // Integrations
    integrations: [
      // Browser Tracing for performance monitoring
      Sentry.browserTracingIntegration(),
      
      // Replay for session recording (helpful for debugging)
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
      
      // React-specific error boundary
      Sentry.browserProfilingIntegration(),
    ],

    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_DEBUG) {
        console.error('Sentry (dev mode):', event, hint);
        return null;
      }
      
      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        
        // Ignore network errors (user's connection issues)
        if (message.includes('Network Error') || message.includes('Failed to fetch')) {
          return null;
        }
        
        // Ignore React Query errors (handled by UI)
        if (message.includes('Query failed')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Breadcrumbs for debugging context
    beforeBreadcrumb(breadcrumb) {
      // Filter sensitive data from breadcrumbs
      if (breadcrumb.category === 'console') {
        return null; // Don't send console logs
      }
      return breadcrumb;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      
      // Network issues (user's problem, not ours)
      'NetworkError',
      'Network request failed',
      
      // React DevTools
      '__REACT_DEVTOOLS_',
    ],
  });

  console.info('✅ Sentry monitoring initialized', {
    environment: import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
  });
};

/**
 * Set user context for error tracking
 */
export const setSentryUser = (userId: string | number, email?: string, username?: string) => {
  Sentry.setUser({
    id: String(userId),
    email,
    username,
  });
};

/**
 * Clear user context (on logout)
 */
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

/**
 * Add custom context to errors
 */
export const setSentryContext = (key: string, value: Record<string, unknown>) => {
  Sentry.setContext(key, value);
};

/**
 * Add breadcrumb for debugging
 */
export const addSentryBreadcrumb = (message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Manually capture exception
 */
export const captureSentryException = (error: Error, context?: Record<string, unknown>) => {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value as Record<string, unknown>);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * Capture message (non-error)
 */
export const captureSentryMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

/**
 * Start performance transaction
 */
export const startSentryTransaction = (name: string, op: string) => {
  return Sentry.startSpan({ name, op }, (span) => span);
};

export default {
  initSentry,
  setSentryUser,
  clearSentryUser,
  setSentryContext,
  addSentryBreadcrumb,
  captureSentryException,
  captureSentryMessage,
  startSentryTransaction,
};
