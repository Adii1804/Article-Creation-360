import React, { useState, useMemo, useCallback } from 'react';
import { Button, notification, Progress, Space } from 'antd';
import { FileExcelOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ExtractedRow, SchemaItem } from '../../../shared/types/extraction/ExtractionTypes';
import { ExportService } from '../../../shared/services/processing/ExportService';
import { logger } from '../../../shared/utils/common/logger';

interface ExportButtonProps {
  extractedRows: ExtractedRow[];
  schema: SchemaItem[];
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ 
  extractedRows, 
  schema, 
  disabled = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Initialize export service (singleton pattern)
  const exportService = useMemo(() => new ExportService(), []);
  
  // Get exportable data count
  const exportableCount = useMemo(() => 
    extractedRows.filter(row => row.status === 'Done').length,
    [extractedRows]
  );

  const handleExport = useCallback(async () => {
    if (exportableCount === 0) {
      notification.warning({
        message: 'No Data to Export',
        description: 'Please complete some extractions before exporting.',
        duration: 3
      });
      return;
    }

    setLoading(true);
    setProgress(0);
    
    const startTime = Date.now();
    const filename = `fashion-extraction-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    try {
      logger.info('Export started', { 
        exportableCount, 
        totalRows: extractedRows.length,
        filename 
      });
      
      const downloadUrl = await exportService.exportToExcel(
        extractedRows,
        filename,
        schema,
        (progressValue) => {
          setProgress(progressValue);
        }
      );
      
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup URL after download
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      
      const exportTime = Date.now() - startTime;
      
      notification.success({
        message: 'Export Successful! 🎉',
        description: `Exported ${exportableCount} rows in ${(exportTime / 1000).toFixed(1)}s`,
        duration: 5
      });
      
      logger.info('Export completed successfully', { 
        exportableCount,
        exportTime,
        filename 
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      
      notification.error({
        message: 'Export Failed',
        description: `${errorMessage}. Please try again.`,
        duration: 5
      });
      
      logger.error('Export failed', { 
        error: errorMessage,
        exportableCount,
        filename 
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, [exportService, extractedRows, schema, exportableCount]);

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Button 
        type="primary" 
        icon={loading ? <DownloadOutlined /> : <FileExcelOutlined />}
        onClick={handleExport} 
        loading={loading}
        disabled={disabled || exportableCount === 0}
        size="large"
        style={{ width: '100%' }}
      >
        {loading ? 'Exporting...' : `Export to Excel (${exportableCount} rows)`}
      </Button>
      
      {loading && progress > 0 && (
        <Progress 
          percent={progress} 
          size="small" 
          status="active"
          format={(percent) => `${percent}%`}
        />
      )}
      
      {!loading && exportableCount === 0 && (
        <div style={{ fontSize: 12, color: '#8c8c8c', textAlign: 'center' }}>
          Complete some extractions to enable export
        </div>
      )}
    </Space>
  );
};
