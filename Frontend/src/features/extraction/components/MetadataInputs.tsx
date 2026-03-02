/**
 * MetadataInputs Component
 * 
 * Input fields for product metadata (vendor, design number, cost, selling price)
 * These are non-attribute fields that get saved with the extraction job
 */

import React from 'react';
import { Card, Input, InputNumber, Typography, Space } from 'antd';
import { ShopOutlined, FileTextOutlined, DollarOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

export interface ProductMetadata {
  vendorName?: string;
  designNumber?: string;
  pptNumber?: string;
  costPrice?: number;
  sellingPrice?: number;
  notes?: string;
}

interface MetadataInputsProps {
  value?: ProductMetadata;
  onChange?: (metadata: ProductMetadata) => void;
  disabled?: boolean;
}

export const MetadataInputs: React.FC<MetadataInputsProps> = ({
  value = {},
  onChange,
  disabled = false,
}) => {
  const handleChange = (field: keyof ProductMetadata, fieldValue: string | number | null | undefined) => {
    const newMetadata = { ...value, [field]: fieldValue };
    onChange?.(newMetadata);
  };

  return (
    <Card
      title={
        <span style={{ color: '#FF6F61', fontWeight: 600 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          Product Metadata
        </span>
      }
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
           AI will extract from tag/board if visible
        </Text>
      }
      className="metadata-inputs"
      style={{ borderRadius: 12 }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Vendor Name */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            <ShopOutlined style={{ marginRight: 4 }} />
            Vendor Name
          </Text>
          <Input
            placeholder="e.g., ABC Textiles Ltd."
            value={value.vendorName}
            onChange={(e) => handleChange('vendorName', e.target.value)}
            disabled={disabled}
            size="large"
            maxLength={100}
          />
        </div>

        {/* Design Number & PPT Number */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Design Number / SKU
            </Text>
            <Input
              placeholder="e.g., DES-2025-001"
              value={value.designNumber}
              onChange={(e) => handleChange('designNumber', e.target.value)}
              disabled={disabled}
              size="large"
              maxLength={50}
            />
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              PPT Number
            </Text>
            <Input
              placeholder="e.g., 033858"
              value={value.pptNumber}
              onChange={(e) => handleChange('pptNumber', e.target.value)}
              disabled={disabled}
              size="large"
              maxLength={50}
            />
          </div>
        </div>

        {/* Cost & Selling Price */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              <DollarOutlined style={{ marginRight: 4 }} />
              Cost Price
            </Text>
            <InputNumber
              placeholder="0.00"
              value={value.costPrice}
              onChange={(val) => handleChange('costPrice', val)}
              disabled={disabled}
              size="large"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              prefix="$"
            />
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              <DollarOutlined style={{ marginRight: 4 }} />
              Selling Price
            </Text>
            <InputNumber
              placeholder="0.00"
              value={value.sellingPrice}
              onChange={(val) => handleChange('sellingPrice', val)}
              disabled={disabled}
              size="large"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              prefix="$"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Notes
          </Text>
          <TextArea
            placeholder="Additional notes about this product (e.g., collection, season, special features)..."
            value={value.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            disabled={disabled}
            rows={3}
            maxLength={500}
            showCount
          />
        </div>
      </Space>
    </Card>
  );
};
