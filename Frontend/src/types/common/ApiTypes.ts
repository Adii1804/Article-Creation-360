// Common interfaces for uploads and statistics
export interface UploadRecord {
  id: string;
  originalName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  userId: string;
  processingTime?: number;
  errorMessage?: string;
  extractionResults?: ExtractionResult[];
}

export interface ExtractionResult {
  id: string;
  uploadId: string;
  extractedData: Record<string, unknown>;
  confidence: number;
  processingTime: number;
  createdAt: string;
}

export interface UserStats {
  totalUploads: number;
  completedUploads: number;
  failedUploads: number;
  pendingUploads: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
}

export interface AdminStats extends UserStats {
  totalUsers: number;
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface ChartDataPoint {
  name: string;
  value: number;
  percent?: number;
}