import { 
  PromptContext, 
  SpecializedPrompt, 
  buildGenericPrompt,
  filterSchemaByRelevance,
  prioritizeSchema
} from './basePrompt';
import { 
  buildMensUpperPrompt, 
  buildMensLowerPrompt, 
  buildMensAllInOnePrompt 
} from './mensPrompts';
import { 
  buildWomensUpperPrompt, 
  buildWomensLowerPrompt, 
  buildWomensAllInOnePrompt 
} from './womensPrompts';
import { 
  buildKidsUpperPrompt, 
  buildKidsLowerPrompt, 
  buildKidsAllInOnePrompt 
} from './kidsPrompts';

/**
 * SPECIALIZED PROMPT BUILDER
 * 
 * Routes to department-specific prompt builders based on Department × Garment Type.
 * 
 * Architecture:
 * - basePrompt.ts: Shared utilities and interfaces
 * - mensPrompts.ts: MENS_UPPER, MENS_LOWER, MENS_ALL_IN_ONE
 * - womensPrompts.ts: WOMENS_UPPER, WOMENS_LOWER, WOMENS_ALL_IN_ONE
 * - kidsPrompts.ts: KIDS_UPPER, KIDS_LOWER, KIDS_ALL_IN_ONE
 * - index.ts (this file): PromptBuilder class that routes to appropriate prompt
 * 
 * Benefits:
 * - Modular: Each department in separate file
 * - Maintainable: Easy to update one department without touching others
 * - Scalable: Easy to add new departments or garment types
 * - Clean: Shared utilities in basePrompt.ts
 */

export class PromptBuilder {
  /**
   * Build specialized prompt based on department + garment type
   */
  buildSpecializedPrompt(context: PromptContext): SpecializedPrompt {
    const key = `${context.department}_${context.garmentType}`;
    
    switch (key) {
      // ========== MENS ==========
      case 'MENS_UPPER':
        return buildMensUpperPrompt(context);
      case 'MENS_LOWER':
        return buildMensLowerPrompt(context);
      case 'MENS_ALL_IN_ONE':
        return buildMensAllInOnePrompt(context);
        
      // ========== LADIES/WOMENS ==========
      case 'LADIES_UPPER':
        return buildWomensUpperPrompt(context);
      case 'LADIES_LOWER':
        return buildWomensLowerPrompt(context);
      case 'LADIES_ALL_IN_ONE':
        return buildWomensAllInOnePrompt(context);
        
      // ========== KIDS ==========
      case 'KIDS_UPPER':
        return buildKidsUpperPrompt(context);
      case 'KIDS_LOWER':
        return buildKidsLowerPrompt(context);
      case 'KIDS_ALL_IN_ONE':
        return buildKidsAllInOnePrompt(context);
        
      default:
        return buildGenericPrompt(context);
    }
  }

  /**
   * Filter schema based on skip attributes
   */
  filterSchemaByRelevance = filterSchemaByRelevance;

  /**
   * Prioritize schema attributes based on focus areas
   */
  prioritizeSchema = prioritizeSchema;
}

// Export singleton instance for backward compatibility
export const promptBuilder = new PromptBuilder();

// Re-export types for convenience
export type { PromptContext, SpecializedPrompt };
