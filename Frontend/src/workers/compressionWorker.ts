// Web Worker for image compression - eliminates UI blocking
interface CompressionMessage {
  id: string;
  file: File;
  options: {
    quality: number;
    maxWidth: number;
    maxHeight: number;
  };
}

interface CompressionResponse {
  id: string;
  result?: string;
  error?: string;
  progress?: number;
}

self.onmessage = async (event: MessageEvent<CompressionMessage>) => {
  const { id, file, options } = event.data;
  
  try {
    // Report progress
    self.postMessage({ id, progress: 10 } as CompressionResponse);
    
    // Use OffscreenCanvas for non-blocking compression
    const canvas = new OffscreenCanvas(options.maxWidth, options.maxHeight);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    self.postMessage({ id, progress: 30 } as CompressionResponse);
    
    // Create image bitmap (efficient)
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(
      options.maxWidth / bitmap.width, 
      options.maxHeight / bitmap.height,
      1 // Don't upscale
    );
    
    self.postMessage({ id, progress: 50 } as CompressionResponse);
    
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    
    // Draw and compress
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    
    self.postMessage({ id, progress: 70 } as CompressionResponse);
    
    const blob = await canvas.convertToBlob({ 
      type: 'image/jpeg', 
      quality: options.quality 
    });
    
    self.postMessage({ id, progress: 90 } as CompressionResponse);
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      self.postMessage({ 
        id, 
        result: reader.result as string,
        progress: 100 
      } as CompressionResponse);
    };
    
    reader.onerror = () => {
      self.postMessage({ 
        id, 
        error: 'Failed to convert to base64' 
      } as CompressionResponse);
    };
    
    reader.readAsDataURL(blob);
    
  } catch (error) {
    self.postMessage({ 
      id, 
      error: error instanceof Error ? error.message : 'Unknown compression error' 
    } as CompressionResponse);
  }
};
