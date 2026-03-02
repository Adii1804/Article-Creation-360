import React from 'react';
import * as Sentry from '@sentry/react';
import { Button, Result } from 'antd';
import { ReloadOutlined, HomeOutlined, BugOutlined } from '@ant-design/icons';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDialog?: boolean;
  onReset?: () => void;
}

interface ErrorFallbackProps {
  error: Error;
  componentStack: string | null;
  resetError: () => void;
}

/**
 * Custom error fallback component with recovery options
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, componentStack, resetError }) => {
  const isDevelopment = import.meta.env.MODE === 'development';

  const handleReportIssue = () => {
    Sentry.showReportDialog({
      eventId: Sentry.lastEventId(),
      title: "It looks like we're having issues.",
      subtitle: 'Our team has been notified.',
      subtitle2: "If you'd like to help, tell us what happened below.",
    });
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div style={{ padding: '50px 20px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="500"
        title="Something went wrong"
        subTitle="We're sorry for the inconvenience. The error has been reported to our team."
        extra={[
          <Button type="primary" icon={<ReloadOutlined />} onClick={resetError} key="reset">
            Try Again
          </Button>,
          <Button icon={<HomeOutlined />} onClick={handleGoHome} key="home">
            Go Home
          </Button>,
          <Button icon={<BugOutlined />} onClick={handleReportIssue} key="report">
            Report Issue
          </Button>,
        ]}
      >
        {isDevelopment && (
          <div style={{ textAlign: 'left', marginTop: 24 }}>
            <details style={{ whiteSpace: 'pre-wrap', fontSize: '12px', background: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                Error Details (Development Only)
              </summary>
              <div>
                <strong>Error:</strong> {error.message}
              </div>
              {componentStack && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Component Stack:</strong>
                  <pre>{componentStack}</pre>
                </div>
              )}
              {error.stack && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Stack Trace:</strong>
                  <pre>{error.stack}</pre>
                </div>
              )}
            </details>
          </div>
        )}
      </Result>
    </div>
  );
};

/**
 * Error Boundary wrapper component using Sentry
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 * 
 * @example With custom fallback
 * ```tsx
 * <ErrorBoundary fallback={<div>Custom error UI</div>}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ 
  children, 
  fallback,
  showDialog = true,
  onReset 
}) => {
  return (
    <Sentry.ErrorBoundary
      fallback={fallback as any || ((props: any) => (
        <ErrorFallback 
          error={props.error as Error}
          componentStack={props.componentStack}
          resetError={props.resetError}
        />
      ))}
      showDialog={showDialog}
      onReset={onReset}
      beforeCapture={(scope) => {
        // Add custom context before sending to Sentry
        scope.setTag('error-boundary', 'react');
        scope.setLevel('error');
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

export default ErrorBoundary;
