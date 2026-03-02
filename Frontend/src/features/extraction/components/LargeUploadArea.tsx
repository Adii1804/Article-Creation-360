import React from 'react';
import { Upload, Typography, Space, message } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/es/upload';

const { Dragger } = Upload;
const { Text, Title } = Typography;

interface LargeUploadAreaProps {
  onUpload: (file: File, fileList: File[]) => Promise<boolean | void>;
  disabled?: boolean;
}

export const LargeUploadArea: React.FC<LargeUploadAreaProps> = ({ 
  onUpload, 
  disabled = false 
}) => {
  interface FileSystemEntry {
    isFile: boolean;
    isDirectory: boolean;
    name: string;
    fullPath: string;
  }

  interface FileSystemFileEntry extends FileSystemEntry {
    file: (success: (file: File) => void, error?: (err: DOMException) => void) => void;
  }

  interface FileSystemDirectoryEntry extends FileSystemEntry {
    createReader: () => FileSystemDirectoryReader;
  }

  interface FileSystemDirectoryReader {
    readEntries: (success: (entries: FileSystemEntry[]) => void, error?: (err: DOMException) => void) => void;
  }

  const validateFile = (file: File): boolean => {
    const isImage = file.type.startsWith('image/');
    const isLt10M = file.size / 1024 / 1024 < 10;
    
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    if (!isLt10M) {
      message.error('Image must be smaller than 10MB!');
      return false;
    }
    return true;
  };

  const readDirectoryEntries = (directoryEntry: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> =>
    new Promise((resolve, reject) => {
      const reader = directoryEntry.createReader();
      const entries: FileSystemEntry[] = [];

      const readBatch = () => {
        reader.readEntries(
          (batch) => {
            if (batch.length === 0) {
              resolve(entries);
              return;
            }
            entries.push(...batch);
            readBatch();
          },
          (err) => reject(err)
        );
      };

      readBatch();
    });

  const getFilesFromEntry = async (entry: FileSystemEntry): Promise<File[]> => {
    if (entry.isFile) {
      return new Promise((resolve) => {
        (entry as FileSystemFileEntry).file((file) => resolve([file]), () => resolve([]));
      });
    }

    if (entry.isDirectory) {
      const directoryEntries = await readDirectoryEntries(entry as FileSystemDirectoryEntry);
      const nestedFiles = await Promise.all(directoryEntries.map(getFilesFromEntry));
      return nestedFiles.flat();
    }

    return [];
  };

  const getFilesFromDataTransferItems = async (items: DataTransferItemList): Promise<File[]> => {
    const itemList = Array.from(items);
    const files = await Promise.all(
      itemList.map(async (item) => {
        const entry = (item as unknown as { webkitGetAsEntry?: () => FileSystemEntry | null })
          .webkitGetAsEntry?.();
        if (entry) {
          return getFilesFromEntry(entry);
        }

        const file = item.getAsFile?.();
        return file ? [file] : [];
      })
    );

    return files.flat();
  };

  const handleUpload = async (file: RcFile, fileList: RcFile[]): Promise<boolean> => {
    // Validate all files first
    const validFiles = fileList.filter(validateFile);
    if (validFiles.length === 0) return false;

    try {
      const files = validFiles.map(f => f as File);
      const result = await onUpload(file as File, files);
      // If the onUpload handler explicitly returns true, allow the Upload component to proceed;
      // otherwise prevent the default upload behavior.
      return result === true;
    } catch (error: unknown) {
      // Provide a readable error message and log the full error for debugging
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Upload failed', error);
      message.error(`Upload failed: ${errorMessage}`);
      return false;
    }
  };

  const uploadProps: UploadProps = {
    name: 'files',
    multiple: true,
    accept: 'image/*',
    beforeUpload: handleUpload,
    onDrop: async (event) => {
      if (disabled) return;
      event.preventDefault();
      const { items } = event.dataTransfer;
      if (!items || items.length === 0) return;

      const files = await getFilesFromDataTransferItems(items);
      const validFiles = files.filter(validateFile);
      if (validFiles.length === 0) {
        message.error('No valid images found in the dropped folder.');
        return;
      }

      await handleUpload(validFiles[0] as RcFile, validFiles as RcFile[]);
    },
    disabled,
    showUploadList: false,
    style: { 
      padding: 60, 
      borderRadius: 16, 
      border: disabled ? "3px dashed #d9d9d9" : "3px dashed #FF6F61", 
      background: disabled 
        ? "rgba(0,0,0,0.04)" 
        : "linear-gradient(135deg, #f6f0ff 0%, #e6f7ff 100%)",
      minHeight: 400,
      transition: 'all 0.3s ease'
    }
  };

  return (
    <div style={{ padding: '60px 40px', textAlign: 'center' }}>
      <Dragger {...uploadProps}>
        <div>
          <CloudUploadOutlined 
            style={{ 
              fontSize: 80, 
              color: disabled ? '#d9d9d9' : '#FF6F61', 
              marginBottom: 24,
              transition: 'color 0.3s ease'
            }} 
          />
          
          <Title 
            level={2} 
            style={{ 
              color: disabled ? '#d9d9d9' : '#FF6F61', 
              margin: 0, 
              marginBottom: 16,
              transition: 'color 0.3s ease'
            }}
          >
            {disabled ? 'Processing...' : 'Drag & Drop Fashion Images'}
          </Title>
          
          <Text 
            style={{ 
              fontSize: 18, 
              color: disabled ? '#bfbfbf' : '#666', 
              display: 'block', 
              marginBottom: 24,
              transition: 'color 0.3s ease'
            }}
          >
            {disabled 
              ? 'AI is analyzing your images. Please wait...'
              : 'Upload multiple images for bulk AI analysis'
            }
          </Text>
          
          <Space direction="vertical" size="middle">
            <Text type="secondary" style={{ fontSize: 14 }}>
              • Supports JPG, PNG, WEBP formats
            </Text>
            <Text type="secondary" style={{ fontSize: 14 }}>
              • Maximum 10MB per image
            </Text>
            <Text type="secondary" style={{ fontSize: 14 }}>
              • Bulk processing with AI-powered extraction
            </Text>
          </Space>
        </div>
      </Dragger>
    </div>
  );
};
