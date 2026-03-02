import React from 'react';
import { Button, Upload, Progress, Tooltip, Segmented, Input, Popconfirm } from 'antd';
import {
  UploadOutlined,
  ExperimentOutlined,
  FileExcelOutlined,
  BarChartOutlined,
  TableOutlined,
  ClearOutlined
} from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';
import type { ExtractedRow } from '../../types/extraction/ExtractionTypes';
import * as XLSX from 'xlsx';

const { Search } = Input;

// ✅ FIX: Define proper type for export row
interface ExportRowData {
  'Row': number;
  'Image Name': string;
  'Status': string;
  'Extraction Date': string;
  'Processing Time (ms)': number;
  'AI Model': string;
  'Tokens Used': number;
  [key: string]: string | number; // For dynamic attribute columns
}

interface AppHeaderProps {
  onUpload: (file: RcFile) => Promise<boolean> | boolean;
  onExtract: () => void;
  onClearAll: () => void;
  isExtracting: boolean;
  rows: ExtractedRow[];
  progress: number;
  currentView: 'extractor' | 'dashboard';
  onViewChange: (view: 'extractor' | 'dashboard') => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = React.memo(({
  onUpload,
  onExtract,
  onClearAll,
  isExtracting,
  rows,
  progress,
  currentView,
  onViewChange,
  searchTerm,
  onSearchChange
}) => {
  const pendingCount = rows.filter(r => r.status === 'Pending' && r.file?.size > 0).length;
  const doneCount = rows.filter(r => r.status === 'Done').length;
  const totalCount = rows.length;

  // ✅ FIX: Properly typed exportToExcel function
  const exportToExcel = (extractedRows: ExtractedRow[]): void => {
    try {
      // Filter only completed rows
      const doneRows = extractedRows.filter(r => r.status === 'Done');
      
      if (doneRows.length === 0) {
        alert('No completed extractions to export');
        return;
      }

      // ✅ FIX: Properly typed export data preparation
      const exportData: ExportRowData[] = doneRows.map((row, index) => {
        const exportRow: ExportRowData = {
          'Row': index + 1,
          'Image Name': row.originalFileName,
          'Status': row.status,
          'Extraction Date': row.updatedAt?.toISOString() || new Date().toISOString(),
          'Processing Time (ms)': row.extractionTime || 0,
          'AI Model': row.modelUsed || 'Unknown',
          'Tokens Used': row.apiTokensUsed || 0,
        };

        // Add all extracted attributes with proper typing
        Object.entries(row.attributes).forEach(([key, attribute]) => {
          if (attribute && attribute.schemaValue !== null && attribute.schemaValue !== undefined) {
            const value = attribute.schemaValue;
            // Ensure the value is string or number
            exportRow[key] = typeof value === 'string' || typeof value === 'number' 
              ? value 
              : String(value);
          }
        });

        return exportRow;
      });

      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Attributes');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `clothing_extraction_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      console.log(`Exported ${doneRows.length} rows to ${filename}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleExport = (): void => {
    exportToExcel(rows);
  };

  return (
    <div className="app-page-header" style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1 style={{ margin: 0 }}>Clothing Attribute Extractor</h1>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Segmented
          key="view-switcher"
          options={[
            {
              value: 'extractor',
              icon: <TableOutlined />,
              label: "Extractor"
            },
            {
              value: 'dashboard',
              icon: <BarChartOutlined />,
              label: "Dashboard"
            },
          ]}
          value={currentView}
          onChange={(value) => onViewChange(value as 'extractor' | 'dashboard')}
        />,
        <Search
          key="search"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ width: 200, verticalAlign: 'middle' }}
        />,
        <Upload
          key="upload"
          name="file"
          multiple={true}
          beforeUpload={onUpload}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Upload Images</Button>
        </Upload>,
        <Tooltip key="extract-tooltip" title={pendingCount > 0 ? "Extract attributes for all pending images" : "No images to extract"}>
          <Button
            icon={<ExperimentOutlined />}
            onClick={onExtract}
            loading={isExtracting}
            disabled={pendingCount === 0}
            type="primary"
          >
            {isExtracting ? 'Extracting...' : `Extract All (${pendingCount})`}
          </Button>
        </Tooltip>,
        <Button
          key="export"
          icon={<FileExcelOutlined />}
          onClick={handleExport}
          disabled={doneCount === 0}
        >
          Export to Excel ({doneCount})
        </Button>,
        <Popconfirm
          key="clear-all"
          title="Are you sure you want to clear all rows?"
          onConfirm={onClearAll}
          okText="Yes, Clear All"
          cancelText="No"
          disabled={totalCount === 0}
        >
          <Button danger disabled={totalCount === 0} icon={<ClearOutlined />}>
            Clear All
          </Button>
        </Popconfirm>
      </div>
      {isExtracting && <Progress percent={progress} />}
    </div>
  );
});
