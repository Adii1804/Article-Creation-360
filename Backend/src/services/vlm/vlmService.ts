
import { SchemaItem, AttributeData, EnhancedExtractionResult } from '../../types/extraction';
import { OpenAIVLMProvider } from './providers/openaiProvider';
import { ClaudeVLMProvider } from './providers/claudeProvider';
import { GoogleVisionProvider } from './providers/googleVisionProvider';
// Disabled providers (deprecated endpoints or unavailable):
// import { HuggingFaceVLMProvider } from './providers/huggingfaceProvider';
// import { OllamaVLMProvider } from './providers/ollamaProvider';
// import { FashionCLIPProvider } from './providers/fashionClipProvider';

import { MultiModelFusionService } from './MultiModelFusionService';
import { FashionExtractionRequest, VLMProvider } from '@/types/vlm';

export class VLMService {
  private readonly providers: Map<string, VLMProvider> = new Map();
  private fallbackChain: string[] = [];
  private readonly fusionService: MultiModelFusionService;

  constructor() {
    this.initializeProviders();
    this.setupFallbackChain();
    this.fusionService = new MultiModelFusionService();
  }

  private initializeProviders(): void {
    // Primary providers - only OpenAI, Claude, and Google
    this.providers.set('openai-gpt4v', new OpenAIVLMProvider());
    this.providers.set('claude-sonnet', new ClaudeVLMProvider());
    this.providers.set('google-gemini', new GoogleVisionProvider());
    // Disabled providers (deprecated endpoints or unavailable):
    // this.providers.set('huggingface-llava', new HuggingFaceVLMProvider());
    // this.providers.set('ollama-llava', new OllamaVLMProvider());
    // this.providers.set('fashion-clip', new FashionCLIPProvider());
  }

  private setupFallbackChain(): void {
    this.fallbackChain = [
      'google-gemini',     // Fast and cost-effective (free tier available) - WORKING!
      'claude-sonnet',     // High quality alternative (requires credits)
      'openai-gpt4v'      // Most reliable primary (requires credits)
    ];
  }

  /**
   * ENHANCED EXTRACTION with Multi-VLM Pipeline
   * Supports two modes:
   * 1. FALLBACK MODE (default): Use one model, fallback to others if it fails
   * 2. FUSION MODE: Use multiple models and combine their results
   */
  async extractFashionAttributes(
    request: FashionExtractionRequest,
    options?: {
      useFusion?: boolean;
      fusionMode?: 'voting' | 'confidence-weighted' | 'best-only';
      fusionModels?: string[]; // Which models to use for fusion
    }
  ): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();

    console.log(`\n========== VLM EXTRACTION STARTED ==========`);
    console.log(`📊 Schema Items: ${request.schema.length}, Discovery: ${request.discoveryMode}`);
    console.log(`Category: ${request.categoryName || 'Unknown'}`);
    console.log(`🏷️ Department: ${request.department || 'Not specified'} / ${request.subDepartment || 'Not specified'}`);
    console.log(`🔧 Available Providers: ${Array.from(this.providers.keys()).join(', ')}`);

    // Check if fusion mode is enabled
    if (options?.useFusion) {
      console.log(`\n🔀 FUSION MODE ENABLED`);
      console.log(`   Fusion Strategy: ${options.fusionMode || 'confidence-weighted'}`);
      console.log(`   Models: ${options.fusionModels?.join(', ') || 'auto-select'}`);

      return await this.extractWithMultiModelFusion(request, options);
    }

    console.log(`⛓️  Fallback Chain: ${this.fallbackChain.join(' → ')}`);


