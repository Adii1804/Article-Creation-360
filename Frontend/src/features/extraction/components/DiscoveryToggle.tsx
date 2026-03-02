import React from 'react';
import { Switch, Space, Typography, Tooltip, Card, Statistic } from 'antd';
import { 
  ExperimentOutlined, 
  InfoCircleOutlined, 
  RobotOutlined,
  TrophyOutlined 
} from '@ant-design/icons';
import type { DiscoverySettings } from '../../../shared/types/extraction/ExtractionTypes';

const { Text } = Typography;

interface DiscoveryToggleProps {
  settings: DiscoverySettings;
  onChange: (settings: DiscoverySettings) => void;
  rowsWithDiscovery?: { // ✅ ADD THIS LINE
    total: number;
  };
  stats?: {
    totalDiscoveries: number;
    promotableDiscoveries: number;
    extractionsWithDiscovery: number;
  };
  disabled?: boolean;
}

export const DiscoveryToggle: React.FC<DiscoveryToggleProps> = ({
  settings,
  onChange,
  rowsWithDiscovery, // ✅ ADD THIS LINE
  stats,
  disabled = false
}) => {
  const handleToggle = (enabled: boolean) => {
    onChange({ ...settings, enabled });
  };

  return (
    <Card 
      size="small" 
      className="discovery-toggle-card"
      style={{ 
        marginBottom: 16,
        background: settings.enabled 
          ? 'linear-gradient(135deg, #f6f0ff 0%, #e6f7ff 100%)'
          : 'rgba(255, 255, 255, 0.95)',
        border: settings.enabled ? '1px solid #b37feb' : '1px solid #d9d9d9'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Space>
            <RobotOutlined 
              style={{ 
                color: settings.enabled ? '#722ed1' : '#8c8c8c',
                fontSize: 16 
              }} 
            />
            <Text strong style={{ color: settings.enabled ? '#722ed1' : undefined }}>
              AI Discovery Mode {settings.enabled ? '(ON)' : '(OFF)'}
            </Text>
            <Tooltip 
              title={
                <div>
                  <div><strong>Discovery Mode:</strong></div>
                  <div>• Finds attributes beyond your schema</div>
                  <div>• Discovers brand details, construction info</div>
                  <div>• Suggests new attributes for schema</div>
                  <div>• 🔴 Uses more tokens (7k+ vs 3k)</div>
                  <div>• ⏱️ Slightly slower but more comprehensive</div>
                  <div>• Enable only when needed for new discoveries</div>
                </div>
              }
            >
              <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'help' }} />
            </Tooltip>
          </Space>

          <Switch
            checked={settings.enabled}
            onChange={handleToggle}
            disabled={disabled}
            checkedChildren={<ExperimentOutlined />}
            unCheckedChildren="OFF"
            style={{ 
              backgroundColor: settings.enabled ? '#722ed1' : undefined 
            }}
          />
        </Space>

        {/* ✅ SHOW BOTH STATS AND ROWS WITH DISCOVERY */}
        <Space size="large">
          {stats && (
            <>
              <Statistic 
                title="Discoveries" 
                value={stats.totalDiscoveries}
                prefix={<ExperimentOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ fontSize: 14, color: '#722ed1' }}
              />
              {stats.promotableDiscoveries > 0 && (
                <Statistic 
                  title="Promotable" 
                  value={stats.promotableDiscoveries}
                  prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ fontSize: 14, color: '#52c41a' }}
                />
              )}
            </>
          )}
          
          {/* ✅ USE THE NEW rowsWithDiscovery PROP */}
          {rowsWithDiscovery && settings.enabled && (
            <Statistic
              title="Images Processed"
              value={rowsWithDiscovery.total}
              prefix={<ExperimentOutlined style={{ color: '#FF6F61' }} />}
              valueStyle={{ fontSize: 14, color: '#FF6F61' }}
            />
          )}
        </Space>
      </div>

      {settings.enabled && (
        <div style={{ 
          marginTop: 12, 
          padding: 8, 
          backgroundColor: '#f6f4ff', 
          borderRadius: 6,
          fontSize: 12
        }}>
          <Space>
            <Text type="secondary">
              <ExperimentOutlined /> Discovery active - AI will extract additional attributes beyond schema
            </Text>
          </Space>
        </div>
      )}
    </Card>
  );
};
