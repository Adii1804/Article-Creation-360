import React from 'react';
import { Badge, Tag, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  SyncOutlined 
} from '@ant-design/icons';
import type { ExtractedRow } from '../../types/extraction/ExtractionTypes';

interface StatusBadgeProps {
  status: ExtractedRow['status'];
  showText?: boolean;
  size?: 'small' | 'default';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  showText = true, 
  size = 'default' 
}) => {
  const getStatusConfig = (status: ExtractedRow['status']) => {
    switch (status) {
      case 'Done':
        return {
          color: '#4fde07ff',
          backgroundColor: '#77d11dff',
          borderColor: '#020301ff',
          icon: <CheckCircleOutlined />,
          text: 'Completed',
          tooltip: 'AI extraction completed successfully'
        };
      case 'Pending':
        return {
          color: '#FF6F61',
          backgroundColor: '#3597d3ff',
          borderColor: '#070809ff',
          icon: <ClockCircleOutlined />,
          text: 'Pending',
          tooltip: 'Waiting for AI analysis'
        };
      case 'Error':
        return {
          color: '#ff4d4f',
          backgroundColor: '#f0381bff',
          borderColor: '#ffadd2',
          icon: <ExclamationCircleOutlined />,
          text: 'Error',
          tooltip: 'AI extraction failed - retry available'
        };
      case 'Extracting':
        return {
          color: '#faad14',
          backgroundColor: '#cfb019ff',
          borderColor: '#ffe58f',
          icon: <SyncOutlined spin />,
          text: 'Processing',
          tooltip: 'AI is analyzing the image...'
        };
      default:
        return {
          color: '#8c8c8c',
          backgroundColor: '#989393ff',
          borderColor: '#d9d9d9',
          icon: <ClockCircleOutlined />,
          text: 'Unknown',
          tooltip: 'Status unknown'
        };
    }
  };

  const config = getStatusConfig(status);

  if (!showText) {
    return (
      <Tooltip title={config.tooltip}>
        <Badge 
          color={config.color}
          style={{ 
            width: size === 'small' ? 8 : 10, 
            height: size === 'small' ? 8 : 10 
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={config.tooltip}>
      <Tag
        icon={config.icon}
        color={config.color}
        style={{
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          fontSize: size === 'small' ? 11 : 12,
          padding: size === 'small' ? '2px 6px' : '4px 8px',
          borderRadius: 4,
          fontWeight: 500
        }}
      >
        {config.text}
      </Tag>
    </Tooltip>
  );
};
