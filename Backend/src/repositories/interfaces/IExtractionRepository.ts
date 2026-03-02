// 🏗️ Database-agnostic repository interface for easy Prisma migration

export interface ExtractionJob {
  id: string;
  userId?: string;
  imageData: string; // base64
  schema: any[];
  department?: string;
  subDepartment?: string;
  categoryName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'normal' | 'high';
  estimatedTokens: number;
  actualTokens?: number;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  processingTime?: number;
}

export interface TokenUsage {
  id: string;
  jobId: string;
  modelUsed: string;
  tokensUsed: number;
  cost: number;
  timestamp: Date;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalTokensUsed: number;
  averageProcessingTime: number;
}

export interface IExtractionRepository {
  // Job Management
  createJob(job: Omit<ExtractionJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExtractionJob>;
  getJob(id: string): Promise<ExtractionJob | null>;
  updateJobStatus(id: string, status: ExtractionJob['status'], result?: any, error?: string): Promise<void>;
  getJobsByStatus(status: ExtractionJob['status']): Promise<ExtractionJob[]>;
  getJobsByUser(userId: string): Promise<ExtractionJob[]>;
  
  // Queue Management
  getNextJob(): Promise<ExtractionJob | null>;
  getQueueStats(): Promise<QueueStats>;
  getPendingJobsByPriority(): Promise<ExtractionJob[]>;
  
  // Token Tracking
  recordTokenUsage(usage: Omit<TokenUsage, 'id' | 'timestamp'>): Promise<void>;
  getTokenUsageByPeriod(startDate: Date, endDate: Date): Promise<TokenUsage[]>;
  getTotalTokensUsedToday(): Promise<number>;
  
  // Cleanup
  cleanupOldJobs(olderThanDays: number): Promise<number>;
}