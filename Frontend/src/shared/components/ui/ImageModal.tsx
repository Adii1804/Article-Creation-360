import React from 'react';
import { Modal, Image, Typography, Space, Button, Tooltip } from 'antd';
import { 
  DownloadOutlined, 
  InfoCircleOutlined,
  CloseOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

interface ImageModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName?: string;
  imageSize?: number;
  extractionData?: {
    confidence?: number;
    processingTime?: number;
    attributesFound?: number;
  };
}

export const ImageModal: React.FC<ImageModalProps> = ({
  visible,
  onClose,
  imageUrl,
  imageName,
  imageSize,
  extractionData
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined style={{ color: '#FF6F61' }} />
          <span>Image Details</span>
          {imageName && (
            <Text code style={{ fontSize: 12 }}>
              {imageName}
            </Text>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width="90vw"
      style={{ maxWidth: 1200 }}
      footer={[
        <Space key="actions">
          <Tooltip title="Download original image">
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleDownload}
              className="btn-secondary"
            >
              Download
            </Button>
          </Tooltip>
          <Button key="close" onClick={onClose} className="btn-primary">
            Close
          </Button>
        </Space>
      ]}
      closeIcon={<CloseOutlined style={{ color: 'white' }} />}
    >
      <div style={{ textAlign: 'center' }}>
        {/* Image Display */}
        <div style={{ 
          marginBottom: 24, 
          maxHeight: '70vh', 
          overflow: 'hidden',
          borderRadius: 8,
          border: '1px solid #f0f0f0'
        }}>
          <Image
            src={imageUrl}
            alt={imageName}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '70vh', 
              objectFit: 'contain' 
            }}
            preview={false}
          />
        </div>

        {/* Image Metadata */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 16,
          padding: 16,
          backgroundColor: '#fafafa',
          borderRadius: 8,
          border: '1px solid #f0f0f0'
        }}>
          {imageName && (
            <div>
              <Text strong style={{ color: '#666', fontSize: 12 }}>FILE NAME</Text>
              <div style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 13, wordBreak: 'break-all' }}>
                  {imageName}
                </Text>
              </div>
            </div>
          )}
          
          {imageSize && (
            <div>
              <Text strong style={{ color: '#666', fontSize: 12 }}>FILE SIZE</Text>
              <div style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 13 }}>
                  {formatFileSize(imageSize)}
                </Text>
              </div>
            </div>
          )}

          {extractionData && (
            <>
              {typeof extractionData.confidence === 'number' && (
                <div>
                  <Text strong style={{ color: '#666', fontSize: 12 }}>AI CONFIDENCE</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text style={{ 
                      fontSize: 13, 
                      color: extractionData.confidence >= 80 ? '#52c41a' : 
                             extractionData.confidence >= 60 ? '#faad14' : '#ff4d4f'
                    }}>
                      {extractionData.confidence}%
                    </Text>
                  </div>
                </div>
              )}

              {typeof extractionData.processingTime === 'number' && (
                <div>
                  <Text strong style={{ color: '#666', fontSize: 12 }}>PROCESSING TIME</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 13 }}>
                      {extractionData.processingTime < 1000 
                        ? `${Math.round(extractionData.processingTime)}ms`
                        : `${(extractionData.processingTime / 1000).toFixed(1)}s`
                      }
                    </Text>
                  </div>
                </div>
              )}

              {typeof extractionData.attributesFound === 'number' && (
                <div>
                  <Text strong style={{ color: '#666', fontSize: 12 }}>ATTRIBUTES FOUND</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 13, color: '#FF6F61' }}>
                      {extractionData.attributesFound}
                    </Text>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
