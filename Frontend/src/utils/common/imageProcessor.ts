import { logger } from './logger';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxSizeKB?: number;
}

export interface CompressionResult {
  success: boolean;
  compressedBase64?: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  error?: string;
}

/**
 * Centralized image processing utility
 * Consolidates all image compression logic from multiple files
 */
export class ImageProcessor {
  private static readonly DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8,
    format: 'jpeg',
    maxSizeKB: 500,
  };

  /**
   * Compress image using canvas with fallback error handling
   */
  public static async compressImage(
    file: File,
    options: ImageCompressionOptions = {}
  ): Promise<CompressionResult> {
    const startTime = performance.now();
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error(`Invalid file type: ${file.type}`);
      }

      const originalSize = file.size;
      logger.debug('Starting image compression:', {
        fileName: file.name,
        originalSize,
        options: finalOptions,
      });

      // Create image element
      const image = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Load image
      const imageUrl = URL.createObjectURL(file);
      
      try {
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error('Failed to load image'));
          image.src = imageUrl;
        });

        // Calculate dimensions
        const { width: newWidth, height: newHeight } = this.calculateDimensions(
          image.width,
          image.height,
          finalOptions.maxWidth,
          finalOptions.maxHeight
        );

        // Set canvas size
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx.drawImage(image, 0, 0, newWidth, newHeight);
        
        // Get compressed base64
        const mimeType = `image/${finalOptions.format}`;
        const compressedBase64 = canvas.toDataURL(mimeType, finalOptions.quality);
        
        // Calculate compressed size
        const compressedSize = Math.round((compressedBase64.length * 3) / 4);
        const compressionRatio = originalSize / compressedSize;

        // Check if size is within limits
        if (compressedSize > finalOptions.maxSizeKB * 1024) {
          // Try with lower quality
          const lowerQuality = Math.max(0.3, finalOptions.quality - 0.2);
          const retryResult = await this.compressImage(file, {
            ...finalOptions,
            quality: lowerQuality,
          });
          
          if (retryResult.success) {
            return retryResult;
          }
        }

        const processingTime = performance.now() - startTime;
        
        logger.info('Image compression completed:', {
          fileName: file.name,
          originalSize,
          compressedSize,
          compressionRatio: Math.round(compressionRatio * 100) / 100,
          processingTime: Math.round(processingTime),
          dimensions: `${newWidth}x${newHeight}`,
        });

        return {
          success: true,
          compressedBase64,
          originalSize,
          compressedSize,
          compressionRatio,
        };

      } finally {
        // Cleanup
        URL.revokeObjectURL(imageUrl);
        canvas.remove();
      }

    } catch (error) {
      const processingTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown compression error';
      
      logger.error('Image compression failed:', {
        fileName: file.name,
        error: errorMessage,
        processingTime: Math.round(processingTime),
      });

      return {
        success: false,
        originalSize: file.size,
        compressedSize: 0,
        compressionRatio: 1,
        error: errorMessage,
      };
    }
  }

  /**
   * Create image preview URL with cleanup tracking
   */
  public static createImagePreview(file: File): { url: string; cleanup: () => void } {
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);
    
    // Auto-cleanup after 10 minutes to prevent memory leaks
    const timeoutId = setTimeout(cleanup, 10 * 60 * 1000);
    
    return {
      url,
      cleanup: () => {
        clearTimeout(timeoutId);
        cleanup();
      },
    };
  }

  /**
   * Validate image file type and size
   */
  public static validateImageFile(
    file: File,
    maxSizeMB: number = 10,
    allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
  ): { valid: boolean; error?: string } {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum size: ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Calculate new dimensions maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let newWidth = originalWidth;
    let newHeight = originalHeight;

    // Scale down if needed
    if (newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  }

  /**
   * Get image metadata without loading full image
   */
  public static async getImageMetadata(file: File): Promise<{
    width: number;
    height: number;
    aspectRatio: number;
    sizeKB: number;
  }> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: image.width,
          height: image.height,
          aspectRatio: image.width / image.height,
          sizeKB: Math.round(file.size / 1024),
        });
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for metadata extraction'));
      };

      image.src = url;
    });
  }
}

// Legacy compatibility exports (for gradual migration)
export const compressImage = ImageProcessor.compressImage.bind(ImageProcessor);
export const createImagePreview = ImageProcessor.createImagePreview.bind(ImageProcessor);
export const validateImageFile = ImageProcessor.validateImageFile.bind(ImageProcessor);
