export interface CompressMessage {
  type: 'COMPRESS';
  payload: File;
}

export interface CompressResult {
  success: boolean;
  data?: string;
  error?: string;
}

// ✅ ADD THESE MISSING INTERFACES:

export interface ExportMessage {
  type: 'EXPORT';
  payload: {
    data: unknown[];
    filename: string;
    format: 'xlsx' | 'csv' | 'json';
    options?: {
      sheetName?: string;
      includeHeaders?: boolean;
      encoding?: string;
    };
  };
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  filename?: string;
  error?: string;
  downloadUrl?: string;
}

// ✅ UNION TYPE FOR ALL MESSAGE TYPES:
export type WorkerMessage = CompressMessage | ExportMessage;

// ✅ UNION TYPE FOR ALL RESULT TYPES:
export type WorkerResult = CompressResult | ExportResult;
