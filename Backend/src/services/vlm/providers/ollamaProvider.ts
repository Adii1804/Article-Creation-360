import { VLMProvider, FashionExtractionRequest, OllamaVLMConfig } from '../../../types/vlm';
import { EnhancedExtractionResult, AttributeData } from '../../../types/extraction';

export class OllamaVLMProvider implements VLMProvider {
  public readonly name = 'Ollama Local LLaVA';
  private config: OllamaVLMConfig;

  constructor(config?: Partial<OllamaVLMConfig>) {
    this.config = {
      model: 'llava:latest',
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      maxTokens: 2048,
      temperature: 0.1,
      timeout: 60000, // Longer timeout for local processing
      ...config
    };
  }

  async extractAttributes(request: FashionExtractionRequest): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🦙 [Ollama LLaVA] Starting local extraction with ${request.schema.length} attributes`);
      console.log(`🔧 Ollama Config: Model=${this.config.model}, BaseURL=${this.config.baseUrl}, Timeout=${this.config.timeout}ms`);
      
      const prompt = this.buildLocalPrompt(request);
      const response = await this.callOllamaAPI(request.image, prompt);
      
      const attributes = await this.parseResponse(response.content, request.schema);
      const confidence = this.calculateConfidence(attributes);

      const processingTime = Date.now() - startTime;
      console.log(`✅ [Ollama LLaVA] Local extraction complete: ${Object.keys(attributes).length} attributes, ${processingTime}ms`);
      console.log(`📊 [Ollama LLaVA] Performance: Confidence=${confidence}%, Local Processing=True`);

      return {
        attributes,
        confidence,
        tokensUsed: response.tokensUsed || 0,
        modelUsed: 'ollama-llava',
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
      console.error('❌ [Ollama LLaVA] Local extraction failed:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error(`Ollama VLM extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        timeout: 5000
      } as any);
      
      if (!response.ok) return false;
      
      const models = await response.json() as any;
      const availableModels = models.models || [];
      
      // Check if our model is available
      return availableModels.some((model: any) => 
        model.name.includes('llava') || model.name.includes('moondream')
      );
    } catch {
      return false;
    }
  }

  async configure(config: OllamaVLMConfig): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  private buildLocalPrompt(request: FashionExtractionRequest): string {
    const { schema, categoryName, mode } = request;
    
    // Optimized prompt for local models (shorter, more direct)
    const attributeList = schema.map(item => {
      const values = item.allowedValues?.length 
        ? ` [${item.allowedValues.map(av => typeof av === 'string' ? av : av.shortForm).slice(0, 3).join('|')}]`
        : '';
      return `${item.key}${values}`;
    }).join(', ');

    return `Analyze this ${categoryName || 'clothing'} image. Extract: ${attributeList}

Return JSON:
{"attr_key": {"value": "result", "confidence": 80}}

Focus on visible details only.`;
  }

  private async callOllamaAPI(base64Image: string, prompt: string) {
    // Ollama expects clean base64 without data URL prefix
    const imageData = base64Image.startsWith('data:') 
      ? base64Image.split(',')[1] 
      : base64Image;

    const payload = {
      model: this.config.model,
      prompt: prompt,
      images: [imageData],
      stream: false,
      options: {
        temperature: this.config.temperature,
        num_predict: this.config.maxTokens
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout!);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${error}`);
      }

      const result = await response.json() as any;
      
      return {
        content: result.response || '',
        tokensUsed: result.eval_count || 0
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async parseResponse(content: string, schema: any[]): Promise<AttributeData> {
    try {
      // Ollama responses tend to be more variable, so we need robust parsing
      let jsonMatch = content.match(/\{[\s\S]*?\}/);
      
      if (!jsonMatch) {
        // Try to find JSON-like structure with different patterns
        const allMatches = content.match(/\{[^}]*\}/g);
        jsonMatch = allMatches ? [allMatches[allMatches.length - 1]] : null;
      }
      
      if (!jsonMatch) {
        console.warn('No JSON found in Ollama response, using text analysis');
        return this.createFallbackAttributes(content, schema);
      }

      const cleanContent = jsonMatch[0]
        .replace(/```json\n?|\n?```/g, '')
        .replace(/,\s*}/g, '}') // Fix trailing commas
        .trim();
        
      const parsed = JSON.parse(cleanContent);
      
      const attributes: AttributeData = {};
      
      for (const schemaItem of schema) {
        const key = schemaItem.key;
        const data = parsed[key] || parsed[key.toLowerCase()] || parsed[key.replace(/_/g, '')];
        
        if (data) {
          const value = typeof data === 'object' ? data.value : data;
          const confidence = typeof data === 'object' ? data.confidence : 65;
          
          attributes[key] = {
            rawValue: value || null,
            schemaValue: value || null,
            visualConfidence: confidence || 65,
            isNewDiscovery: false,
            mappingConfidence: confidence || 65,
            reasoning: 'Ollama local analysis'
          };
        } else {
          attributes[key] = null;
        }
      }
      
      return attributes;
    } catch (error) {
      console.warn('Failed to parse Ollama JSON, using fallback:', error);
      return this.createFallbackAttributes(content, schema);
    }
  }

  private createFallbackAttributes(content: string, schema: any[]): AttributeData {
    const attributes: AttributeData = {};
    const contentLower = content.toLowerCase();
    
    for (const schemaItem of schema) {
      const key = schemaItem.key.toLowerCase();
      
      let bestMatch = null;
      let confidence = 40;
      
      // Check allowed values first
      if (schemaItem.allowedValues && schemaItem.allowedValues.length > 0) {
        for (const allowedValue of schemaItem.allowedValues) {
          const valueText = typeof allowedValue === 'string' ? allowedValue : allowedValue.shortForm;
          if (contentLower.includes(valueText.toLowerCase())) {
            bestMatch = valueText;
            confidence = 60;
            break;
          }
        }
      }
      
      // Extract value using keyword matching
      if (!bestMatch) {
        // Look for patterns like "color: red" or "material is cotton"
        const patterns = [
          new RegExp(`${key}[:\\s]+([^\\n\\.,;]+)`, 'i'),
          new RegExp(`${schemaItem.label.toLowerCase()}[:\\s]+([^\\n\\.,;]+)`, 'i')
        ];
        
        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match && match[1]) {
            bestMatch = match[1].trim();
            confidence = 50;
            break;
          }
        }
      }
      
      attributes[schemaItem.key] = bestMatch ? {
        rawValue: bestMatch,
        schemaValue: bestMatch,
        visualConfidence: confidence,
        isNewDiscovery: false,
        mappingConfidence: confidence,
        reasoning: 'Local text analysis'
      } : null;
    }
    
    return attributes;
  }

  private calculateConfidence(attributes: AttributeData): number {
    const confidenceValues = Object.values(attributes)
      .filter(attr => attr !== null)
      .map(attr => attr!.visualConfidence)
      .filter(conf => conf > 0);

    if (confidenceValues.length === 0) return 0;
    return Math.round(confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length);
  }

  /**
   * 🛠️ Ollama-specific utility methods
   */
  async listAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      const data = await response.json() as any;
      return (data.models || []).map((model: any) => model.name);
    } catch {
      return [];
    }
  }

  async pullModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}