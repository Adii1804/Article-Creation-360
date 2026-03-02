// Web Worker for XLSX export with image embedding - eliminates UI blocking
import ExcelJS from 'exceljs';

interface ExtractedRow {
  status: string;
  attributes: Record<string, { value: string; confidence: number; schemaValue?: unknown }>;
  imageName: string;
  originalFileName: string;
  imagePreviewUrl: string;
  processingTime: number;
  extractionTime: number;
  extractionDate: string;
  updatedAt?: { toISOString?: () => string };
  aiModel: string;
  modelUsed: string;
  tokensUsed: number;
  apiTokensUsed: number;
  confidence: number;
}

interface ExportMessage {
  id: string;
  type: 'EXPORT_XLSX';
  payload: {
    extractedRows: ExtractedRow[];
    filename: string;
    schema: Record<string, unknown>[];
  };
}

interface ExportResponse {
  id: string;
  type: 'EXPORT_COMPLETE' | 'EXPORT_ERROR' | 'EXPORT_PROGRESS';
  payload: {
    success?: boolean;
    progress?: number;
    downloadUrl?: string;
    error?: string;
  };
}

self.onmessage = async (event: MessageEvent<ExportMessage>) => {
  const { id, type, payload } = event.data;
  
  if (type !== 'EXPORT_XLSX') return;
  
  try {
    const { extractedRows, schema } = payload;
    
    // Progress reporting
    self.postMessage({
      id,
      type: 'EXPORT_PROGRESS',
      payload: { progress: 10 }
    } as ExportResponse);
    
    // Filter completed rows
    const doneRows = extractedRows.filter((r: ExtractedRow) => r.status === 'Done');
    
    self.postMessage({
      id,
      type: 'EXPORT_PROGRESS', 
      payload: { progress: 20 }
    } as ExportResponse);
    
    // Transform data efficiently (batched processing)
    const batchSize = 100;
    const exportData: Record<string, unknown>[] = [];
    
    for (let i = 0; i < doneRows.length; i += batchSize) {
      const batch = doneRows.slice(i, i + batchSize);
      
      const batchData = batch.map((row: ExtractedRow, index: number) => {
        const exportRow: Record<string, unknown> = {
          'Row': i + index + 1,
          'Image Name': row.originalFileName,
          'Status': row.status,
          'Extraction Date': row.updatedAt?.toISOString?.() || new Date().toISOString(),
          'Processing Time (ms)': row.extractionTime || 0,
          'AI Model': row.modelUsed || 'gpt-4o',
          'Tokens Used': row.apiTokensUsed || 0,
          'Confidence': row.confidence || 0,
        };

        // Add schema attributes
        if (row.attributes) {
          Object.entries(row.attributes).forEach(([key, attribute]: [string, { value: string; confidence: number; schemaValue?: unknown }]) => {
            if (attribute && attribute.schemaValue !== null && attribute.schemaValue !== undefined) {
              const value = attribute.schemaValue;
              exportRow[key] = typeof value === 'string' || typeof value === 'number' ? value : String(value);
            }
          });
        }

        return exportRow;
      });
      
      exportData.push(...batchData);
      
      // Report progress
      const progress = 20 + (i / doneRows.length) * 50;
      self.postMessage({
        id,
        type: 'EXPORT_PROGRESS',
        payload: { progress: Math.round(progress) }
      } as ExportResponse);
    }
    
    self.postMessage({
      id,
      type: 'EXPORT_PROGRESS',
      payload: { progress: 75 }
    } as ExportResponse);
    
    // Create Excel workbook with ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AI Fashion Extractor';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Fashion Extraction Data');
    
    // Define columns - add Image column as first column
    const columns: Array<{ header: string; key: string; width: number }> = [
      { header: 'Image', key: 'image', width: 20 }
    ];
    
    // Add other columns based on exportData
    if (exportData.length > 0) {
      Object.keys(exportData[0]).forEach((key) => {
        columns.push({
          header: key,
          key: key,
          width: key === 'Image Name' ? 30 : 15
        });
      });
    }
    
    worksheet.columns = columns;
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { ...worksheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Add data rows with images
    for (let i = 0; i < doneRows.length; i++) {
      const row = doneRows[i];
      const rowData = exportData[i];
      
      // Add the data row (Excel rows are 1-indexed, +2 accounts for header)
      const excelRow = worksheet.addRow(rowData);
      const rowIndex = i + 2;
      
      // Set row height to accommodate image
      excelRow.height = 100;
      
      // Add image if available
      if (row.imagePreviewUrl) {
        try {
          // Fetch the image as blob
          const response = await fetch(row.imagePreviewUrl);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          
          // Determine image extension
          const ext = row.originalFileName.split('.').pop()?.toLowerCase() || 'png';
          const imageId = workbook.addImage({
            buffer: arrayBuffer,
            extension: ext === 'jpg' ? 'jpeg' : (ext === 'jpeg' || ext === 'png' ? ext : 'png')
          });
          
          // Add image to cell A using range notation
          worksheet.addImage(imageId, `A${rowIndex}:A${rowIndex}`);
        } catch (imgError) {
          console.error('Failed to add image:', imgError);
          // Continue without image
        }
      }
      
      // Report progress
      if (i % 10 === 0) {
        const progress = 75 + (i / doneRows.length) * 15;
        self.postMessage({
          id,
          type: 'EXPORT_PROGRESS',
          payload: { progress: Math.round(progress) }
        } as ExportResponse);
      }
    }
    
    // Add metadata sheet
    const metadataSheet = workbook.addWorksheet('Metadata');
    metadataSheet.columns = [
      { header: 'Property', key: 'property', width: 25 },
      { header: 'Value', key: 'value', width: 40 }
    ];
    
    metadataSheet.addRow({ property: 'Export Date', value: new Date().toISOString() });
    metadataSheet.addRow({ property: 'Total Rows', value: exportData.length });
    metadataSheet.addRow({ property: 'Schema Attributes', value: schema.length });
    metadataSheet.addRow({ property: 'App Version', value: '2.0.0' });
    
    metadataSheet.getRow(1).font = { bold: true };
    
    self.postMessage({
      id,
      type: 'EXPORT_PROGRESS',
      payload: { progress: 95 }
    } as ExportResponse);
    
    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const downloadUrl = URL.createObjectURL(blob);
    
    self.postMessage({
      id,
      type: 'EXPORT_COMPLETE',
      payload: { 
        success: true, 
        downloadUrl,
        progress: 100 
      }
    } as ExportResponse);
    
  } catch (error) {
    self.postMessage({
      id,
      type: 'EXPORT_ERROR',
      payload: { 
        error: error instanceof Error ? error.message : 'Export failed' 
      }
    } as ExportResponse);
  }
};
