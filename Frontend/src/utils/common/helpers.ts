// Type-safe utility functions - NO any types allowed

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // Ensure we don't exceed array bounds
  const sizeIndex = Math.min(i, sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2)) + ' ' + sizes[sizeIndex];
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// ✅ FIX: Type-safe debounce function - NO any types
export function debounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  wait: number
): (...args: TArgs) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: TArgs): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ✅ FIX: Type-safe debounce for functions with return values
export function debounceWithReturn<TArgs extends unknown[], TReturn>(
  func: (...args: TArgs) => TReturn,
  wait: number
): (...args: TArgs) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: TArgs): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// ✅ Additional type-safe utility functions
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const hasProperty = <T extends object, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

// Type-safe validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Type-safe array utilities
export const removeDuplicates = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const groupBy = <T, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> => {
  return array.reduce((groups: Record<string, T[]>, item: T) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
};

// Type-safe object manipulation
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

// Type-safe number utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Type-safe string utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const kebabCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

export const camelCase = (str: string): string => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
};

// Type-safe date utilities
export const formatDate = (date: Date, format = 'yyyy-mm-dd'): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return format
    .replace('yyyy', String(year))
    .replace('mm', month)
    .replace('dd', day);
};

export const isDateValid = (date: Date): boolean => {
  return !isNaN(date.getTime());
};

// Type-safe promise utilities
export const timeout = <T>(
  promise: Promise<T>,
  ms: number,
  message = 'Promise timed out'
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeoutPromise]);
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === maxAttempts) {
        throw lastError;
      }
      await sleep(delay);
      delay *= 2; // Exponential backoff
    }
  }
  throw lastError!;
};

// Type-safe local storage utilities
export const safeLocalStorage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },
};

// Type guards
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

export const isNullOrUndefined = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

// Image processing utilities
export const compressImage = async (file: File, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 600;
      
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = height * (MAX_WIDTH / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = width * (MAX_HEIGHT / height);
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file);
};
