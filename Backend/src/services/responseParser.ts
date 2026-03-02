import type {
  SchemaItem,
  AttributeData,
  DiscoveredAttribute,
  EnhancedAIResponse,
  ParsedDiscoveryAttribute,
  ParsedAIAttribute,
} from '../types/extraction';

export class ResponseParser {
  async parseResponse(aiResponse: string, schema: SchemaItem[]): Promise<AttributeData> {
    try {
      const cleanedResponse = this.cleanMarkdownJson(aiResponse);
      console.log('🔍 Attempting to parse AI response:', cleanedResponse.substring(0, 200) + '...');
      const parsed = JSON.parse(cleanedResponse);
      const result: AttributeData = {};

      for (const schemaItem of schema) {
        const aiAttribute: ParsedAIAttribute | undefined = parsed[schemaItem.key];
        if (aiAttribute) {
          result[schemaItem.key] = {
            rawValue: aiAttribute.rawValue || null,
            schemaValue: this.normalizeValue(aiAttribute.schemaValue, schemaItem),
            visualConfidence: aiAttribute.visualConfidence || 0,
            mappingConfidence: 100,
            isNewDiscovery: false,
            reasoning: aiAttribute.reasoning,
          };
        } else {
          result[schemaItem.key] = {
            rawValue: null,
            schemaValue: null,
            visualConfidence: 0,
            mappingConfidence: 0,
            isNewDiscovery: false,
            reasoning: undefined,
          };
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to parse legacy AI response', error);
      console.error('Raw AI response was:', aiResponse.substring(0, 500));

      // If AI response is not JSON, return empty attributes with null values
      if (aiResponse.includes("I'm sorry") || aiResponse.includes("I cannot") || aiResponse.includes("I apologize")) {
        console.warn('AI returned an apologetic response instead of JSON, returning empty attributes');
        const result: AttributeData = {};
        for (const schemaItem of schema) {
          result[schemaItem.key] = {
            rawValue: null,
            schemaValue: null,
            visualConfidence: 0,
            mappingConfidence: 0,
            isNewDiscovery: false,
            reasoning: 'AI could not extract this attribute'
          };
        }
        return result;
      }

      throw new Error(
        `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async parseEnhancedResponse(
    aiResponse: string,
    schema: SchemaItem[]
  ): Promise<{ attributes: AttributeData; discoveries: DiscoveredAttribute[] }> {
    try {
      const cleanedResponse = this.cleanMarkdownJson(aiResponse);
      const parsed = JSON.parse(cleanedResponse) as EnhancedAIResponse;

      console.log('Parsing enhanced AI response', {
        hasSchemaAttributes: !!parsed.schemaAttributes,
        hasDiscoveries: !!parsed.discoveries,
        discoveryCount: Object.keys(parsed.discoveries || {}).length,
      });

      const attributes = await this.parseSchemaAttributes(parsed, schema);
      const discoveries = this.parseDiscoveries(parsed.discoveries || {});

      console.log('Enhanced parsing completed', {
        schemaAttributesProcessed: Object.keys(attributes).length,
        discoveriesFound: discoveries.length,
        highConfidenceDiscoveries: discoveries.filter((d) => d.confidence >= 80).length,
      });

      return { attributes, discoveries };
    } catch (error) {
      console.warn('Enhanced parsing failed, falling back to schema-only', error);
      const attributes = await this.parseResponse(aiResponse, schema);
      return { attributes, discoveries: [] };
    }
  }

  private async parseSchemaAttributes(
    parsed: EnhancedAIResponse,
    schema: SchemaItem[]
  ): Promise<AttributeData> {
    const result: AttributeData = {};
    const schemaData = parsed.schemaAttributes ?? (parsed as Record<string, ParsedAIAttribute>);

    for (const schemaItem of schema) {
      const aiAttribute = schemaData[schemaItem.key];
      if (aiAttribute) {
        result[schemaItem.key] = {
          rawValue: aiAttribute.rawValue || null,
          schemaValue: this.normalizeValue(aiAttribute.schemaValue, schemaItem),
          visualConfidence: aiAttribute.visualConfidence || 0,
          mappingConfidence: 100,
          isNewDiscovery: false,
          reasoning: aiAttribute.reasoning,
        };
      } else {
        result[schemaItem.key] = {
          rawValue: null,
          schemaValue: null,
          visualConfidence: 0,
          mappingConfidence: 0,
          isNewDiscovery: false,
          reasoning: undefined,
        };
      }
    }

    return result;
  }

  private parseDiscoveries(discoveryData: Record<string, ParsedDiscoveryAttribute>): DiscoveredAttribute[] {
    const discoveries: DiscoveredAttribute[] = [];

    for (const [key, discovery] of Object.entries(discoveryData)) {
      if (!discovery || typeof discovery !== 'object') continue;

      try {
        const discoveredAttribute: DiscoveredAttribute = {
          key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          rawValue: discovery.rawValue || '',
          normalizedValue: discovery.normalizedValue || discovery.rawValue || '',
          confidence: discovery.confidence || 0,
          reasoning: discovery.reasoning || '',
          frequency: 1,
          suggestedType: discovery.suggestedType || this.inferType(discovery.rawValue || ''),
          possibleValues: discovery.possibleValues?.filter((v): v is string => Boolean(v)) || [],
          isPromotable: discovery.isPromotable
        };

        discoveries.push(discoveredAttribute);
      } catch (error) {
        console.warn('Failed to parse discovery', { key, discovery, error });
      }
    }

    return discoveries;
  }

  private cleanMarkdownJson(response: string): string {
    let cleaned = response.trim();

    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return cleaned.trim();
  }

  /**
   * Sanitize a value that should be numeric.
   * Handles formats like "562/-", "562/", "562-", "₹562", "562 /-" → 562
   * Returns null for non-numeric strings like "WIP", "N/A", etc.
   */
  private parseNumericValue(value: string | number | null): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return isNaN(value) ? null : value;

    // Remove currency symbols, whitespace, then strip trailing non-numeric junk (e.g. /-, /, -)
    const cleaned = String(value)
      .replace(/[₹$€£¥]/g, '')   // strip currency symbols
      .replace(/\s+/g, '')        // strip whitespace
      .replace(/\/-$/, '')        // strip trailing /-
      .replace(/\/$/, '')         // strip trailing /
      .replace(/-$/, '')          // strip trailing -
      .trim();

    // Extract leading numeric portion (digits, optional decimal point)
    const match = cleaned.match(/^-?\d+(\.\d+)?/);
    if (!match) return null;

    const num = parseFloat(match[0]);
    return isNaN(num) ? null : num;
  }

  private normalizeValue(value: string | number | null, schemaItem: SchemaItem): string | number | null {
    if (value === null || value === undefined) return null;

    if (schemaItem.type === 'number') {
      return this.parseNumericValue(value);
    }

    if (schemaItem.type === 'select' && schemaItem.allowedValues?.length) {
      const stringValue = String(value).toLowerCase();
      const match = schemaItem.allowedValues.find(allowed => {
        // Handle both string format and AllowedValue object format
        if (typeof allowed === 'string') {
          return allowed.toLowerCase() === stringValue;
        } else if (allowed && typeof allowed === 'object' && 'shortForm' in allowed) {
          return allowed.shortForm.toLowerCase() === stringValue ||
            (allowed.fullForm && allowed.fullForm.toLowerCase() === stringValue);
        }
        return false;
      });

      if (match) {
        return typeof match === 'string' ? match : match.shortForm;
      }
      return null;
    }

    return String(value);
  }

  private inferType(value: string): 'text' | 'select' | 'number' {
    if (!value) return 'text';
    const trimmedValue = value.trim();
    if (!isNaN(Number(trimmedValue)) && trimmedValue.length < 10 && trimmedValue.length > 0) {
      return 'number';
    }
    if (this.looksLikeCategory(trimmedValue)) {
      return 'select';
    }
    return 'text';
  }

  private looksLikeCategory(value: string): boolean {
    const trimmedValue = value.trim();
    return (
      trimmedValue.length <= 50 &&
      trimmedValue.length >= 2 &&
      !trimmedValue.includes('.') &&
      trimmedValue.split(' ').length <= 4 &&
      !/\d{2,}/.test(trimmedValue)
    );
  }

  async parseWithDebugInfo(
    aiResponse: string,
    schema: SchemaItem[]
  ): Promise<{ attributes: AttributeData; discoveries: DiscoveredAttribute[]; debugInfo: any }> {
    const result = await this.parseEnhancedResponse(aiResponse, schema);
    return {
      ...result,
      debugInfo: {
        rawResponse: aiResponse.substring(0, 200),
        cleanedResponse: this.cleanMarkdownJson(aiResponse).substring(0, 200),
        schemaItemCount: schema.length,
        timestamp: new Date().toISOString()
      }
    };
  }
}