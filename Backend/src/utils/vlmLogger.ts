/**
 * 📝 VLM Logging Utility
 * Provides consistent, structured logging for the VLM pipeline
 */

export interface VLMLogContext {
  provider?: string;
  stage?: string;
  operation?: string;
  attributes?: number;
  confidence?: number;
  tokensUsed?: number;
  processingTime?: number;
  modelUsed?: string;
  category?: string;
  department?: string;
  [key: string]: any;
}

export class VLMLogger {
  private static formatTimestamp(): string {
    return new Date().toISOString().split('T')[1].split('.')[0];
  }

  private static formatContext(context?: VLMLogContext): string {
    if (!context) return '';
    
    const parts: string[] = [];
    if (context.provider) parts.push(`Provider: ${context.provider}`);
    if (context.stage) parts.push(`Stage: ${context.stage}`);
    if (context.operation) parts.push(`Operation: ${context.operation}`);
    if (context.attributes !== undefined) parts.push(`Attributes: ${context.attributes}`);
    if (context.confidence !== undefined) parts.push(`Confidence: ${context.confidence}%`);
    if (context.tokensUsed !== undefined) parts.push(`Tokens: ${context.tokensUsed}`);
    if (context.processingTime !== undefined) parts.push(`Time: ${context.processingTime}ms`);
    if (context.modelUsed) parts.push(`Model: ${context.modelUsed}`);
    if (context.category) parts.push(`Category: ${context.category}`);
    if (context.department) parts.push(`Department: ${context.department}`);
    
    return parts.length > 0 ? ` | ${parts.join(', ')}` : '';
  }

  /**
   * Log VLM pipeline start
   */
  static logStart(message: string, context?: VLMLogContext): void {
    const timestamp = this.formatTimestamp();
    const contextStr = this.formatContext(context);
    console.log(`[${timestamp}] ${message}${contextStr}`);
  }

  /**
   * ✅ Log successful VLM operations
   */
  static logSuccess(message: string, context?: VLMLogContext): void {
    const timestamp = this.formatTimestamp();
    const contextStr = this.formatContext(context);
    console.log(`[${timestamp}] ✅ ${message}${contextStr}`);
  }

  /**
   * ❌ Log VLM errors
   */
  static logError(message: string, error?: any, context?: VLMLogContext): void {
    const timestamp = this.formatTimestamp();
    const contextStr = this.formatContext(context);
    const errorMsg = error instanceof Error ? error.message : (error || 'Unknown error');
    console.error(`[${timestamp}] ❌ ${message} - ${errorMsg}${contextStr}`);
  }

  /**
   * ⚠️ Log VLM warnings
   */
  static logWarning(message: string, context?: VLMLogContext): void {
    const timestamp = this.formatTimestamp();
    const contextStr = this.formatContext(context);
    console.warn(`[${timestamp}] ⚠️ ${message}${contextStr}`);
  }

  /**
   * 🔍 Log VLM info/debug messages
   */
  static logInfo(message: string, context?: VLMLogContext): void {
    const timestamp = this.formatTimestamp();
    const contextStr = this.formatContext(context);
    console.log(`[${timestamp}] 🔍 ${message}${contextStr}`);
  }

  /**
   * 📊 Log performance metrics
   */
  static logMetrics(message: string, metrics: {
    processingTime: number;
    tokensUsed?: number;
    confidence?: number;
    attributesExtracted?: number;
    modelUsed?: string;
  }, context?: VLMLogContext): void {
    const timestamp = this.formatTimestamp();
    const contextStr = this.formatContext(context);
    
    const metricsParts = [
      `Time: ${metrics.processingTime}ms`,
      metrics.tokensUsed !== undefined ? `Tokens: ${metrics.tokensUsed}` : null,
      metrics.confidence !== undefined ? `Confidence: ${metrics.confidence}%` : null,
      metrics.attributesExtracted !== undefined ? `Attributes: ${metrics.attributesExtracted}` : null,
      metrics.modelUsed ? `Model: ${metrics.modelUsed}` : null
    ].filter(Boolean);

    console.log(`[${timestamp}] 📊 ${message} - ${metricsParts.join(', ')}${contextStr}`);
  }

  /**
   * 🔄 Log provider fallback operations
   */
  static logFallback(fromProvider: string, toProvider: string, reason?: string): void {
    const timestamp = this.formatTimestamp();
    const reasonMsg = reason ? ` (${reason})` : '';
    console.log(`[${timestamp}] 🔄 Provider fallback: ${fromProvider} → ${toProvider}${reasonMsg}`);
  }

  /**
   * 🏥 Log provider health checks
   */
  static logHealthCheck(provider: string, isHealthy: boolean, checkTime: number, error?: any): void {
    const timestamp = this.formatTimestamp();
    const status = isHealthy ? '✅ HEALTHY' : '❌ UNAVAILABLE';
    const errorMsg = error ? ` - ${error instanceof Error ? error.message : error}` : '';
    console.log(`[${timestamp}] 🏥 ${provider}: ${status} (${checkTime}ms)${errorMsg}`);
  }

  /**
   * Log model-specific operations
   */
  static logModelOperation(model: string, operation: string, details?: any): void {
    const timestamp = this.formatTimestamp();
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[${timestamp}] [${model.toUpperCase()}] ${operation}${detailsStr}`);
  }

  /**
   * 📈 Log pipeline stage transitions
   */
  static logStageTransition(fromStage: string, toStage: string, reason?: string): void {
    const timestamp = this.formatTimestamp();
    const reasonMsg = reason ? ` (${reason})` : '';
    console.log(`[${timestamp}] 📈 Stage transition: ${fromStage} → ${toStage}${reasonMsg}`);
  }
}