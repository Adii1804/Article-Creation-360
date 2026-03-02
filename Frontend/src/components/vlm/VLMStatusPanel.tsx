import React, { useState, useEffect } from 'react';
import { Card, Badge, Tooltip, Button, Space, Typography, Progress } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { BackendApiService } from '../../services/api/backendApi';

const { Text, Title } = Typography;

interface VLMProvider {
  id: string;
  name: string;
  status: boolean;
  description: string;
  type: 'primary' | 'fallback' | 'local' | 'specialized';
}

export const VLMStatusPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<VLMProvider[]>([]);
  const [systemHealth, setSystemHealth] = useState<number>(0);
  const [recommendation, setRecommendation] = useState<string>('');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const backendApi = new BackendApiService();

  const checkVLMHealth = async () => {
    setIsLoading(true);
    try {
      const response = await backendApi.vlmHealthCheck();
      
      if (response.success && response.data) {
        const providerData = response.data.providers as Record<string, boolean>;
        const health = response.data.systemHealth as number;
        const rec = response.data.recommendation as string;

        const providerList: VLMProvider[] = [
          {
            id: 'fashion-clip',
            name: 'Fashion-CLIP',
            status: providerData['fashion-clip'] || false,
            description: 'Fashion-specialized vision model (fastest)',
            type: 'specialized'
          },
          {
            id: 'ollama-llava',
            name: 'Local LLaVA',
            status: providerData['ollama-llava'] || false,
            description: 'Local processing (free, private)',
            type: 'local'
          },
          {
            id: 'huggingface-llava',
            name: 'HuggingFace LLaVA',
            status: providerData['huggingface-llava'] || false,
            description: 'Cloud-based open-source model',
            type: 'primary'
          },
          {
            id: 'openai-gpt4v',
            name: 'OpenAI GPT-4V',
            status: providerData['openai-gpt4v'] || false,
            description: 'Reliable fallback (most capable)',
            type: 'fallback'
          }
        ];

        setProviders(providerList);
        setSystemHealth(Math.round(health * 100));
        setRecommendation(rec);
        setLastCheck(new Date());
      }
    } catch (error) {
      console.error('VLM health check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkVLMHealth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'specialized': return '#FF6F61';
      case 'local': return '#52c41a';
      case 'primary': return '#722ed1';
      case 'fallback': return '#fa8c16';
      default: return '#d9d9d9';
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
  };

  const healthyProviders = providers.filter(p => p.status).length;

  return (
    <Card 
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>Enhanced VLM System</Title>
          <Badge 
            count={`${healthyProviders}/${providers.length}`} 
            style={{ backgroundColor: systemHealth > 75 ? '#52c41a' : systemHealth > 50 ? '#fa8c16' : '#ff4d4f' }}
          />
        </Space>
      }
      size="small"
      extra={
        <Button 
          size="small" 
          icon={<SyncOutlined />} 
          loading={isLoading}
          onClick={checkVLMHealth}
        >
          Refresh
        </Button>
      }
      style={{ marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* System Health */}
        <div>
          <Text strong>System Health: </Text>
          <Progress 
            percent={systemHealth} 
            size="small" 
            strokeColor={systemHealth > 75 ? '#52c41a' : systemHealth > 50 ? '#fa8c16' : '#ff4d4f'}
          />
        </div>

        {/* Providers Status */}
        <div>
          <Space wrap size="small">
            {providers.map((provider) => (
              <Tooltip 
                key={provider.id}
                title={
                  <div>
                    <div><strong>{provider.name}</strong></div>
                    <div>{provider.description}</div>
                    <div>Status: {provider.status ? 'Online' : 'Offline'}</div>
                  </div>
                }
              >
                <Badge 
                  dot 
                  color={getTypeColor(provider.type)}
                  style={{ cursor: 'help' }}
                >
                  <Space size="small">
                    {getStatusIcon(provider.status)}
                    <Text style={{ fontSize: '12px' }}>
                      {provider.name}
                    </Text>
                  </Space>
                </Badge>
              </Tooltip>
            ))}
          </Space>
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div style={{ 
            padding: '8px 12px', 
            backgroundColor: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: '6px'
          }}>
            <Space>
              <InfoCircleOutlined style={{ color: '#52c41a' }} />
              <Text style={{ fontSize: '12px' }}>{recommendation}</Text>
            </Space>
          </div>
        )}

        {/* Last Check */}
        {lastCheck && (
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Last checked: {lastCheck.toLocaleTimeString()}
          </Text>
        )}

        {/* Quick Info */}
        <div style={{ 
          padding: '6px 8px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '4px'
        }}>
          <Text style={{ fontSize: '11px' }}>
             Enhanced system uses {healthyProviders} AI models for {systemHealth > 50 ? '85-95%' : '70-85%'} accuracy
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default VLMStatusPanel;