    try {
      // Stage 1: Fast Fashion-Specific Detection
      const fashionResult = await this.runFashionSpecificExtraction(request);

      // Stage 2: Detailed Analysis for Missing/Low-Confidence Attributes  
      const enhancedResult = await this.runDetailedAnalysis(request, fashionResult);

      // Stage 3: Discovery Mode (if enabled)
      const finalResult = request.discoveryMode
        ? await this.runDiscoveryAnalysis(request, enhancedResult)
        : enhancedResult;

      const processingTime = Date.now() - startTime;

      console.log(`\n✅ ========== VLM EXTRACTION COMPLETE ==========`);
      console.log(`⏱️  Total Processing Time: ${processingTime}ms`);
      console.log(`Final Model Used: ${finalResult.modelUsed}`);
      console.log(`📈 Final Confidence: ${finalResult.confidence}%`);
      console.log(`🔍 Discoveries Found: ${finalResult.discoveries?.length || 0}`);
      console.log(`💰 Total Tokens Used: ${finalResult.tokensUsed || 0}`);
      console.log(`================================================\n`);

      return {
        ...finalResult,
        processingTime,
        modelUsed: 'multi-vlm-pipeline' as any,
        tokensUsed: finalResult.tokensUsed || 0,
        inputTokens: finalResult.inputTokens || 0,
        outputTokens: finalResult.outputTokens || 0,
        apiCost: finalResult.apiCost || 0
      };

    } catch (error) {
      console.error('❌ Multi-VLM Extraction Failed:', error);

      // Emergency fallback to single best available provider
      return await this.emergencyFallback(request);
    }
  }

  /**
   * 🎨 Stage 1: Fashion-Specific Rapid Extraction
   */
  private async runFashionSpecificExtraction(
    request: FashionExtractionRequest
  ): Promise<Partial<EnhancedExtractionResult>> {
    console.log('🎨 ========== STAGE 1: Fashion-Specific Analysis ==========');

    // Skip Fashion-CLIP for now, go straight to Stage 2
    console.log('❌ Fashion-CLIP provider skipped (use Google Gemini instead)');
    return { attributes: {}, confidence: 0, tokensUsed: 0 };
  }

  /**
   * 🔍 Stage 2: Detailed Analysis for Missing Attributes
   */
  private async runDetailedAnalysis(
    request: FashionExtractionRequest,
    fashionResult: Partial<EnhancedExtractionResult>
  ): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();
    console.log('\n🔍 ========== STAGE 2: Detailed Analysis ==========');

    // Identify low-confidence or missing attributes
    const missingAttributes = this.identifyMissingAttributes(request.schema, fashionResult.attributes || {});

    if (missingAttributes.length === 0) {
      console.log('🎉 All attributes extracted successfully in Stage 1');
      return fashionResult as EnhancedExtractionResult;
    }

    console.log(`🔍 Detailed Analysis needed for ${missingAttributes.length} attributes`);

    // Use multi-model approach: OpenAI, Claude, or Google Vision
    let detailProvider: VLMProvider | undefined;
    let providerId = '';

    // Try providers in order of reliability - ONLY USE GOOGLE GEMINI (working)
    const providerPriority = ['google-gemini']; // Only use working provider
    for (const pid of providerPriority) {
      const provider = this.providers.get(pid);
      if (!provider) {
        console.log(`⚠️ Provider ${pid} not found, skipping`);
        continue;
      }

      try {
        const healthy = await provider.isHealthy();
        console.log(`🔍 Checking ${pid} health: ${healthy ? 'HEALTHY' : 'UNAVAILABLE'}`);
        if (healthy) {
          detailProvider = provider;
          providerId = pid;
          break;
        }
      } catch (error) {
        console.warn(`⚠️ Health check failed for ${pid}:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }

    if (!detailProvider) {
      console.log('❌ No detailed analysis provider available, returning Stage 1 results');
      return fashionResult as EnhancedExtractionResult;
    }

    console.log(`[MODEL: ${providerId.toUpperCase()}] Starting detailed analysis`);
    console.log('📋 Detailed Analysis Processing:', {
      provider: providerId,
      missingAttributes: missingAttributes.length,
      existingAttributes: Object.keys(fashionResult.attributes || {}).length,
      processingMode: 'detailed-analysis'
    });

    const detailResult = await detailProvider.extractAttributes({
      ...request,
      schema: missingAttributes,
      mode: 'detailed-analysis',
      existingAttributes: fashionResult.attributes
    });

    console.log(`✅ Detailed Analysis Complete: ${Object.keys(detailResult.attributes).length} additional attributes`);
    console.log(`📊 Detailed Analysis Performance:`, {
      model: detailResult.modelUsed || providerId,
      confidence: detailResult.confidence,
      tokensUsed: detailResult.tokensUsed || 0,
      processingTime: `${Date.now() - startTime}ms`
    });

    // Merge results
    const mergedAttributes = {
      ...fashionResult.attributes,
      ...detailResult.attributes
    };

    return {
      attributes: mergedAttributes,
      confidence: this.calculateOverallConfidence(mergedAttributes),
      tokensUsed: (fashionResult.tokensUsed || 0) + (detailResult.tokensUsed || 0),
      inputTokens: (fashionResult.inputTokens || 0) + (detailResult.inputTokens || 0),
      outputTokens: (fashionResult.outputTokens || 0) + (detailResult.outputTokens || 0),
      apiCost: (fashionResult.apiCost || 0) + (detailResult.apiCost || 0),
      modelUsed: 'fashion-clip+llava' as any,
      processingTime: Date.now() - startTime,
      discoveries: [],
      discoveryStats: { totalFound: 0, highConfidence: 0, schemaPromotable: 0, uniqueKeys: 0 }
    };
  }

  /**
   * 🔬 Stage 3: Discovery Analysis (Optional)
   */
  private async runDiscoveryAnalysis(
    request: FashionExtractionRequest,
    baseResult: EnhancedExtractionResult
  ): Promise<EnhancedExtractionResult> {
    console.log('\n🔬 ========== STAGE 3: Discovery Analysis ==========');

    // Use the most capable model for discovery
    const discoveryProvider = this.providers.get('openai-gpt4v') || this.providers.get('huggingface-llava');
    if (!discoveryProvider) {
      console.log('❌ No discovery provider available, skipping discovery analysis');
      return baseResult;
    }

    const providerId = discoveryProvider === this.providers.get('openai-gpt4v') ? 'openai-gpt4v' : 'huggingface-llava';
    console.log(`[MODEL: ${providerId.toUpperCase()}] Starting discovery analysis`);
    console.log('📋 Discovery Processing:', {
      provider: providerId,
      existingAttributes: Object.keys(baseResult.attributes).length,
      discoveryMode: true,
      processingMode: 'discovery-mode'
    });

    const discoveryResult = await discoveryProvider.extractAttributes({
      ...request,
      mode: 'discovery-mode',
      existingAttributes: baseResult.attributes
    });

    console.log(`✅ Discovery Analysis Complete: ${discoveryResult.discoveries?.length || 0} new discoveries`);
    console.log(`📊 Discovery Performance:`, {
      model: discoveryResult.modelUsed || providerId,
      discoveries: discoveryResult.discoveries?.length || 0,
      confidence: discoveryResult.confidence,
      tokensUsed: discoveryResult.tokensUsed || 0
    });

    return {
      ...baseResult,
      discoveries: discoveryResult.discoveries || [],
      discoveryStats: discoveryResult.discoveryStats || baseResult.discoveryStats,
      tokensUsed: baseResult.tokensUsed + (discoveryResult.tokensUsed || 0)
    };
  }

  /**
   * 🚨 Emergency Fallback
   */
  private async emergencyFallback(
    request: FashionExtractionRequest
  ): Promise<EnhancedExtractionResult> {
    console.log('\n🚨 ========== EMERGENCY FALLBACK MODE ==========');
    console.log(`⚠️  Multi-VLM pipeline failed, attempting single-provider fallbacks`);
    console.log(`🔄 Available fallback providers: ${this.fallbackChain.join(' → ')}`);

    for (const providerId of this.fallbackChain) {
      const provider = this.providers.get(providerId);
      if (!provider) {
        console.log(`❌ Provider ${providerId} not available, skipping`);
        continue;
      }

      try {
        console.log(`[FALLBACK: ${providerId.toUpperCase()}] Attempting emergency extraction`);
        const startTime = Date.now();
        const result = await provider.extractAttributes(request);
        const processingTime = Date.now() - startTime;

        console.log(`✅ [FALLBACK: ${providerId.toUpperCase()}] Emergency extraction successful!`);
        console.log(`📊 Fallback Performance: ${Object.keys(result.attributes).length} attributes, ${processingTime}ms, ${result.confidence}% confidence`);
        return result;
      } catch (error) {
        console.warn(`⚠️ [FALLBACK: ${providerId.toUpperCase()}] Failed:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }

    console.error('❌ ========== ALL VLM PROVIDERS FAILED ==========');
    throw new Error('All VLM providers failed');
  }

  /**
   * Helper Methods
   */
  private filterFashionCoreAttributes(schema: SchemaItem[]): SchemaItem[] {
    const fashionCoreKeys = [
      'color', 'fabric', 'pattern', 'style', 'fit', 'size', 'brand',
      'material', 'texture', 'neckline', 'sleeve', 'length', 'closure'
    ];

    return schema.filter(item =>
      fashionCoreKeys.some(key =>
        item.key.toLowerCase().includes(key.toLowerCase()) ||
        item.label.toLowerCase().includes(key.toLowerCase())
      )
    );
  }

  private identifyMissingAttributes(schema: SchemaItem[], attributes: AttributeData): SchemaItem[] {
    return schema.filter(item => {
      const attr = attributes[item.key];
      return !attr || attr.visualConfidence < 70; // Low confidence threshold
    });
  }

  /**
   * 🔀 MULTI-MODEL FUSION EXTRACTION
   * Use multiple AI models and combine their results for better accuracy
   */
  private async extractWithMultiModelFusion(
    request: FashionExtractionRequest,
    options: {
      useFusion?: boolean;
      fusionMode?: 'voting' | 'confidence-weighted' | 'best-only';
      fusionModels?: string[];
    }
  ): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();

    // Determine which models to use
    const modelIds = options.fusionModels || ['openai-gpt4v', 'claude-sonnet', 'google-gemini'];
    const availableProviders: { id: string; provider: VLMProvider }[] = [];

    // Check which providers are healthy
    for (const id of modelIds) {
      const provider = this.providers.get(id);
      if (provider) {
        try {
          const isHealthy = await provider.isHealthy();
          if (isHealthy) {
            availableProviders.push({ id, provider });
            console.log(`✅ ${id} is available for fusion`);
          } else {
            console.log(`⚠️ ${id} is not healthy, skipping`);
          }
        } catch (error) {
          console.log(`❌ ${id} health check failed, skipping`);
        }
      }
    }

    if (availableProviders.length === 0) {
      console.log('❌ No providers available for fusion, falling back to single-model extraction');
      return await this.emergencyFallback(request);
    }

    if (availableProviders.length === 1) {
      console.log('⚠️ Only 1 provider available, using single-model extraction');
      const { id, provider } = availableProviders[0];
      const result = await provider.extractAttributes(request);
      return {
        ...result,
        processingTime: Date.now() - startTime,
        modelUsed: id as any
      };
    }

    // Use fusion service to combine multiple model results
    const fusionMode = options.fusionMode || 'confidence-weighted';
    const fusedResult = await this.fusionService.extractWithFusion(
      availableProviders,
      request,
      fusionMode
    );

    return {
      ...fusedResult,
      processingTime: Date.now() - startTime
    };
  }

  private calculateOverallConfidence(attributes: AttributeData): number {
    const confidenceValues = Object.values(attributes)
      .filter(attr => attr !== null)
      .map(attr => attr.visualConfidence)
      .filter(conf => conf > 0);

    if (confidenceValues.length === 0) return 0;
    return Math.round(confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length);
  }

  /**
   * 📊 Provider Health Check
   */
  async checkProviderHealth(): Promise<Record<string, boolean>> {
    console.log('\n🏥 ========== VLM PROVIDER HEALTH CHECK ==========');
    const health: Record<string, boolean> = {};

    for (const [id, provider] of this.providers) {
      try {
        console.log(`🔍 Checking ${id}...`);
        const startTime = Date.now();
        const isHealthy = await provider.isHealthy();
        const checkTime = Date.now() - startTime;

        health[id] = isHealthy;
        console.log(`${isHealthy ? '✅' : '❌'} ${id}: ${isHealthy ? 'HEALTHY' : 'UNAVAILABLE'} (${checkTime}ms)`);
      } catch (error) {
        health[id] = false;
        console.log(`❌ ${id}: ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const healthyCount = Object.values(health).filter(Boolean).length;
    console.log(`\n📊 Health Check Summary: ${healthyCount}/${this.providers.size} providers healthy`);
    console.log(`🔄 Fallback Chain: ${this.fallbackChain.filter(id => health[id]).join(' → ') || 'No healthy providers'}`);
    console.log('================================================\n');

    return health;
  }

  /**
   * ⚙️ Dynamic Provider Configuration
   */
  async configureProvider(providerId: string, config: any): Promise<void> {
    const provider = this.providers.get(providerId);
    if (provider && 'configure' in provider) {
      await (provider as any).configure(config);
    }
  }
}