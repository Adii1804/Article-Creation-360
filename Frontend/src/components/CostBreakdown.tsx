import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Spin, Empty, Modal, Statistic, Row, Col, Space, message, Popconfirm } from 'antd';
import { DeleteOutlined, ReloadOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import costApi from '../services/costTrackingApi';

interface ImageCost {
  imageId: string;
  imageName: string;
  imageUrl?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  modelName: string;
  extractionTimeMs: number;
  timestamp: string;
}

interface SessionSummary {
  totalImages: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  averageCostPerImage: number;
  averageTokensPerImage: number;
  estimatedCreditsUsed: number;
}

export const CostBreakdown: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [images, setImages] = useState<ImageCost[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageCost | null>(null);

  // Load data on component mount and set up polling
  useEffect(() => {
    loadCostData();
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(loadCostData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadCostData = async () => {
    try {
      setLoading(true);
      const [summaryData, imagesData] = await Promise.all([
        costApi.getSummary(),
        costApi.getImages()
      ]);
      setSummary(summaryData);
      setImages(imagesData || []);
    } catch (error) {
      console.error('Failed to load cost data:', error);
      message.error('Failed to load cost tracking data');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = async () => {
    try {
      await costApi.resetSession();
      message.success('Session reset successfully');
      loadCostData();
    } catch (error) {
      console.error('Failed to reset session:', error);
      message.error('Failed to reset session');
    }
  };

  const handleExportSession = async () => {
    try {
      const json = await costApi.exportSession();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cost-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('Session exported successfully');
    } catch (error) {
      console.error('Failed to export session:', error);
      message.error('Failed to export session');
    }
  };

  const showImagePreview = (image: ImageCost) => {
    setSelectedImage(image);
    setImagePreviewUrl(image.imageUrl || '');
    setImagePreviewVisible(true);
  };

  const columns = [
    {
      title: 'Image Name',
      dataIndex: 'imageName',
      key: 'imageName',
      width: 200,
      ellipsis: true
    },
    {
      title: 'Input Tokens',
      dataIndex: 'inputTokens',
      key: 'inputTokens',
      width: 130,
      render: (tokens: number) => tokens.toLocaleString()
    },
    {
      title: 'Output Tokens',
      dataIndex: 'outputTokens',
      key: 'outputTokens',
      width: 130,
      render: (tokens: number) => tokens.toLocaleString()
    },
    {
      title: 'Total Tokens',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      width: 120,
      render: (tokens: number) => tokens.toLocaleString()
    },
    {
      title: 'Model',
      dataIndex: 'modelName',
      key: 'modelName',
      width: 120
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      render: (cost: number) => `$${cost.toFixed(6)}`
    },
    {
      title: 'Time (ms)',
      dataIndex: 'extractionTimeMs',
      key: 'extractionTimeMs',
      width: 100,
      render: (ms: number) => ms.toLocaleString()
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (ts: string) => new Date(ts).toLocaleString()
    },
    {
      title: 'Action',
      key: 'action',
      width: 60,
      render: (_: any, record: ImageCost) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => showImagePreview(record)}
          title="Preview image"
        />
      )
    }
  ];

  if (loading && !summary) {
    return <Spin tip="Loading cost data..." />;
  }

  return (
    <div className="cost-breakdown">
      {/* Summary Statistics */}
      {summary && (
        <Card className="mb-4" title="Cost Summary">
          <Row gutter={16} className="mb-4">
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Total Images"
                value={summary.totalImages}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Total Cost"
                value={`$${summary.totalCost.toFixed(6)}`}
                precision={6}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Total Tokens"
                value={summary.totalTokens.toLocaleString()}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Avg Cost/Image"
                value={`$${summary.averageCostPerImage.toFixed(6)}`}
                precision={6}
              />
            </Col>
          </Row>
          <Row gutter={16} className="mb-4">
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Input Tokens"
                value={summary.totalInputTokens.toLocaleString()}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Output Tokens"
                value={summary.totalOutputTokens.toLocaleString()}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Avg Tokens/Image"
                value={summary.averageTokensPerImage.toLocaleString()}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Credits Used"
                value={summary.estimatedCreditsUsed.toFixed(2)}
              />
            </Col>
          </Row>
        </Card>
      )
      }

      {/* Actions */}
      <Card className="mb-4">
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadCostData}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportSession}
          >
            Export Report
          </Button>
          <Popconfirm
            title="Reset Session"
            description="Are you sure you want to clear all cost tracking data? This cannot be undone."
            onConfirm={handleResetSession}
            okText="Yes, Reset"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
            >
              Reset Session
            </Button>
          </Popconfirm>
        </Space>
      </Card>

      {/* Images Table */}
      <Card title="Per-Image Cost Breakdown">
        {images.length === 0 ? (
          <Empty description="No images processed yet" />
        ) : (
          <Table
            columns={columns}
            dataSource={images.map(img => ({
              ...img,
              key: img.imageId
            }))}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['5', '10', '20', '50']
            }}
            scroll={{ x: 1200 }}
            loading={loading}
          />
        )}
      </Card>

      {/* Image Preview Modal */}
      <Modal
        title={selectedImage?.imageName}
        open={imagePreviewVisible}
        onCancel={() => setImagePreviewVisible(false)}
        width={600}
        footer={null}
      >
        {imagePreviewUrl ? (
          <div style={{ textAlign: 'center' }}>
            <img
              src={imagePreviewUrl}
              alt={selectedImage?.imageName}
              style={{ maxWidth: '100%', maxHeight: 400 }}
            />
            {selectedImage && (
              <div style={{ marginTop: 16 }}>
                <p><strong>Input Tokens:</strong> {selectedImage.inputTokens.toLocaleString()}</p>
                <p><strong>Output Tokens:</strong> {selectedImage.outputTokens.toLocaleString()}</p>
                <p><strong>Total Tokens:</strong> {selectedImage.totalTokens.toLocaleString()}</p>
                <p><strong>Cost:</strong> ${selectedImage.cost.toFixed(6)}</p>
                <p><strong>Model:</strong> {selectedImage.modelName}</p>
                <p><strong>Time:</strong> {selectedImage.extractionTimeMs}ms</p>
                <p><strong>Processed:</strong> {new Date(selectedImage.timestamp).toLocaleString()}</p>
              </div>
            )}
          </div>
        ) : (
          <Empty description="No image preview available" />
        )}
      </Modal>
    </div >
  );
};

export default CostBreakdown;
