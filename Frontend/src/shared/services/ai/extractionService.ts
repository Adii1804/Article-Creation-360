import type {
  SchemaItem,
  ExtractionResult,
  EnhancedExtractionResult
} from "../../types/extraction/ExtractionTypes";
import { logger } from "../../utils/common/logger";
import { BackendApiService } from "../../../services/api/backendApi";


export class ExtractionService {
  private backendApi = new BackendApiService();
  private compressImage: (file: File) => Promise<string>;

  constructor(compressImageFn: (file: File) => Promise<string>) {
    this.compressImage = compressImageFn;
  }

  async extractAttributes(
    file: File,
    schema: SchemaItem[],
    customPrompt?: string,
    categoryName?: string
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    try {
      const base64Image = await this.compressImage(file);

      logger.info("Starting AI extraction via backend", {
        fileName: file.name,
        schemaSize: schema.length,
      });

      const result = await this.backendApi.extractFromBase64({
        image: base64Image,
        schema,
        customPrompt,
        categoryName,
        discoveryMode: false
      });

      const processingTime = Date.now() - startTime;

      logger.info("Extraction completed successfully", {
        fileName: file.name,
        processingTime,
        tokensUsed: result.tokensUsed,
        confidence: result.confidence,
      });

      return {
        attributes: result.attributes,
        tokensUsed: result.tokensUsed,
        modelUsed: result.modelUsed,
        processingTime: result.processingTime,
        confidence: result.confidence
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error("Extraction failed", {
        fileName: file.name,
        processingTime,
        error,
      });
      throw error;
    }
  }

  async extractWithDiscovery(
    file: File,
    schema: SchemaItem[],
    categoryName?: string,
    discoveryMode = false
  ): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();
    try {
      const base64Image = await this.compressImage(file);

      logger.info("Starting enhanced AI extraction via backend", {
        fileName: file.name,
        schemaSize: schema.length,
        discoveryMode,
        category: categoryName,
      });

      const result = await this.backendApi.extractFromBase64({
        image: base64Image,
        schema,
        categoryName,
        discoveryMode
      });

      if (result.discoveries && result.discoveries.length > 0) {
        const { discoveryManager } = await import("./discovery/discoveryManager");
        discoveryManager.addDiscoveries(result.discoveries, categoryName);
      }

      const updatedProcessingTime = Date.now() - startTime;

      logger.info("Enhanced extraction completed", {
        fileName: file.name,
        processingTime: updatedProcessingTime,
        tokensUsed: result.tokensUsed,
        confidence: result.confidence,
        discoveries: result.discoveries?.length ?? 0,
        highConfidenceDiscoveries: result.discoveryStats?.highConfidence ?? 0,
        discoveryMode,
      });

      return {
        ...result,
        processingTime: updatedProcessingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error("Enhanced extraction failed", {
        fileName: file.name,
        processingTime,
        discoveryMode,
        error,
      });
      throw error;
    }
  }
}
