import React from 'react';
import { Upload, Button, Tooltip } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';

interface SmallUploadButtonProps {
  onUpload: (file: File, fileList: File[]) => Promise<boolean | void>;
  disabled?: boolean;
  variant?: 'default' | 'compact' | 'icon-only';
}

export const SmallUploadButton: React.FC<SmallUploadButtonProps> = ({ 
  onUpload, 
  disabled = false,
  variant = 'default'
}) => {
  const handleUpload = async (file: RcFile, fileList: RcFile[]) => {
    const files = fileList.map(f => f as File);
    return onUpload(file as File, files);
  };

  const getButtonContent = () => {
    switch (variant) {
      case 'compact':
        return (
          <Button 
            size="small" 
            icon={<UploadOutlined />}
            disabled={disabled}
            className="btn-secondary"
          >
            Add More
          </Button>
        );
      case 'icon-only':
        return (
          <Tooltip title={disabled ? 'Upload disabled' : 'Upload more images'}>
            <Button 
              type="text"
              icon={<PlusOutlined />}
              disabled={disabled}
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%',
                border: '2px dashed #FF6F61',
                color: '#FF6F61'
              }}
            />
          </Tooltip>
        );
      default:
        return (
          <Button 
            icon={<UploadOutlined />}
            disabled={disabled}
            className="btn-primary"
          >
            Upload More Images
          </Button>
        );
    }
  };

  return (
    <Upload
      name="files"
      multiple
      accept="image/*"
      beforeUpload={(file, fileList) => {
        // ✅ FIXED: Use beforeUpload instead of customRequest
        handleUpload(file as RcFile, fileList as RcFile[]);
        return false; // Prevent default upload
      }}
      disabled={disabled}
      showUploadList={false}
    >
      {getButtonContent()}
    </Upload>
  );
};
