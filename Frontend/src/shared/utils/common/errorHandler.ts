import React from 'react';
import { logger } from './logger';

// Error classification system - using const assertions
export const ErrorType = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  CLIENT_ERROR: 'CLIENT_ERROR',
  UNKNOWN: 'UNKNOWN'
} as const;

export type ErrorTypeValues = typeof ErrorType[keyof typeof ErrorType];

// Structured error interface
export interface AppError {
  type: ErrorTypeValues;
  message: string;
  userMessage: string;
  code?: string | number;
  context?: Record<string, unknown>;
  originalError?: Error;
  timestamp: Date;
}

// Type guard for AppError
function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    'userMessage' in error &&
    'timestamp' in error
  );
}

// Classify errors into known types for user-friendly messages
export const classifyError = (error: unknown, context?: string): AppError => {
  const timestamp = new Date();

  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    let type: ErrorTypeValues = ErrorType.UNKNOWN;
    let userMessage = 'An unexpected error occurred. Please try again.';

    const messageLower = error.message.toLowerCase();

    if (messageLower.includes('failed to fetch') || messageLower.includes('network request failed')) {
      type = ErrorType.NETWORK;
      userMessage = 'Network connection error. Please check your internet connection and try again.';
    } else if (messageLower.includes('validation') || messageLower.includes('invalid')) {
      type = ErrorType.VALIDATION;
      userMessage = 'Please check your input and try again.';
    } else if (messageLower.includes('unauthorized') || messageLower.includes('authentication')) {
      type = ErrorType.AUTHENTICATION;
      userMessage = 'Please log in and try again.';
    } else if (messageLower.includes('forbidden') || messageLower.includes('permission')) {
      type = ErrorType.AUTHORIZATION;
      userMessage = 'You do not have permission to perform this action.';
    } else if (messageLower.includes('not found') || messageLower.includes('404')) {
      type = ErrorType.NOT_FOUND;
      userMessage = 'The requested resource was not found.';
    }

    return {
      type,
      message: error.message,
      userMessage,
      context: context ? { context } : undefined,
      originalError: error,
      timestamp,
    };
  }

  // Non-Error objects
  return {
    type: ErrorType.UNKNOWN,
    message: String(error),
    userMessage: 'An unexpected error occurred. Please try again.',
    context: context ? { context } : undefined,
    timestamp,
  };
};

// Main error handler - logs and returns AppError
export const handleError = (error: unknown, context?: string): AppError => {
  const appError = classifyError(error, context);

  logger.error(`Error in ${context || 'application'}`, {
    type: appError.type,
    message: appError.message,
    code: appError.code,
    context: appError.context,
    stack: appError.originalError?.stack,
  });

  return appError;
};

// React HOC for error boundary wrapping of components (sync only)
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  const WrappedComponent = (props: P): React.ReactElement => {
    try {
      return React.createElement(Component, props);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), Component.name);
      return React.createElement('div', {}, 'Something went wrong. Please try again.');
    }
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Type-safe API response handler
export function handleApiResponse<T>(
  response: { success: boolean; data?: T; error?: string }
): T {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'API request failed');
  }
  return response.data;
}

// Recovery strategies to wrap retry, fallback, and timeout
export const recoveryStrategies = {
  retry: async <T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
    delay = 1000
  ): Promise<T> => {
    let lastError: AppError | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = handleError(error, 'retry-operation');

        if (attempt === maxAttempts) {
          throw lastError;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }

    // Should never reach here due to throw, but satisfy TS
    throw lastError!;
  },

  fallback: async <T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> => {
    try {
      return await primary();
    } catch (error) {
      logger.warn('Primary operation failed, trying fallback', { error });
      return await fallback();
    }
  },

  withTimeout: async <T>(
    operation: () => Promise<T>,
    timeoutMs = 10000
  ): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });

    return Promise.race([operation(), timeoutPromise]);
  }
};

// In production, send errors to error tracking services
export const reportError = (error: AppError, additionalContext?: Record<string, unknown>): void => {
  if (import.meta.env.PROD) {
    // Example: Sentry.captureException(error.originalError || new Error(error.message));
    console.error('Production error reported:', error, additionalContext);
  }
};

// User-friendly error message getter
export const getUserFriendlyMessage = (error: AppError): string => error.userMessage;

// Hook to handle errors in functional components
export const useErrorHandler = () => {
  const handleErrorCallback = React.useCallback((error: unknown, context?: string) => {
    const appError = classifyError(error, context);
    reportError(appError);
    return appError;
  }, []);

  return handleErrorCallback;
};

// Factory for AppError creation
export const createAppError = (
  type: ErrorTypeValues,
  message: string,
  userMessage?: string,
  options?: {
    code?: string | number;
    context?: Record<string, unknown>;
    originalError?: Error;
  }
): AppError => ({
  type,
  message,
  userMessage: userMessage || message,
  code: options?.code,
  context: options?.context,
  originalError: options?.originalError,
  timestamp: new Date(),
});

// Common specific error creators
export const createNetworkError = (message = 'Network error occurred') =>
  createAppError(ErrorType.NETWORK, message, 'Please check your connection and try again.');

export const createValidationError = (message = 'Validation failed') =>
  createAppError(ErrorType.VALIDATION, message, 'Please check your input and try again.');

export const createAuthError = (message = 'Authentication required') =>
  createAppError(ErrorType.AUTHENTICATION, message, 'Please log in and try again.');
