import type { ApiResponse } from '../types/common';

export class BaseApiService {
  protected baseURL: string;
  protected apiKey: string;

  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'https://api.openai.com/v1';
    this.apiKey = process.env.OPENAI_API_KEY || '';

    if (!this.apiKey) {
      console.warn('⚠️  API key not found. Please add OPENAI_API_KEY to your .env file');
      console.warn('📝 Create a .env file with: OPENAI_API_KEY=your-key-here');
    }
  }

  public isConfigured(): boolean {
    return !!this.apiKey;
  }

  protected async makeRequest<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = 30000
  ): Promise<ApiResponse<T>> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not configured. Please add OPENAI_API_KEY to your .env file.',
        timestamp: Date.now()
      };
    }

    try {
      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            ...options.headers
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as any;
          throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
        }

        const data = await response.json() as T;
        
        return {
          success: true,
          data,
          timestamp: Date.now()
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Check if it's an abort error (timeout)
      if (errorMessage === 'The operation was aborted.') {
        return {
          success: false,
          error: `Request timeout (${timeoutMs}ms)`,
          timestamp: Date.now()
        };
      }
      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      };
    }
  }

  protected async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
    throw new Error('Max retries exceeded');
  }

  protected buildUrl(endpoint: string, params?: Record<string, string | number>): string {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    return url.toString();
  }

  protected handleApiError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}

export const checkApiConfiguration = (): { 
  configured: boolean; 
  message: string;
  suggestions: string[];
} => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      configured: false,
      message: 'OpenAI API key is missing',
      suggestions: [
        'Create a .env file in your backend root',
        'Add: OPENAI_API_KEY=sk-your-key-here',
        'Restart your backend server',
        'Get your key from https://platform.openai.com'
      ]
    };
  }

  if (!apiKey.startsWith('sk-')) {
    return {
      configured: false,
      message: 'Invalid API key format',
      suggestions: [
        'API key should start with "sk-"',
        'Check your .env file for typos',
        'Generate a new key from OpenAI platform'
      ]
    };
  }

  return {
    configured: true,
    message: 'API configuration looks good!',
    suggestions: []
  };
};