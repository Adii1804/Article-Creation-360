import { SchemaItem } from '../../../types/extraction';
import { GarmentType } from '../../../generated/prisma';

/**
 * BASE PROMPT UTILITIES
 * Shared interfaces and helper functions for all department-specific prompts
 */

export interface PromptContext {
  department: 'MENS' | 'LADIES' | 'KIDS';
  garmentType: GarmentType;
  schema: SchemaItem[];
  categoryName: string;
  mode?: 'fashion-focused' | 'detailed-analysis' | 'discovery-mode';
}

export interface SpecializedPrompt {
  systemPrompt: string;
  attributeInstructions: string;
  focusAreas: string[];
  skipAttributes: string[];
  necklineGuide?: string;
  embroideryGuide?: string;
  printGuide?: string;
}

/**
 * BUILD ALLOWED VALUES REFERENCE FROM SCHEMA
 * Extracts all allowed_values from schema to create a validation reference
 */
export function buildAllowedValuesReference(schema: SchemaItem[]): Record<string, string[]> {
  const reference: Record<string, string[]> = {};
  
  schema.forEach(item => {
    if (item.allowedValues && Array.isArray(item.allowedValues) && item.allowedValues.length > 0) {
      // Handle both string[] and AllowedValue[] formats
      const values = item.allowedValues
        .map(val => typeof val === 'string' ? val : val.shortForm || val.fullForm)
        .filter((v): v is string => v !== undefined && v !== null);
      reference[item.key] = values;
    }
  });
  
  return reference;
}

/**
 * VALIDATE EXTRACTION AGAINST SCHEMA
 * Ensures extracted value matches one of the allowed enum values in DB
 */
export function validateExtraction(
  attributeKey: string,
  extractedValue: string,
  allowedValues: string[]
): { isValid: boolean; suggestedValue?: string } {
  if (!extractedValue || !allowedValues || allowedValues.length === 0) {
    return { isValid: true }; // No validation possible
  }

  // Exact match
  if (allowedValues.includes(extractedValue)) {
    return { isValid: true };
  }

  // Try fuzzy match for partial/case-insensitive matches
  const normalizedExtracted = extractedValue.toLowerCase().trim();
  const fuzzyMatch = allowedValues.find(val =>
    val.toLowerCase().includes(normalizedExtracted) ||
    normalizedExtracted.includes(val.toLowerCase())
  );

  if (fuzzyMatch) {
    return { isValid: true, suggestedValue: fuzzyMatch };
  }

  return { isValid: false, suggestedValue: undefined };
}

/**
 * FORMAT ALLOWED VALUES FOR PROMPT
 * Creates a readable string of allowed values for the VLM/LLM
 */
export function formatAllowedValuesForPrompt(allowedValues: string[]): string {
  if (!allowedValues || allowedValues.length === 0) return 'No restrictions';
  if (allowedValues.length <= 5) return allowedValues.join(', ');
  
  // For long lists, show first 5 + count
  return `${allowedValues.slice(0, 5).join(', ')} (and ${allowedValues.length - 5} more)`;
}

/**
 * Filter schema based on skip attributes
 */
export function filterSchemaByRelevance(
  schema: SchemaItem[], 
  skipAttributes: string[]
): SchemaItem[] {
  if (skipAttributes.length === 0) return schema;
  
  return schema.filter(item => {
    const key = item.key.toLowerCase();
    return !skipAttributes.some(skip => key.includes(skip));
  });
}

/**
 * Prioritize schema attributes based on focus areas
 */
export function prioritizeSchema(
  schema: SchemaItem[], 
  focusAreas: string[]
): SchemaItem[] {
  // Sort schema: priority attributes first, optional second
  return schema.sort((a, b) => {
    const aIsPriority = focusAreas.some(focus => 
      a.label.toLowerCase().includes(focus.toLowerCase()) ||
      a.key.toLowerCase().includes(focus.toLowerCase())
    );
    const bIsPriority = focusAreas.some(focus => 
      b.label.toLowerCase().includes(focus.toLowerCase()) ||
      b.key.toLowerCase().includes(focus.toLowerCase())
    );
    
    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;
    return 0;
  });
}

/**
 * Generic fallback prompt (when department/garmentType missing)
 */
export function buildGenericPrompt(context: PromptContext): SpecializedPrompt {
  return {
    systemPrompt: `You are a fashion AI analyst. Extract attributes comprehensively from this ${context.categoryName || 'garment'}.`,
    
    attributeInstructions: `
Extract all visible attributes with high confidence:
- Focus on clearly visible features
- Be precise with colors, patterns, and materials
- Note construction details
- Identify styling elements

 Priority: Color, fabric, fit, style, length
`,
    
    focusAreas: [
      'Color and pattern accuracy',
      'Fabric identification',
      'Construction details',
      'Fit and styling',
      'Visible features'
    ],
    
    skipAttributes: []
  };
}
