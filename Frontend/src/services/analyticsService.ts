import type { ExtractionStatus, ModelType } from '../types/core/CommonTypes';

export interface ExtractionRecord {
  id: string;
  fileName: string;
  status: ExtractionStatus;
  tokensUsed: number;
  modelUsed: ModelType;
  extractionTime: number;
  confidence: number;
  category?: string;
  timestamp: Date;
  error?: string;
}

export interface AnalyticsStats {
  totalExtractions: number;
  completed: number;
  failed: number;
  processing: number;
  avgProcessingTime: number;
  totalTokensUsed: number;
  avgConfidence: number;
  totalCost: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  tokensUsed: number;
  avgConfidence: number;
  cost: number;
}

export interface TimeSeriesData {
  date: string;
  extractions: number;
  completed: number;
  failed: number;
  tokensUsed: number;
  cost: number;
}

export interface ModelUsageStats {
  model: ModelType;
  count: number;
  tokensUsed: number;
  cost: number;
  avgProcessingTime: number;
}

class AnalyticsService {
  private readonly STORAGE_KEY = 'extraction_history';

  // Save extraction record to localStorage
  saveExtraction(record: Omit<ExtractionRecord, 'id' | 'timestamp'>): void {
    const history = this.getHistory();
    const newRecord: ExtractionRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    history.push(newRecord);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }

  // Get all extraction history
  getHistory(): ExtractionRecord[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    
    try {
      const parsed = JSON.parse(data);
      return parsed.map((record: ExtractionRecord) => ({
        ...record,
        timestamp: new Date(record.timestamp),
      }));
    } catch {
      return [];
    }
  }

  // Filter history by date range
  getHistoryByDateRange(startDate: Date, endDate: Date): ExtractionRecord[] {
    const history = this.getHistory();
    return history.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= startDate && recordDate <= endDate;
    });
  }

  // Filter history by category
  getHistoryByCategory(category: string): ExtractionRecord[] {
    if (category === 'all') return this.getHistory();
    return this.getHistory().filter(record => record.category === category);
  }

  // Get overall statistics
  getStats(history?: ExtractionRecord[]): AnalyticsStats {
    const records = history || this.getHistory();
    
    if (records.length === 0) {
      return {
        totalExtractions: 0,
        completed: 0,
        failed: 0,
        processing: 0,
        avgProcessingTime: 0,
        totalTokensUsed: 0,
        avgConfidence: 0,
        totalCost: 0,
      };
    }

    const completed = records.filter(r => r.status === 'Done');
    const failed = records.filter(r => r.status === 'Error');
    const processing = records.filter(r => r.status === 'Extracting' || r.status === 'Processing');

    const totalTokens = records.reduce((sum, r) => sum + (r.tokensUsed || 0), 0);
    const totalTime = completed.reduce((sum, r) => sum + (r.extractionTime || 0), 0);
    const totalConfidence = completed.reduce((sum, r) => sum + (r.confidence || 0), 0);
    
    // Calculate total cost based on model used
    const totalCost = this.calculateTotalCost(records);

    return {
      totalExtractions: records.length,
      completed: completed.length,
      failed: failed.length,
      processing: processing.length,
      avgProcessingTime: completed.length > 0 ? totalTime / completed.length : 0,
      totalTokensUsed: totalTokens,
      avgConfidence: completed.length > 0 ? totalConfidence / completed.length : 0,
      totalCost,
    };
  }

  // Get category breakdown
  getCategoryStats(history?: ExtractionRecord[]): CategoryStats[] {
    const records = history || this.getHistory();
    const categoryMap = new Map<string, ExtractionRecord[]>();

    records.forEach(record => {
      const category = record.category || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(record);
    });

    return Array.from(categoryMap.entries()).map(([category, records]) => {
      const tokensUsed = records.reduce((sum, r) => sum + (r.tokensUsed || 0), 0);
      const completedRecords = records.filter(r => r.status === 'Done');
      const avgConfidence = completedRecords.length > 0
        ? completedRecords.reduce((sum, r) => sum + (r.confidence || 0), 0) / completedRecords.length
        : 0;
      const cost = this.calculateTotalCost(records);

      return {
        category,
        count: records.length,
        tokensUsed,
        avgConfidence,
        cost,
      };
    });
  }

  // Get time series data (daily aggregation)
  getTimeSeriesData(days: number = 30): TimeSeriesData[] {
    const history = this.getHistory();
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const dateMap = new Map<string, ExtractionRecord[]>();

    // Initialize all dates
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dateMap.set(dateKey, []);
    }

    // Group records by date
    history.forEach(record => {
      const recordDate = new Date(record.timestamp);
      if (recordDate >= startDate) {
        const dateKey = recordDate.toISOString().split('T')[0];
        if (dateMap.has(dateKey)) {
          dateMap.get(dateKey)!.push(record);
        }
      }
    });

    // Convert to time series data
    return Array.from(dateMap.entries()).map(([date, records]) => ({
      date,
      extractions: records.length,
      completed: records.filter(r => r.status === 'Done').length,
      failed: records.filter(r => r.status === 'Error').length,
      tokensUsed: records.reduce((sum, r) => sum + (r.tokensUsed || 0), 0),
      cost: this.calculateTotalCost(records),
    }));
  }

  // Get model usage statistics
  getModelUsageStats(history?: ExtractionRecord[]): ModelUsageStats[] {
    const records = history || this.getHistory();
    const modelMap = new Map<ModelType, ExtractionRecord[]>();

    records.forEach(record => {
      const model = record.modelUsed || 'gpt-4o';
      if (!modelMap.has(model)) {
        modelMap.set(model, []);
      }
      modelMap.get(model)!.push(record);
    });

    return Array.from(modelMap.entries()).map(([model, records]) => {
      const completedRecords = records.filter(r => r.status === 'Done');
      const totalTime = completedRecords.reduce((sum, r) => sum + (r.extractionTime || 0), 0);

      return {
        model,
        count: records.length,
        tokensUsed: records.reduce((sum, r) => sum + (r.tokensUsed || 0), 0),
        cost: this.calculateTotalCost(records),
        avgProcessingTime: completedRecords.length > 0 ? totalTime / completedRecords.length : 0,
      };
    });
  }

  // Calculate total cost from records
  private calculateTotalCost(records: ExtractionRecord[]): number {
    return records.reduce((sum, record) => {
      const model = record.modelUsed || 'gpt-4o';
      const tokens = record.tokensUsed || 0;
      
      // Pricing per 1K tokens (input + output averaged)
      const pricing: Record<string, number> = {
        'gpt-4-vision-preview': 0.02, // Average of $0.01 + $0.03
        'gpt-4o': 0.00625,            // Average of $0.0025 + $0.01
        'gpt-4o-mini': 0.000375,      // Average of $0.00015 + $0.0006
        'gpt-3.5-turbo': 0.001,       // Average of $0.0005 + $0.0015
      };

      const pricePerToken = (pricing[model] || pricing['gpt-4o']) / 1000;
      return sum + (tokens * pricePerToken);
    }, 0);
  }

  // Clear all history (for testing)
  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Export data as JSON
  exportToJSON(): string {
    const history = this.getHistory();
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalRecords: history.length,
      stats: this.getStats(),
      categoryStats: this.getCategoryStats(),
      modelUsage: this.getModelUsageStats(),
      records: history,
    }, null, 2);
  }
}

export const analyticsService = new AnalyticsService();
