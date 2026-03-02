/**
 * VLM FUSION CONFIGURATION
 * Control how multiple AI models are used together
 */

export interface VLMFusionConfig {
  // Enable multi-model fusion (if false, uses fallback mode)
  enabled: boolean;
  
  // Fusion strategy
  fusionMode: 'voting' | 'confidence-weighted' | 'best-only';
  
  // Which models to use in fusion
  models: string[];
  
  // Cost optimization settings
  costOptimization: {
    enabled: boolean;
    maxCostPerImage: number; // in USD
    preferredModels: string[]; // Use these first to save cost
  };
  
  // Quality settings
  quality: {
    minModelsRequired: number; // Minimum models for fusion (2-3 recommended)
    minConfidenceThreshold: number; // 0-100, retry if below this
  };
}

/**
 * DEFAULT CONFIGURATION
 */
export const DEFAULT_FUSION_CONFIG: VLMFusionConfig = {
  enabled: false, // Start with fallback mode (safer for production)
  fusionMode: 'confidence-weighted',
  models: ['openai-gpt4v', 'claude-sonnet', 'google-gemini'],
  
  costOptimization: {
    enabled: true,
    maxCostPerImage: 0.03, // $0.03 per image max
    preferredModels: ['google-gemini', 'claude-sonnet'] // Cheaper options first
  },
  
  quality: {
    minModelsRequired: 2,
    minConfidenceThreshold: 75
  }
};

/**
 * HIGH QUALITY CONFIGURATION
 * Use when accuracy is critical, cost is less important
 */
export const HIGH_QUALITY_CONFIG: VLMFusionConfig = {
  enabled: true,
  fusionMode: 'voting', // More democratic, better for complex cases
  models: ['openai-gpt4v', 'claude-sonnet', 'google-gemini'],
  
  costOptimization: {
    enabled: false,
    maxCostPerImage: 0.10,
    preferredModels: []
  },
  
  quality: {
    minModelsRequired: 3, // All 3 models must agree
    minConfidenceThreshold: 85
  }
};

/**
 * COST-OPTIMIZED CONFIGURATION
 * Use when processing large batches, cost is important
 */
export const COST_OPTIMIZED_CONFIG: VLMFusionConfig = {
  enabled: true,
  fusionMode: 'best-only', // Just use cheapest good model
  models: ['google-gemini', 'claude-sonnet'], // Skip expensive OpenAI unless needed
  
  costOptimization: {
    enabled: true,
    maxCostPerImage: 0.01,
    preferredModels: ['google-gemini'] // Start with cheapest
  },
  
  quality: {
    minModelsRequired: 1, // Single model OK
    minConfidenceThreshold: 70
  }
};

/**
 * BALANCED CONFIGURATION (RECOMMENDED FOR PRODUCTION)
 * Balance between quality and cost
 */
export const BALANCED_CONFIG: VLMFusionConfig = {
  enabled: true,
  fusionMode: 'confidence-weighted',
  models: ['claude-sonnet', 'google-gemini'], // Good quality, reasonable cost
  
  costOptimization: {
    enabled: true,
    maxCostPerImage: 0.02,
    preferredModels: ['google-gemini', 'claude-sonnet']
  },
  
  quality: {
    minModelsRequired: 2,
    minConfidenceThreshold: 75
  }
};

/**
 * Get configuration based on environment variable
 */
export function getFusionConfig(): VLMFusionConfig {
  const mode = process.env.VLM_FUSION_MODE || 'default';
  
  switch (mode.toLowerCase()) {
    case 'high-quality':
      return HIGH_QUALITY_CONFIG;
    case 'cost-optimized':
      return COST_OPTIMIZED_CONFIG;
    case 'balanced':
      return BALANCED_CONFIG;
    default:
      return DEFAULT_FUSION_CONFIG;
  }
}

/**
 * Calculate estimated cost for fusion configuration
 */
export function estimateCostPerImage(config: VLMFusionConfig): number {
  const costPerModel: Record<string, number> = {
    'openai-gpt4v': 0.020,      // ~2 cents per image
    'claude-sonnet': 0.0285,    // ~2.85 cents per image
    'google-gemini': 0.0006     // ~0.06 cents per image
  };
  
  if (!config.enabled) {
    // Fallback mode: use first available model
    return costPerModel[config.models[0]] || 0.020;
  }
  
  // Fusion mode: sum all models used
  let totalCost = 0;
  const modelsToUse = Math.min(config.models.length, config.quality.minModelsRequired);
  
  for (let i = 0; i < modelsToUse; i++) {
    const model = config.models[i];
    totalCost += costPerModel[model] || 0.020;
  }
  
  return totalCost;
}
