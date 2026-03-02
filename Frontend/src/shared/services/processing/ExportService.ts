import { logger } from '../../utils/common/logger';
import type { ExtractedRow, SchemaItem } from '../../types/extraction/ExtractionTypes';

interface ExportQueueItem {
  resolve: (value: string) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export class ExportService {
  private worker: Worker | null = null;
  private exportQueue = new Map<string, ExportQueueItem>();
  private isInitialized = false;

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker(): void {
    try {
      this.worker = new Worker(
        new URL('../../workers/exportWorker.ts', import.meta.url),
        { type: 'module' }
      );
      
      this.worker.onmessage = (event) => {
        const { id, type, payload } = event.data;
        const queueItem = this.exportQueue.get(id);
        
        if (!queueItem) return;
        
        switch (type) {
          case 'EXPORT_PROGRESS':
            queueItem.onProgress?.(payload.progress || 0);
            break;
            
          case 'EXPORT_COMPLETE':
            if (payload.success && payload.downloadUrl) {
              queueItem.resolve(payload.downloadUrl);
              logger.info('Export completed successfully', { id });
            } else {
              queueItem.reject(new Error('Export failed'));
            }
            this.exportQueue.delete(id);
            break;
            
          case 'EXPORT_ERROR':
            queueItem.reject(new Error(payload.error || 'Export failed'));
            logger.error('Export failed', { id, error: payload.error });
            this.exportQueue.delete(id);
            break;
        }
      };
      
      this.worker.onerror = (error) => {
        logger.error('Export worker error', { error });
        this.handleWorkerError();
      };
      
      this.isInitialized = true;
      logger.info('Export service initialized');
      
    } catch (error) {
      logger.error('Failed to initialize export worker', { error });
      this.isInitialized = false;
    }
  }

  private handleWorkerError(): void {
    this.exportQueue.forEach(({ reject }) => {
      reject(new Error('Export worker crashed'));
    });
    this.exportQueue.clear();
    
    this.worker?.terminate();
    this.initializeWorker();
  }

  async exportToExcel(
    extractedRows: ExtractedRow[],
    filename: string,
    schema: SchemaItem[],
    onProgress?: (progress: number) => void
  ): Promise<string> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Export service not initialized');
    }

    if (extractedRows.length === 0) {
      throw new Error('No data to export');
    }

    const id = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('Starting Excel export', { 
      id, 
      rowCount: extractedRows.length,
      schemaCount: schema.length 
    });
    
    return new Promise<string>((resolve, reject) => {
      this.exportQueue.set(id, { resolve, reject, onProgress });
      
      this.worker!.postMessage({
        id,
        type: 'EXPORT_XLSX',
        payload: {
          extractedRows: extractedRows.map(row => ({
            ...row,
            // Serialize dates for worker transfer
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt?.toISOString()
          })),
          filename,
          schema
        }
      });
      
      // Timeout after 5 minutes for large exports
      setTimeout(() => {
        if (this.exportQueue.has(id)) {
          this.exportQueue.delete(id);
          reject(new Error('Export timeout (5 minutes)'));
        }
      }, 300000);
    });
  }

  destroy(): void {
    this.worker?.terminate();
    this.exportQueue.clear();
    this.isInitialized = false;
    logger.info('Export service destroyed');
  }
}
