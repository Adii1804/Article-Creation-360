/**
 * 🔒 Input Sanitization Utilities
 * Protects against XSS and injection attacks
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'p', 'br'],
    ALLOWED_ATTR: ['class', 'style'],
  });
};

/**
 * Sanitize text input (removes all HTML)
 */
export const sanitizeText = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

/**
 * Sanitize category/attribute codes (alphanumeric + underscore only)
 */
export const sanitizeCode = (code: string): string => {
  return code.replace(/[^a-zA-Z0-9_-]/g, '');
};

/**
 * Sanitize file names
 */
export const sanitizeFileName = (fileName: string): string => {
  // Remove path traversal attempts
  const baseName = fileName.replace(/^.*[\\/]/, '');
  // Allow only safe characters
  return baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

/**
 * Sanitize URL parameters
 */
export const sanitizeUrlParam = (param: string): string => {
  return encodeURIComponent(DOMPurify.sanitize(param, { ALLOWED_TAGS: [] }));
};

/**
 * Validate and sanitize JSON
 */
export const sanitizeJson = <T>(input: string): T | null => {
  try {
    const sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
    return JSON.parse(sanitized) as T;
  } catch {
    return null;
  }
};

/**
 * Sanitize object properties recursively
 */
export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): T => {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeText(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value as Record<string, unknown>) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : 
        typeof item === 'object' ? sanitizeObject(item as Record<string, unknown>) : item
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }
  
  return sanitized;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Rate limiting helper (client-side)
 */
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
  
  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
  
  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return oldestRequest + this.windowMs;
  }
}

/**
 * Security headers validator
 */
export const validateSecurityHeaders = (headers: Headers): boolean => {
  const requiredHeaders = [
    'content-type',
  ];
  
  return requiredHeaders.every(header => headers.has(header));
};

/**
 * SQL injection pattern detector (for extra validation)
 */
export const hasSqlInjectionPattern = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/|xp_|sp_)/i,
    /('|")(.*?)(\1)/i, // String concatenation attempts
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * XSS pattern detector
 */
export const hasXssPattern = (input: string): boolean => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

export default {
  sanitizeHtml,
  sanitizeText,
  sanitizeCode,
  sanitizeFileName,
  sanitizeUrlParam,
  sanitizeJson,
  sanitizeObject,
  isValidEmail,
  isValidUrl,
  RateLimiter,
  validateSecurityHeaders,
  hasSqlInjectionPattern,
  hasXssPattern,
};
