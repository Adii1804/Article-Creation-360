export class ImageCompressionService {
  destroy() {
    // No operation on destroy to avoid errors
    console.info('ImageCompressionService.destroy() called - no resources to clean.');
  }

  compressImage: ((file: File, options: { quality: number; maxWidth: number; maxHeight: number }) => Promise<string>) | undefined;
  
  async compressImageFallback(
    file: File,
    options: { quality: number; maxWidth: number; maxHeight: number }
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      if (!ctx) {
        reject(new Error('Cannot get canvas 2D context'));
        return;
      }

      img.onload = () => {
        try {
          const ratio = Math.min(
            options.maxWidth / img.width,
            options.maxHeight / img.height,
            1
          );

          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', options.quality);
          resolve(compressedDataUrl);
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = () => reject(new Error('Image failed to load'));

      const reader = new FileReader();
      reader.onload = event => {
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });
  }
}
