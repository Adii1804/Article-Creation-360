import type {
  SchemaItem,
  ExtractionResult,
  AttributeData,
  DiscoveredAttribute,
  EnhancedExtractionResult
} from "../types/extraction";
import { PromptService } from "./promptService";
import { ApiService } from "./apiService";
import { ResponseParser } from "./responseParser";

export class ExtractionService {
  private promptService = new PromptService();
  private responseParser = new ResponseParser();
  private apiService = new ApiService();

  async extractAttributes(
    base64Image: string,
    schema: SchemaItem[],
    customPrompt?: string,
    categoryName?: string
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      let prompt: string;
      if (customPrompt) {
        prompt = customPrompt;
      } else if (categoryName) {
        prompt = this.promptService.generateCategorySpecificPrompt(schema, categoryName);
      } else {
        prompt = this.promptService.generateGenericPrompt(schema);
      }

      const apiResponse = await this.apiService.callVisionAPI(base64Image, prompt);
      const attributes = await this.responseParser.parseResponse(apiResponse.content, schema);
      
      const processingTime = Date.now() - startTime;
      const confidence = this.calculateOverallConfidence(attributes);

      return {
        attributes,
        tokensUsed: apiResponse.tokensUsed,
        modelUsed: apiResponse.modelUsed,
        processingTime,
        confidence,
        inputTokens: apiResponse.inputTokens,
        outputTokens: apiResponse.outputTokens
      };
    } catch (error) {
      console.error('Extraction failed:', error);
      throw new Error(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractWithDiscovery(
    base64Image: string,
    schema: SchemaItem[],
    categoryName?: string,
    discoveryMode = false,
    department?: string,
    subDepartment?: string
  ): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();

    try {
      // � TOKEN OPTIMIZATION: Use schema-driven prompts with department context
      const prompt = discoveryMode 
        ? this.promptService.generateDiscoveryPrompt(schema, categoryName)
        : this.promptService.generateOptimizedPrompt(schema, categoryName, department, subDepartment);

      console.log(`🔍 Optimized API Call - Discovery: ${discoveryMode}, Prompt: ${prompt.length} chars, Schema: ${schema.length} attrs`);
      
      const apiResponse = await this.apiService.callVisionAPI(base64Image, prompt);
      
      let attributes: AttributeData;
      let discoveries: DiscoveredAttribute[] = [];

      if (discoveryMode) {
        // Only parse enhanced response when discovery is enabled
        const result = await this.responseParser.parseEnhancedResponse(apiResponse.content, schema);
        attributes = result.attributes;
        discoveries = result.discoveries;
        console.log(`✨ Discovery Results: ${discoveries.length} discoveries found`);
      } else {
        // Use lightweight parsing for basic extraction
        attributes = await this.responseParser.parseResponse(apiResponse.content, schema);
        console.log(` Basic Extraction: ${Object.keys(attributes).length} attributes extracted`);
      }

      const processingTime = Date.now() - startTime;
      const confidence = this.calculateOverallConfidence(attributes);

      // 🔧 OPTIMIZATION: Only calculate discovery stats when discoveries exist
      const discoveryStats = discoveryMode && discoveries.length > 0 ? {
        totalFound: discoveries.length,
        highConfidence: discoveries.filter(d => d.confidence >= 80).length,
        schemaPromotable: discoveries.filter(d => d.isPromotable).length,
        uniqueKeys: new Set(discoveries.map(d => d.key)).size
      } : {
        totalFound: 0,
        highConfidence: 0,
        schemaPromotable: 0,
        uniqueKeys: 0
      };

      console.log(`⏱️ Processing Complete - Time: ${processingTime}ms, Tokens: ${apiResponse.tokensUsed}, Confidence: ${confidence}%`);

      return {
        attributes,
        tokensUsed: apiResponse.tokensUsed,
        modelUsed: apiResponse.modelUsed,
        processingTime,
        confidence,
        inputTokens: apiResponse.inputTokens,
        outputTokens: apiResponse.outputTokens,
        discoveries: discoveryMode ? discoveries : [], // Only return discoveries when enabled
        discoveryStats
      };
    } catch (error) {
      console.error('Enhanced extraction failed:', error);
      throw new Error(`Enhanced extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractWithDebug(
    base64Image: string,
    schema: SchemaItem[],
    categoryName?: string
  ): Promise<EnhancedExtractionResult & { debugInfo?: unknown }> {
    const baseResult = await this.extractWithDiscovery(base64Image, schema, categoryName, true);
    try {
      const prompt = this.promptService.generateDiscoveryPrompt(schema, categoryName);
      const aiResponse = await this.apiService.callVisionAPI(base64Image, prompt);

      const { debugInfo } = await this.responseParser.parseWithDebugInfo(
        aiResponse.content,
        schema
      );

      return { ...baseResult, debugInfo };
    } catch (error) {
      return {
        ...baseResult,
        debugInfo: {
          error: "Debug info extraction failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  private calculateOverallConfidence(attributes: AttributeData): number {
    const confidenceValues = Object.values(attributes)
      .filter(attr => attr !== null)
      .map(attr => attr!.visualConfidence)
      .filter(conf => conf > 0);

    if (confidenceValues.length === 0) return 0;

    const average = confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length;
    return Math.round(average);
  }
}