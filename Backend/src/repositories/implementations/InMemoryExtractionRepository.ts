// In-memory implementation for current IndexedDB compatibility
// 📝 Easy migration path to Prisma later

import { 
  IExtractionRepository, 
  ExtractionJob, 
  TokenUsage, 
  QueueStats 
} from '../interfaces/IExtractionRepository';

export class InMemoryExtractionRepository implements IExtractionRepository {
  private jobs: Map<string, ExtractionJob> = new Map();
  private tokenUsage: TokenUsage[] = [];
  private jobQueue: string[] = []; // Job IDs in processing order

  async createJob(jobData: Omit<ExtractionJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExtractionJob> {
    const job: ExtractionJob = {
      ...jobData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.jobs.set(job.id, job);
    
    // Add to queue based on priority
    if (job.priority === 'high') {
      this.jobQueue.unshift(job.id);
    } else {
      this.jobQueue.push(job.id);
    }

    console.log(`📝 Job created: ${job.id} (Priority: ${job.priority}, Estimated tokens: ${job.estimatedTokens})`);
    
    return job;
  }

  async getJob(id: string): Promise<ExtractionJob | null> {
    return this.jobs.get(id) || null;
  }

  async updateJobStatus(
    id: string, 
    status: ExtractionJob['status'], 
    result?: any, 
    error?: string
  ): Promise<void> {
    const job = this.jobs.get(id);
    if (job) {
      job.status = status;
      job.updatedAt = new Date();
      
      if (result) job.result = result;
      if (error) job.error = error;
      
      // Remove from queue if completed or failed
      if (status === 'completed' || status === 'failed') {
        const queueIndex = this.jobQueue.indexOf(id);
        if (queueIndex > -1) {
          this.jobQueue.splice(queueIndex, 1);
        }
      }

      console.log(`🔄 Job ${id} status updated: ${status}`);
    }
  }

  async getJobsByStatus(status: ExtractionJob['status']): Promise<ExtractionJob[]> {
    return Array.from(this.jobs.values()).filter(job => job.status === status);
  }

  async getJobsByUser(userId: string): Promise<ExtractionJob[]> {
    return Array.from(this.jobs.values()).filter(job => job.userId === userId);
  }

  async getNextJob(): Promise<ExtractionJob | null> {
    while (this.jobQueue.length > 0) {
      const jobId = this.jobQueue[0];
      const job = this.jobs.get(jobId);
      
      if (job && job.status === 'pending') {
        // Update status to processing
        job.status = 'processing';
        job.updatedAt = new Date();
        return job;
      }
      
      // Remove invalid job from queue
      this.jobQueue.shift();
    }
    
    return null;
  }

  async getQueueStats(): Promise<QueueStats> {
    const jobs = Array.from(this.jobs.values());
    const totalTokens = this.tokenUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0);
    
    const completedJobs = jobs.filter(job => job.status === 'completed');
    const averageProcessingTime = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => sum + (job.processingTime || 0), 0) / completedJobs.length
      : 0;

    return {
      pending: jobs.filter(job => job.status === 'pending').length,
      processing: jobs.filter(job => job.status === 'processing').length,
      completed: jobs.filter(job => job.status === 'completed').length,
      failed: jobs.filter(job => job.status === 'failed').length,
      totalTokensUsed: totalTokens,
      averageProcessingTime
    };
  }

  async getPendingJobsByPriority(): Promise<ExtractionJob[]> {
    const pendingJobs = await this.getJobsByStatus('pending');
    
    return pendingJobs.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async recordTokenUsage(usage: Omit<TokenUsage, 'id' | 'timestamp'>): Promise<void> {
    const tokenRecord: TokenUsage = {
      ...usage,
      id: this.generateId(),
      timestamp: new Date()
    };

    this.tokenUsage.push(tokenRecord);
    
    // Update job with actual token usage
    const job = this.jobs.get(usage.jobId);
    if (job) {
      job.actualTokens = usage.tokensUsed;
    }

    console.log(`💰 Token usage recorded: ${usage.tokensUsed} tokens, $${usage.cost.toFixed(4)}`);
  }

  async getTokenUsageByPeriod(startDate: Date, endDate: Date): Promise<TokenUsage[]> {
    return this.tokenUsage.filter(usage => 
      usage.timestamp >= startDate && usage.timestamp <= endDate
    );
  }

  async getTotalTokensUsedToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayUsage = await this.getTokenUsageByPeriod(today, tomorrow);
    return todayUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0);
  }

  async cleanupOldJobs(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let deletedCount = 0;
    for (const [id, job] of this.jobs.entries()) {
      if (job.createdAt < cutoffDate && (job.status === 'completed' || job.status === 'failed')) {
        this.jobs.delete(id);
        deletedCount++;
      }
    }

    console.log(`🧹 Cleaned up ${deletedCount} old jobs`);
    return deletedCount;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // MIGRATION HELPER: Export data for Prisma migration
  exportData() {
    return {
      jobs: Array.from(this.jobs.values()),
      tokenUsage: this.tokenUsage,
      queueOrder: this.jobQueue
    };
  }

  // MIGRATION HELPER: Import data from database
  importData(data: { jobs: ExtractionJob[], tokenUsage: TokenUsage[], queueOrder: string[] }) {
    this.jobs.clear();
    data.jobs.forEach(job => this.jobs.set(job.id, job));
    this.tokenUsage = data.tokenUsage;
    this.jobQueue = data.queueOrder;
  }
}