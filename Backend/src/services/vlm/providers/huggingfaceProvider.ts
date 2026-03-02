import { VLMProvider, FashionExtractionRequest, HuggingFaceVLMConfig } from '../../../types/vlm';
import { EnhancedExtractionResult, AttributeData } from '../../../types/extraction';

export class HuggingFaceVLMProvider implements VLMProvider {
  public readonly name = 'HuggingFace LLaVA';
  private config: HuggingFaceVLMConfig;

  constructor(config?: Partial<HuggingFaceVLMConfig>) {
    this.config = {
      model: 'llava-hf/llava-1.5-13b-hf',
      baseUrl: 'https://router.huggingface.co/hf-inference', // Updated from deprecated api-inference endpoint
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
      maxTokens: 2048,
      temperature: 0.1,
      timeout: 45000,
      ...config
    };
  }

  async extractAttributes(request: FashionExtractionRequest): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🤗 [HuggingFace LLaVA] Starting extraction with ${request.schema.length} attributes`);
      console.log(`🔧 HuggingFace Config: Model=${this.config.model}, Timeout=${this.config.timeout}ms`);
      
      const prompt = this.buildFashionPrompt(request);
      const response = await this.callHuggingFaceAPI(request.image, prompt);
      
      const attributes = await this.parseResponse(response.content, request.schema);
      const confidence = this.calculateConfidence(attributes);

      const processingTime = Date.now() - startTime;
      console.log(`✅ [HuggingFace LLaVA] Extraction complete: ${Object.keys(attributes).length} attributes, ${processingTime}ms`);
      console.log(`📊 [HuggingFace LLaVA] Performance: Confidence=${confidence}%, Cloud Processing=True`);

      return {
        attributes,
        confidence,
        tokensUsed: response.tokensUsed || 0,
        modelUsed: 'huggingface-llava',
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
      console.error('❌ [HuggingFace LLaVA] Extraction failed:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error(`HuggingFace VLM extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.config.apiKey) return false;
      
      // Test with a simple request
      const testResponse = await fetch(`${this.config.baseUrl}/models/${this.config.model}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return testResponse.ok;
    } catch {
      return false;
    }
  }

  async configure(config: HuggingFaceVLMConfig): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  private buildFashionPrompt(request: FashionExtractionRequest): string {
    const { schema, categoryName } = request;
    
    const prompt = `Analyze this fashion image and extract the following attributes:

${schema.map(item => {
  const values = item.allowedValues?.length 
    ? ` (options: ${item.allowedValues.map(av => typeof av === 'string' ? av : av.shortForm).join(', ')})`
    : '';
  return `${item.key}: ${item.label}${values}`;
}).join('\n')}

${categoryName ? `Category: ${categoryName}` : ''}

Provide a JSON response with extracted attributes and confidence scores.

Format:
{
  "attribute_key": {
    "rawValue": "observed value",
    "schemaValue": "normalized value", 
    "visualConfidence": 85
  }
}`;

    return prompt;
  }

  private async callHuggingFaceAPI(base64Image: string, prompt: string) {
    if (!this.config.apiKey) {
      throw new Error('HuggingFace API key not configured');
    }

    // Convert base64 to blob for HuggingFace
    const imageData = base64Image.startsWith('data:') 
      ? base64Image.split(',')[1] 
      : base64Image;

    const payload = {
      inputs: {
        image: imageData,
        text: prompt
      },
      parameters: {
        max_new_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      }
    };

    const response = await fetch(`${this.config.baseUrl}/models/${this.config.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
    }

    const result = await response.json() as any;
    
    // Handle HuggingFace response format
    const content = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;
    
    return {
      content: content || '',
      tokensUsed: content?.length ? Math.ceil(content.length / 4) : 0 // Estimate tokens
    };
  }

  private async parseResponse(content: string, schema: any[]): Promise<AttributeData> {
    try {
      // HuggingFace models might not return perfect JSON, so we need robust parsing
      let jsonMatch = (/\{[\s\S]*\}/).exec(content);
      
      if (!jsonMatch) {
        // Fallback: create basic structure from text analysis
        return this.createFallbackAttributes(content, schema);
      }

      const cleanContent = jsonMatch[0].replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      
      const attributes: AttributeData = {};
      
      for (const schemaItem of schema) {
        const key = schemaItem.key;
        if (parsed[key]) {
          attributes[key] = {
            rawValue: parsed[key].rawValue || parsed[key].value || null,
            schemaValue: parsed[key].schemaValue || parsed[key].value || null,
            visualConfidence: parsed[key].visualConfidence || parsed[key].confidence || 70,
            isNewDiscovery: false,
            mappingConfidence: parsed[key].visualConfidence || 70,
            reasoning: parsed[key].reasoning || 'HuggingFace analysis'
          };
        } else {
          attributes[key] = null;
        }
      }
      
      return attributes;
    } catch (error) {
      console.warn('Failed to parse HuggingFace JSON, using fallback parsing:', error);
      return this.createFallbackAttributes(content, schema);
    }
  }

  private createFallbackAttributes(content: string, schema: any[]): AttributeData {
    const attributes: AttributeData = {};
    
    // Simple text analysis fallback
    for (const schemaItem of schema) {
      const key = schemaItem.key.toLowerCase();
      const label = schemaItem.label.toLowerCase();
      
      // Look for mentions of the attribute in the response
      const contentLower = content.toLowerCase();
      
      let found = false;
      let value = null;
      
      // Check if attribute type has allowed values
      if (schemaItem.allowedValues && schemaItem.allowedValues.length > 0) {
        for (const allowedValue of schemaItem.allowedValues) {
          const valueText = typeof allowedValue === 'string' ? allowedValue : allowedValue.shortForm;
          if (contentLower.includes(valueText.toLowerCase())) {
            value = valueText;
            found = true;
            break;
          }
        }
      }
      
      // If we found a value or can extract from context
      if (found || contentLower.includes(key) || contentLower.includes(label)) {
        attributes[schemaItem.key] = {
          rawValue: value || 'detected',
          schemaValue: value || null,
          visualConfidence: found ? 60 : 30, // Lower confidence for fallback
          isNewDiscovery: false,
          mappingConfidence: 50,
          reasoning: 'Fallback text analysis'
        };
      } else {
        attributes[schemaItem.key] = null;
      }
    }
    
    return attributes;
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