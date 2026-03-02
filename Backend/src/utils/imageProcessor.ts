export class ImageProcessor {
  static async processImageToBase64(file: Express.Multer.File): Promise<string> {
    try {
      const imageBuffer = file.buffer;
      const base64String = imageBuffer.toString('base64');
      const mimeType = file.mimetype;
      
      return `data:${mimeType};base64,${base64String}`;
    } catch (error) {
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static validateImageFile(file: Express.Multer.File): void {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '15728640'); // 15MB default

    if (!allowedTypes.includes(file.mimetype)) {
      const fileType = file.mimetype || 'unknown';
      throw new Error(
        `❌ Invalid file type: ${fileType}. ` +
        `Please upload an image in one of these formats: JPEG, PNG, or WebP.`
      );
    }

    if (file.size > maxSize) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
      throw new Error(
        `❌ File size (${fileSizeMB}MB) exceeds the maximum allowed size of ${maxSizeMB}MB. ` +
        `Please compress your image or use a smaller file.`
      );
    }
  }

  static getImageInfo(file: Express.Multer.File) {
    return {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }
}