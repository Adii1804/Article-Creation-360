import { VLMProvider, FashionExtractionRequest, FashionCLIPConfig } from '../../../types/vlm';
import { EnhancedExtractionResult, AttributeData } from '../../../types/extraction';

export class FashionCLIPProvider implements VLMProvider {
  public readonly name = 'Fashion-CLIP Specialized';
  private config: FashionCLIPConfig;
  // Runtime flag to short-circuit calls when the external API/model is unavailable
  private providerAvailable = true;

  constructor(config?: Partial<FashionCLIPConfig>) {
    this.config = {
      model: 'openai/clip-vit-base-patch32',
      baseUrl: 'https://router.huggingface.co/hf-inference', // Updated from deprecated api-inference endpoint
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
      maxTokens: 1024,
      temperature: 0, // More deterministic for fashion classification
      timeout: 30000,
      ...config
    };
  }

  async extractAttributes(request: FashionExtractionRequest): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`👗 [Fashion-CLIP] Starting fashion-specialized extraction with ${request.schema.length} attributes`);
      console.log(`🔧 Fashion-CLIP Config: Specialized=Fashion, Timeout=${this.config.timeout}ms, Mode=Classification`);
      
      // Fashion-CLIP works best with classification tasks
      const attributes = await this.performFashionClassification(request);
      const confidence = this.calculateConfidence(attributes);

      const processingTime = Date.now() - startTime;
      console.log(`✅ [Fashion-CLIP] Fashion-specialized extraction complete: ${Object.keys(attributes).length} attributes, ${processingTime}ms`);
      console.log(`📊 [Fashion-CLIP] Performance: Confidence=${confidence}%, Fashion-Specialized=True, Speed=Ultra-Fast`);

      return {
        attributes,
        confidence,
        tokensUsed: 50, // Fashion-CLIP uses fewer tokens than text models
        modelUsed: 'fashion-clip',
        processingTime,
        discoveries: [],
        discoveryStats: {
          totalFound: 0,
          highConfidence: 0,
          schemaPromotable: 0,
          uniqueKeys: 0
        }
      };
    } catch (error) {
      console.error('❌ [Fashion-CLIP] Fashion-specialized extraction failed:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error(`Fashion-CLIP extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    // Fashion-CLIP is currently not available - return false to skip and use working providers
    console.log('⚠️ Fashion-CLIP provider disabled - using fallback to working VLM models');
    return false;
  }

  async configure(config: FashionCLIPConfig): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  /**
   * Fashion-specific classification using CLIP
   */
  private async performFashionClassification(request: FashionExtractionRequest): Promise<AttributeData> {
    const attributes: AttributeData = {};
    
    // Group schema items by classification type for efficiency
    const classificationGroups = this.groupSchemaByType(request.schema);
    
    // Process each group with specialized fashion prompts
    for (const [type, items] of Object.entries(classificationGroups)) {
      const results = await this.classifyGroup(request.image, type, items, request.categoryName);
      
      // Merge results into attributes
      for (const [key, result] of Object.entries(results)) {
        attributes[key] = result;
      }
    }
    
    return attributes;
  }

  /**
   * 🏷️ Group schema items by fashion classification type
   */
  private groupSchemaByType(schema: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {
      color: [],
      fabric: [],
      style: [],
      fit: [],
      pattern: [],
      hardware: [],
      general: []
    };

    for (const item of schema) {
      const key = item.key.toLowerCase();
      const label = item.label.toLowerCase();
      
      if (key.includes('color') || label.includes('color')) {
        groups.color.push(item);
      } else if (key.includes('fabric') || key.includes('material') || label.includes('fabric') || label.includes('material')) {
        groups.fabric.push(item);
      } else if (key.includes('style') || key.includes('type') || label.includes('style')) {
        groups.style.push(item);
      } else if (key.includes('fit') || key.includes('size') || label.includes('fit')) {
        groups.fit.push(item);
      } else if (key.includes('pattern') || key.includes('print') || label.includes('pattern')) {
        groups.pattern.push(item);
      } else if (key.includes('hardware') || key.includes('button') || key.includes('zipper')) {
        groups.hardware.push(item);
      } else {
        groups.general.push(item);
      }
    }

    // Remove empty groups
    return Object.fromEntries(Object.entries(groups).filter(([_, items]) => items.length > 0));
  }

  /**
   * 🔍 Classify a group of related attributes
   */
  private async classifyGroup(
    image: string, 
    groupType: string, 
    items: any[], 
    categoryName?: string
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    // If provider has been marked unavailable (e.g. returned 410), skip attempting calls
    if (!this.providerAvailable) {
      for (const item of items) {
        results[item.key] = null;
      }
      return results;
    }
    
    // Create fashion-specific classification prompts for each item
    for (const item of items) {
      try {
        const candidates = this.createFashionCandidates(item, groupType, categoryName);
        const classification = await this.performCLIPClassification(image, candidates);
        
        results[item.key] = {
          rawValue: classification.label,
          schemaValue: this.mapToSchemaValue(classification.label, item),
          visualConfidence: Math.round(classification.score * 100),
          isNewDiscovery: false,
          mappingConfidence: Math.round(classification.score * 100),
          reasoning: `Fashion-CLIP ${groupType} classification`
        };
      } catch (error) {
        console.warn(`Failed to classify ${item.key}:`, error);
        results[item.key] = null;
      }
    }
    
    return results;
  }

  /**
   * 🎨 Create fashion-specific classification candidates
   */
  private createFashionCandidates(item: any, groupType: string, categoryName?: string): string[] {
    const candidates: string[] = [];
    
    // Use allowed values if available
    if (item.allowedValues && item.allowedValues.length > 0) {
      for (const value of item.allowedValues) {
        const valueText = typeof value === 'string' ? value : value.shortForm;
        candidates.push(`${categoryName || 'clothing'} with ${valueText} ${item.label}`);
      }
    } else {
      // Generate fashion-specific candidates based on group type
      const fashionCandidates = this.getFashionCandidates(groupType, item.label, categoryName);
      candidates.push(...fashionCandidates);
    }
    
    return candidates.slice(0, 10); // Limit to prevent API overload
  }

  /**
   * 🔮 Generate fashion candidates for different types
   */
  private getFashionCandidates(groupType: string, label: string, categoryName?: string): string[] {
    const baseItem = categoryName || 'clothing item';
    
    const candidateMap: Record<string, string[]> = {
      color: [
        `${baseItem} in bright colors`,
        `${baseItem} in dark colors`,
        `${baseItem} in neutral colors`,
        `${baseItem} in pastel colors`,
        `${baseItem} in vibrant colors`
      ],
      fabric: [
        `${baseItem} made of cotton`,
        `${baseItem} made of denim`,
        `${baseItem} made of silk`,
        `${baseItem} made of wool`,
        `${baseItem} made of synthetic material`,
        `${baseItem} made of leather`
      ],
      style: [
        `casual ${baseItem}`,
        `formal ${baseItem}`,
        `vintage ${baseItem}`,
        `modern ${baseItem}`,
        `sporty ${baseItem}`
      ],
      fit: [
        `loose fitting ${baseItem}`,
        `tight fitting ${baseItem}`,
        `regular fit ${baseItem}`,
        `oversized ${baseItem}`,
        `slim fit ${baseItem}`
      ],
      pattern: [
        `${baseItem} with stripes`,
        `${baseItem} with floral pattern`,
        `${baseItem} with geometric pattern`,
        `solid color ${baseItem}`,
        `${baseItem} with polka dots`
      ],
      hardware: [
        `${baseItem} with metal hardware`,
        `${baseItem} with plastic buttons`,
        `${baseItem} with zipper`,
        `${baseItem} with no visible hardware`
      ],
      general: [
        `high quality ${baseItem}`,
        `casual ${baseItem}`,
        `elegant ${baseItem}`,
        `simple ${baseItem}`
      ]
    };

    return candidateMap[groupType] || candidateMap.general;
  }

  /**
   *  Perform CLIP zero-shot classification
   */
  private async performCLIPClassification(image: string, candidates: string[]): Promise<{label: string, score: number}> {
    if (!this.config.apiKey) {
      throw new Error('Fashion-CLIP API key not configured');
    }

    const imageData = image.startsWith('data:') ? image.split(',')[1] : image;
    
    const payload = {
      inputs: {
        image: imageData,
        candidate_labels: candidates
      }
    };

    const response = await fetch(`${this.config.baseUrl}/models/openai/clip-vit-base-patch32`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      // If the model or endpoint was removed (HTTP 410), mark provider unavailable to avoid
      // repeated failing calls and allow other providers/fallbacks to run immediately.
      if (response.status === 410) {
        this.providerAvailable = false;
        console.warn('⚠️ Fashion-CLIP provider marked unavailable: API returned 410 (Gone)');
        throw new Error(`Fashion-CLIP API error: ${response.status} (model/endpoint removed or access revoked)`);
      }

      throw new Error(`Fashion-CLIP API error: ${response.status}`);
    }

    const result = await response.json() as any;
    
    // Return the highest scoring classification
    const scores = Array.isArray(result) ? result : [result];
    const bestMatch = scores.reduce((best: any, current: any) => 
      (current.score || 0) > (best.score || 0) ? current : best
    );

    return {
      label: bestMatch.label || candidates[0],
      score: bestMatch.score || 0.5
    };
  }

  /**
   * Map CLIP result to schema value
   */
  private mapToSchemaValue(clipLabel: string, schemaItem: any): string | null {
    // If we have allowed values, try to match
    if (schemaItem.allowedValues && schemaItem.allowedValues.length > 0) {
      for (const value of schemaItem.allowedValues) {
        const valueText = typeof value === 'string' ? value : value.shortForm;
        if (clipLabel.toLowerCase().includes(valueText.toLowerCase())) {
          return valueText;
        }
      }
    }
    
    // Extract relevant part from CLIP label
    const labelParts = clipLabel.toLowerCase().split(' ');
    const relevant = labelParts.find(part => 
      part !== 'clothing' && 
      part !== 'item' && 
      part !== 'with' && 
      part !== 'made' &&
      part !== 'of' &&
      part.length > 2
    );
    
    return relevant || null;
  }

  private calculateConfidence(attributes: AttributeData): number {
    const confidenceValues = Object.values(attributes)
      .filter(attr => attr !== null)
      .map(attr => attr.visualConfidence)
      .filter(conf => conf > 0);

    if (confidenceValues.length === 0) return 0;
    return Math.round(confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length);
  }
}