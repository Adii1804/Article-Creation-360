// Fixed imports and refined types, memoized format function and consistent logging with timestamps

const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
} as const;

type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

type LoggableData =
  | string
  | number
  | boolean
  | null
  | undefined
  | Error
  | Record<string, unknown>
  | Array<unknown>;

class AppLogger {
  private isDevelopment = import.meta.env.DEV;
  private enableLogging = import.meta.env.VITE_ENABLE_LOGGING !== 'false';

  private formatMessage(level: LogLevelType, message: string, data?: LoggableData): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (!data) {
      return `${prefix} ${message}`;
    }

    let formattedData: string;
    if (data instanceof Error) {
      formattedData = JSON.stringify({
        name: data.name,
        message: data.message,
        stack: data.stack,
      }, null, 2);
    } else if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      formattedData = String(data);
    } else {
      try {
        formattedData = JSON.stringify(data, null, 2);
      } catch {
        formattedData = '[Unserializable Object]';
      }
    }
    
    return `${prefix} ${message} ${formattedData}`;
  }

  error(message: string, error?: Error | LoggableData): void {
    if (!this.enableLogging && !this.isDevelopment) return;
    const formattedMessage = this.formatMessage(LogLevel.ERROR, message, error);
    console.error(formattedMessage);
  }

  warn(message: string, data?: LoggableData): void {
    if (!this.enableLogging && !this.isDevelopment) return;
    const formattedMessage = this.formatMessage(LogLevel.WARN, message, data);
    console.warn(formattedMessage);
  }

  info(message: string, data?: LoggableData): void {
    if (!this.enableLogging && !this.isDevelopment) return;
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, data);
    console.info(formattedMessage);
  }

  debug(message: string, data?: LoggableData): void {
    if (!this.isDevelopment) return;
    const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, data);
    console.debug(formattedMessage);
  }

  performance(operation: string, duration: number, additionalData?: LoggableData): void {
    if (!this.isDevelopment) return;
    const message = `Performance: ${operation} took ${duration.toFixed(2)}ms`;
    this.debug(message, additionalData);
  }

  table(data: Record<string, unknown>[] | Record<string, unknown>): void {
    if (!this.isDevelopment) return;
    console.table(data);
  }

  group(label: string): void {
    if (!this.isDevelopment) return;
    console.group(label);
  }

  groupEnd(): void {
    if (!this.isDevelopment) return;
    console.groupEnd();
  }

  time(label: string): void {
    if (!this.isDevelopment) return;
    console.time(label);
  }

  timeEnd(label: string): void {
    if (!this.isDevelopment) return;
    console.timeEnd(label);
  }

  logIf(condition: boolean, level: LogLevelType, message: string, data?: LoggableData): void {
    if (!condition) return;
    switch (level) {
      case LogLevel.ERROR:
        this.error(message, data);
        break;
      case LogLevel.WARN:
        this.warn(message, data);
        break;
      case LogLevel.INFO:
        this.info(message, data);
        break;
      case LogLevel.DEBUG:
        this.debug(message, data);
        break;
      default:
        this.info(message, data);
    }
  }

  logApiRequest(method: string, url: string, data?: LoggableData): void {
    this.debug(`API ${method.toUpperCase()} ${url}`, data);
  }

  logApiResponse(method: string, url: string, status: number, data?: LoggableData): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.DEBUG;
    this.logIf(true, level, `API ${method.toUpperCase()} ${url} - ${status}`, data);
  }

  logError(error: Error, context?: string, additionalData?: Record<string, unknown>): void {
    const errorData = {
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...additionalData
    };
    this.error(`Error in ${context || 'application'}`, errorData);
  }

  measurePerformance<T>(
    operation: string,
    fn: () => T,
    additionalData?: LoggableData
  ): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.performance(operation, duration, additionalData);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${operation} failed after ${duration.toFixed(2)}ms`, error as LoggableData);
      throw error;
    }
  }

  async measurePerformanceAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    additionalData?: LoggableData
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.performance(operation, duration, additionalData);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${operation} failed after ${duration.toFixed(2)}ms`, error as LoggableData);
      throw error;
    }
  }
}

export const logger = new AppLogger();

export const createLogger = (namespace: string) => ({
  error: (message: string, data?: LoggableData) =>
    logger.error(`[${namespace}] ${message}`, data),
  warn: (message: string, data?: LoggableData) =>
    logger.warn(`[${namespace}] ${message}`, data),
  info: (message: string, data?: LoggableData) =>
    logger.info(`[${namespace}] ${message}`, data),
  debug: (message: string, data?: LoggableData) =>
    logger.debug(`[${namespace}] ${message}`, data),
});

export type AppLoggerType = typeof logger;
export type NamespacedLogger = ReturnType<typeof createLogger>;
export type { LoggableData };
