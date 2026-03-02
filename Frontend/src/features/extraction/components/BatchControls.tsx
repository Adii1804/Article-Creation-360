import React from 'react';
import { Card, Space, Button, Statistic, Row, Col, Progress, Tooltip, Typography } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { colors } from '../../../theme/colors';

const { Text } = Typography;

interface BatchControlsProps {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  pending: number;
  isProcessing: boolean;
  isPaused: boolean;
  progress: number;
  totalTokens?: number;
  estimatedTimeRemaining?: number;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onRetryFailed?: () => void;
  onClearCompleted?: () => void;
  disabled?: boolean;
}

export const BatchControls: React.FC<BatchControlsProps> = ({
  total,
  completed,
  failed,
  processing,
  pending,
  isProcessing,
  isPaused,
  progress,
  totalTokens,
  estimatedTimeRemaining,
  onStart,
  onPause,
  onResume,
  onStop,
  onRetryFailed,
  onClearCompleted,
  disabled = false
}) => {
  const formatTime = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getProgressColor = () => {
    if (failed > 0 && completed + failed === total) {
      return colors.error[500];
    }
    if (isProcessing) {
      return colors.primary[500];
    }
    if (completed === total && total > 0) {
      return colors.success[500];
    }
    return colors.text.secondary;
  };

  return (
    <Card 
      title="Batch Processing Controls"
      style={{ marginBottom: 24 }}
    >
      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Items"
              value={total}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: colors.primary[500] }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Completed"
              value={completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: colors.success[500] }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Failed"
              value={failed}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: colors.error[500] }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Pending"
              value={pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: colors.warning[500] }}
            />
          </Card>
        </Col>
      </Row>

      {/* Progress Bar */}
      <div style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text strong>Overall Progress</Text>
            <Text type="secondary">
              {completed + failed} / {total} items
            </Text>
          </Space>
          <Progress
            percent={Math.round(progress)}
            status={
              failed > 0 && completed + failed === total ? 'exception' :
              completed === total && total > 0 ? 'success' :
              isProcessing ? 'active' : 'normal'
            }
            strokeColor={getProgressColor()}
          />
          {isProcessing && (
            <Space size="large">
              {totalTokens !== undefined && (
                <Space size={4}>
                  <ThunderboltOutlined style={{ color: colors.warning[500] }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {totalTokens.toLocaleString()} tokens used
                  </Text>
                </Space>
              )}
              {estimatedTimeRemaining !== undefined && (
                <Space size={4}>
                  <ClockCircleOutlined style={{ color: colors.primary[500] }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Est. {formatTime(estimatedTimeRemaining)} remaining
                  </Text>
                </Space>
              )}
              {processing > 0 && (
                <Space size={4}>
                  <PlayCircleOutlined style={{ color: colors.primary[500] }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {processing} processing now
                  </Text>
                </Space>
              )}
            </Space>
          )}
        </Space>
      </div>

      {/* Control Buttons */}
      <Space wrap>
        {!isProcessing && pending > 0 && onStart && (
          <Tooltip title="Start batch processing">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={onStart}
              disabled={disabled}
              size="large"
            >
              Start Batch
            </Button>
          </Tooltip>
        )}

        {isProcessing && !isPaused && onPause && (
          <Tooltip title="Pause batch processing">
            <Button
              icon={<PauseCircleOutlined />}
              onClick={onPause}
              disabled={disabled}
              size="large"
            >
              Pause
            </Button>
          </Tooltip>
        )}

        {isProcessing && isPaused && onResume && (
          <Tooltip title="Resume batch processing">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={onResume}
              disabled={disabled}
              size="large"
            >
              Resume
            </Button>
          </Tooltip>
        )}

        {isProcessing && onStop && (
          <Tooltip title="Stop batch processing">
            <Button
              danger
              icon={<StopOutlined />}
              onClick={onStop}
              disabled={disabled}
              size="large"
            >
              Stop
            </Button>
          </Tooltip>
        )}

        {failed > 0 && !isProcessing && onRetryFailed && (
          <Tooltip title={`Retry ${failed} failed items`}>
            <Button
              icon={<ReloadOutlined />}
              onClick={onRetryFailed}
              disabled={disabled}
            >
              Retry Failed ({failed})
            </Button>
          </Tooltip>
        )}

        {completed > 0 && !isProcessing && onClearCompleted && (
          <Tooltip title={`Remove ${completed} completed items from queue`}>
            <Button
              icon={<DeleteOutlined />}
              onClick={onClearCompleted}
              disabled={disabled}
            >
              Clear Completed ({completed})
            </Button>
          </Tooltip>
        )}
      </Space>

      {/* Status Messages */}
      {isProcessing && isPaused && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: colors.warning[50], 
          border: `1px solid ${colors.warning[300]}`,
          borderRadius: 6 
        }}>
          <Space>
            <PauseCircleOutlined style={{ color: colors.warning[500] }} />
            <Text style={{ color: colors.warning[700] }}>
              Batch processing is paused. Click Resume to continue.
            </Text>
          </Space>
        </div>
      )}

      {!isProcessing && total > 0 && completed + failed === total && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: failed === 0 ? colors.success[50] : colors.error[50], 
          border: `1px solid ${failed === 0 ? colors.success[300] : colors.error[300]}`,
          borderRadius: 6 
        }}>
          <Space>
            {failed === 0 ? (
              <>
                <CheckCircleOutlined style={{ color: colors.success[500] }} />
                <Text style={{ color: colors.success[700] }}>
                  Batch processing completed successfully! All {completed} items processed.
                </Text>
              </>
            ) : (
              <>
                <CloseCircleOutlined style={{ color: colors.error[500] }} />
                <Text style={{ color: colors.error[700] }}>
                  Batch processing completed with {failed} failed items. {completed} succeeded.
                </Text>
              </>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
};
