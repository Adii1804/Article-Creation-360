import React from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Space,
  Button,
  Badge,
  Typography,
  Card,
  Progress
} from 'antd';
import {
  PlusOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import type { DiscoveredAttribute } from '../../../shared/types/extraction/ExtractionTypes';

const { Text, Paragraph } = Typography;

interface DiscoveryDetailModalProps {
  discovery: DiscoveredAttribute | null;
  visible: boolean;
  onClose: () => void;
  onPromote: (discoveryKey: string) => void;
}

export const DiscoveryDetailModal: React.FC<DiscoveryDetailModalProps> = ({
  discovery,
  visible,
  onClose,
  onPromote
}) => {
  if (!discovery) return null;

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return '#52c41a';
    if (confidence >= 60) return '#faad14';
    return '#ff7875';
  };

  const getConfidenceStatus = (confidence: number): string => {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    return 'Low';
  };

  const isPromotable = discovery.frequency >= 2 && discovery.confidence >= 75;

  return (
    <Modal
      title={
        <Space>
          <ExperimentOutlined style={{ color: '#722ed1' }} />
          <span>Discovery Details</span>
          {isPromotable && (
            <Tag icon={<TrophyOutlined />} color="success">
              Ready for Schema
            </Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        isPromotable && (
          <Button
            key="promote"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              onPromote(discovery.key);
              onClose();
            }}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Add to Schema
          </Button>
        )
      ].filter(Boolean)}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Main Info */}
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Attribute Name">
            <Text strong style={{ fontSize: 16, color: '#722ed1' }}>
              {discovery.label}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Technical Key">
            <Text code>{discovery.key}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Current Value">
            <Text strong style={{ color: '#FF6F61' }}>
              {discovery.normalizedValue}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Raw AI Output">
            <Text type="secondary" style={{ fontStyle: 'italic' }}>
              {discovery.rawValue}
            </Text>
          </Descriptions.Item>
        </Descriptions>

        {/* Confidence & Quality */}
        <Card size="small" title="AI Analysis Quality">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>AI Confidence: </Text>
              <Progress
                percent={discovery.confidence}
                strokeColor={getConfidenceColor(discovery.confidence)}
                size="small"
                style={{ width: 200, display: 'inline-block', marginLeft: 8 }}
              />
              <Text style={{ marginLeft: 8 }}>
                {discovery.confidence}% ({getConfidenceStatus(discovery.confidence)})
              </Text>
            </div>
            
            <div>
              <Text strong>Times Observed: </Text>
              <Badge 
                count={discovery.frequency} 
                style={{ 
                  backgroundColor: discovery.frequency > 1 ? '#FF6F61' : '#8c8c8c' 
                }}
              />
            </div>
            
            <div>
              <Text strong>Suggested Type: </Text>
              <Tag color="blue" style={{ textTransform: 'uppercase' }}>
                {discovery.suggestedType.toUpperCase()}
              </Tag>
            </div>
          </Space>
        </Card>

        {/* AI Reasoning */}
        <Card size="small" title="AI Reasoning">
          <Paragraph style={{ marginBottom: 0, fontSize: 13 }}>
            <InfoCircleOutlined style={{ color: '#FF6F61', marginRight: 8 }} />
            <strong>Why AI identified this attribute:</strong>
          </Paragraph>
          <Paragraph 
            style={{ 
              marginTop: 8, 
              padding: 12, 
              backgroundColor: '#f6f8fa',
              borderRadius: 6,
              fontStyle: 'italic',
              fontSize: 13
            }}
          >
            {discovery.reasoning}
          </Paragraph>
        </Card>

        {/* Possible Values */}
        {discovery.possibleValues && discovery.possibleValues.length > 0 && (
          <Card size="small" title="Observed Values">
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Values AI has observed for this attribute:
              </Text>
            </div>
            <Space wrap>
              {discovery.possibleValues.map((value, index) => (
                <Tag key={index} color="geekblue" style={{ marginBottom: 4 }}>
                  {value}
                </Tag>
              ))}
            </Space>
          </Card>
        )}

        {/* Promotion Info */}
        <Card 
          size="small" 
          style={{ 
            backgroundColor: isPromotable ? '#f6ffed' : '#fff7e6',
            border: isPromotable ? '1px solid #b7eb8f' : '1px solid #ffd591'
          }}
        >
          {isPromotable ? (
            <Space direction="vertical">
              <Space>
                <TrophyOutlined style={{ color: '#52c41a' }} />
                <Text strong style={{ color: '#52c41a' }}>
                  Ready for Schema Promotion
                </Text>
              </Space>
              <Paragraph style={{ marginBottom: 0, fontSize: 13 }}>
                This discovery has high confidence ({discovery.confidence}%) and has been
                observed {discovery.frequency} times. Adding it to your schema will
                automatically extract this attribute in future analyses.
              </Paragraph>
            </Space>
          ) : (
            <Space direction="vertical">
              <Space>
                <InfoCircleOutlined style={{ color: '#faad14' }} />
                <Text strong style={{ color: '#faad14' }}>
                  Not Yet Promotable
                </Text>
              </Space>
              <Paragraph style={{ marginBottom: 0, fontSize: 13 }}>
                {discovery.frequency < 2
                  ? `Needs to be observed more times (currently: ${discovery.frequency}, needs: 2+)`
                  : `Needs higher confidence (currently: ${discovery.confidence}%, needs: 75%+)`
                } to be eligible for schema promotion.
              </Paragraph>
            </Space>
          )}
        </Card>
      </Space>
    </Modal>
  );
};
