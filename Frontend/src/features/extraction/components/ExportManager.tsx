import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import {
  Card,
  Button,
  Select,
  Space,
  Typography,
  Checkbox,
  Divider,
  notification,
  Progress
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import {
  ORDERED_EXPORT_HEADERS,
  HEADER_TO_SCHEMA_KEY,
  buildExportSchema,
  exportToCSV,
  exportToExcel,
  exportToJSON,
  mapMasterAttributes,
  prepareExportData
} from '../../../shared/utils/export/extractionExport';
import type { ExtractedRowEnhanced, SchemaItem } from '../../../shared/types/extraction/ExtractionTypes';
import { APP_CONFIG } from '../../../constants/app/config';

const { Text } = Typography;
const { Option } = Select;

interface ExportManagerProps {
  extractedRows: ExtractedRowEnhanced[];
  schema: SchemaItem[];
  categoryName?: string;
  onClose: () => void;
}

type ExportFormat = 'excel' | 'csv' | 'json';


const ExportManager: React.FC<ExportManagerProps> = ({
  extractedRows,
  schema,
  categoryName,
  onClose
}) => {
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [includeDiscoveries, setIncludeDiscoveries] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(schema.map(item => item.key));
  const [masterAttributes, setMasterAttributes] = useState<SchemaItem[]>([]);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportSchema = useMemo(() => buildExportSchema(schema, masterAttributes), [masterAttributes, schema]);

  const orderedHeaders = useMemo(() => [...ORDERED_EXPORT_HEADERS], []);

  useEffect(() => {
    const fetchMasterAttributes = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${APP_CONFIG.api.baseURL}/user/attributes?includeValues=true`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (!response.ok) return;

        const result = await response.json().catch(() => null);
        const data = result?.data;
        if (!Array.isArray(data)) return;

        setMasterAttributes(mapMasterAttributes(data));
      } catch {
        // Fail silently; fallback to current schema
      }
    };

    fetchMasterAttributes();
  }, []);

  useEffect(() => {
    if (exportSchema.length > 0) {
      setSelectedAttributes(exportSchema.map(item => item.key));
    }
  }, [exportSchema]);

  const prepareExport = useCallback(() => {
    return prepareExportData(extractedRows, exportSchema, orderedHeaders, includeMetadata, includeDiscoveries);
  }, [extractedRows, exportSchema, orderedHeaders, includeMetadata, includeDiscoveries]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setProgress(0);

    try {
      const exportData = prepareExport();
      setProgress(50);

      switch (format) {
        case 'excel':
          await exportToExcel(exportData, orderedHeaders, exportSchema, categoryName);
          break;
        case 'csv':
          await exportToCSV(exportData, categoryName);
          break;
        case 'json':
          await exportToJSON(exportData, exportSchema, categoryName);
          break;
      }

      setProgress(100);
      notification.success({
        message: 'Export Successful',
        description: `Data exported as ${format.toUpperCase()} file`,
        duration: 3
      });

      setTimeout(onClose, 1000);
    } catch {
      notification.error({
        message: 'Export Failed',
        description: 'An error occurred during export',
        duration: 5
      });
    } finally {
      setExporting(false);
      setProgress(0);
    }
  }, [categoryName, exportSchema, format, onClose, orderedHeaders, prepareExport]);

  const formatIcons = {
    excel: <FileExcelOutlined style={{ color: '#1B6F00' }} />,
    csv: <FileTextOutlined style={{ color: '#52c41a' }} />,
    json: <FileTextOutlined style={{ color: '#FF6F61' }} />
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card size="small" title="Export Format">
        <Select
          value={format}
          onChange={setFormat}
          style={{ width: '100%' }}
          size="large"
        >
          <Option value="excel">
            <Space>{formatIcons.excel} Excel Spreadsheet (.xlsx)</Space>
          </Option>
          <Option value="csv">
            <Space>{formatIcons.csv} CSV File (.csv)</Space>
          </Option>
          <Option value="json">
            <Space>{formatIcons.json} JSON Data (.json)</Space>
          </Option>
        </Select>
      </Card>

      <Card size="small" title={`Attributes to Export (${exportSchema.length})`}>
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          <Checkbox
            indeterminate={false}
            checked={true}
            onChange={() => setSelectedAttributes(exportSchema.map(item => item.key))}
            style={{ marginBottom: 8 }}
          >
            All attributes included
          </Checkbox>
          <Divider style={{ margin: '8px 0' }} />
          <Checkbox.Group
            value={selectedAttributes}
            onChange={setSelectedAttributes}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {exportSchema.map(item => (
                <Checkbox key={item.key} value={item.key} disabled>
                  <Space>
                    <Text>{item.label}</Text>
                    {item.required && <Text type="secondary" style={{ fontSize: 11 }}>(Required)</Text>}
                  </Space>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>
      </Card>

      <Card size="small" title="Export Options">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Checkbox checked={includeMetadata} onChange={(e) => setIncludeMetadata(e.target.checked)}>
            Include AI metadata (confidence scores, processing time, token usage)
          </Checkbox>
          <Checkbox checked={includeDiscoveries} onChange={(e) => setIncludeDiscoveries(e.target.checked)}>
            Include AI discoveries (additional attributes found)
          </Checkbox>
        </Space>
      </Card>

      {exporting && (
        <Progress
          percent={progress}
          status="active"
          strokeColor={{ from: '#FF6F61', to: '#FFA62B' }}
        />
      )}

      <Card size="small" style={{ backgroundColor: '#f6f8fa' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Export Summary:</Text>
          <Text>• {extractedRows.length} images will be exported</Text>
          <Text>• {selectedAttributes.length} attributes per image</Text>
          <Text>• Format: {format.toUpperCase()}</Text>
          {includeMetadata && <Text>• AI metadata included</Text>}
          {includeDiscoveries && <Text>• Discovery data included</Text>}
        </Space>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          loading={exporting}
          onClick={handleExport}
          disabled={selectedAttributes.length === 0}
          className="btn-primary"
        >
          {exporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
        </Button>
      </div>
    </Space>
  );
};

export default memo(ExportManager);
