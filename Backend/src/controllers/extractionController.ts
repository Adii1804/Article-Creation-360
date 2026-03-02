import { Request, Response, NextFunction } from 'express';
import { ExtractionService } from '../services/extractionService';
import { ImageProcessor } from '../utils/imageProcessor';
import { cacheService } from '../services/cacheService';
import { sessionCostTracker } from '../services/sessionCostTracker';
import type { SchemaItem, ExtractionRequest } from '../types/extraction';

export class ExtractionController {
  private extractionService = new ExtractionService();

  extractFromUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No image file provided',
          timestamp: Date.now()
        });
        return;
      }

      // Validate the image file
      ImageProcessor.validateImageFile(req.file);

      // Parse the request body
      const { schema, categoryName, customPrompt, discoveryMode } = req.body;
      
      if (!schema) {
        res.status(400).json({
          success: false,
          error: 'Schema is required',
          timestamp: Date.now()
        });
        return;
      }

      let parsedSchema: SchemaItem[];
      try {
        parsedSchema = typeof schema === 'string' ? JSON.parse(schema) : schema;
      } catch (error) {
        res.status(400).json({
          success: false,
          error: 'Invalid schema format',
          timestamp: Date.now()
        });
        return;
      }

      // Convert image to base64
      const base64Image = await ImageProcessor.processImageToBase64(req.file);

      // Extract attributes
      const result = discoveryMode === 'true' || discoveryMode === true
        ? await this.extractionService.extractWithDiscovery(
            base64Image,
            parsedSchema,
            categoryName
          )
        : await this.extractionService.extractAttributes(
            base64Image,
            parsedSchema,
            customPrompt,
            categoryName
          );

      // Track cost in session
      if (result.inputTokens && result.outputTokens) {
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const imageName = req.file?.originalname || 'uploaded_image';
        sessionCostTracker.addImageCost(
          imageId,
          imageName,
          result.inputTokens,
          result.outputTokens,
          result.modelUsed,
          '',
          result.processingTime
        );
      }

      res.json({
        success: true,
        data: result,
        timestamp: Date.now()
      });

    } catch (error) {
      next(error);
    }
  };

  extractFromBase64 = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { image, schema, categoryName, customPrompt, discoveryMode, forceRefresh }: ExtractionRequest = req.body;

      if (!image) {
        res.status(400).json({
          success: false,
          error: 'Base64 image is required',
          timestamp: Date.now()
        });
        return;
      }

      if (!schema) {
        res.status(400).json({
          success: false,
          error: 'Schema is required',
          timestamp: Date.now()
        });
        return;
      }

      // 🔧 OPTIMIZED: Use single method with discovery flag for consistency
      console.log(`🔍 Extraction Request - Discovery Mode: ${discoveryMode}, Schema Items: ${schema.length}, Force Refresh: ${forceRefresh}`);
      
      // � CACHING DISABLED - Always fetch fresh results
      const shouldUseCache = false; // Disabled caching
      
      // Cache checking code removed - always perform fresh extraction
      
      const result = await this.extractionService.extractWithDiscovery(
        image,
        schema,
        categoryName,
        discoveryMode || false // Ensure boolean, default to false
      );
      // Track cost in session
      if (result.inputTokens && result.outputTokens) {
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionCostTracker.addImageCost(
          imageId,
          'extracted_image',
          result.inputTokens,
          result.outputTokens,
          result.modelUsed,
          '',
          result.processingTime
        );
      }
      // � CACHING DISABLED - No caching of extraction results
      // const shouldCacheResult = false; // Disabled caching

      console.log('✅ Extraction successful, sending result with attributes:', Object.keys(result.attributes).length);
      console.log('📊 Sample attribute data:', Object.entries(result.attributes).slice(0, 2));

      res.json({
        success: true,
        data: result,
        metadata: {
          cached: false
        },
        timestamp: Date.now()
      });

    } catch (error) {
      next(error);
    }
  };

  extractWithDebug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { image, schema, categoryName }: ExtractionRequest = req.body;

      if (!image || !schema) {
        res.status(400).json({
          success: false,
          error: 'Image and schema are required',
          timestamp: Date.now()
        });
        return;
      }

      const result = await this.extractionService.extractWithDebug(
        image,
        schema,
        categoryName
      );

      res.json({
        success: true,
        data: result,
        timestamp: Date.now()
      });

    } catch (error) {
      next(error);
    }
  };

  healthCheck = async (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'AI Fashion Extractor API is running',
      timestamp: Date.now(),
      version: '1.0.0'
    });
  };
}