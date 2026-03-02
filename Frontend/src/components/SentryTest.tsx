import React from 'react';
import { Button, Space, Card, Typography } from 'antd';
import * as Sentry from '@sentry/react';

const { Title, Text } = Typography;

/**
 * Sentry Test Component
 * Use this to test Sentry error tracking in your app
 * 
 * Usage: Import and add <SentryTest /> anywhere in your app
 */
export const SentryTest: React.FC = () => {
  const handleTestMessage = () => {
    Sentry.captureMessage('🧪 Test message from UI button!', 'info');
    console.log('✅ Test message sent to Sentry');
  };

  const handleTestError = () => {
    const error = new Error('🧪 Test error from UI button!');
    Sentry.captureException(error);
    console.log('✅ Test error sent to Sentry');
  };

  const handleTestThrow = () => {
    // This will be caught by ErrorBoundary
    throw new Error('🧪 Test error - should trigger ErrorBoundary!');
  };

  const handleTestAsync = async () => {
    try {
      await Promise.reject(new Error('🧪 Test async error!'));
    } catch (error) {
      Sentry.captureException(error);
      console.log('✅ Async error sent to Sentry');
    }
  };

  const handleCheckSentry = () => {
    const client = Sentry.getClient();
    console.log('Sentry Client:', {
      initialized: !!client,
      lastEventId: Sentry.lastEventId(),
      dsn: client?.getDsn?.(),
    });
  };

  return (
    <Card 
      title="🧪 Sentry Testing Panel" 
      style={{ margin: '20px', maxWidth: '600px' }}
      extra={<Text type="secondary">Development Mode Only</Text>}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={5}>Test Error Tracking</Title>
        
        <Space wrap>
          <Button type="primary" onClick={handleTestMessage}>
            📨 Send Test Message
          </Button>
          
          <Button type="primary" onClick={handleTestError}>
            ⚠️ Send Test Error
          </Button>
          
          <Button type="primary" danger onClick={handleTestThrow}>
            💥 Throw Error (ErrorBoundary)
          </Button>
          
          <Button onClick={handleTestAsync}>
            🔄 Test Async Error
          </Button>
          
          <Button onClick={handleCheckSentry}>
            🔍 Check Sentry Status
          </Button>
        </Space>

        <Text type="secondary" style={{ marginTop: '10px', display: 'block' }}>
          After clicking, check your Sentry dashboard in 5-10 seconds
        </Text>
      </Space>
    </Card>
  );
};

export default SentryTest;
