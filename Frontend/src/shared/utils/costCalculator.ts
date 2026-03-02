/**
 * Cost Calculator for AI Fashion Extractor
 * Calculates costs based on token usage and model pricing
 */

export interface ModelPricing {
  name: string;
  inputCostPer1k: number;  // Cost per 1K input tokens
  outputCostPer1k: number; // Cost per 1K output tokens
}

export interface CostBreakdown {
  totalCost: number;
  inputCost: number;
  outputCost: number;
  tokenCount: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
}

export interface MonthlyCostAnalysis {
  currentMonth: number;
  previousMonth: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
  projectedEndOfMonth: number;
}

export interface CategoryCostBreakdown {
  category: string;
  totalCost: number;
  extractionCount: number;
  avgCostPerExtraction: number;
  tokenUsage: number;
  percentage: number; // Percentage of total cost
}

/**
 * OpenAI Model Pricing (as of 2024)
 * Update these values based on current OpenAI pricing
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-4-vision-preview': {
    name: 'GPT-4 Vision',
    inputCostPer1k: 0.01,   // $0.01 per 1K tokens
    outputCostPer1k: 0.03,  // $0.03 per 1K tokens
  },
  'gpt-4o': {
    name: 'GPT-4o',
    inputCostPer1k: 0.0025,  // $0.0025 per 1K tokens
    outputCostPer1k: 0.01,   // $0.01 per 1K tokens
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    inputCostPer1k: 0.00015, // $0.00015 per 1K tokens
    outputCostPer1k: 0.0006, // $0.0006 per 1K tokens
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    inputCostPer1k: 0.0005,  // $0.0005 per 1K tokens
    outputCostPer1k: 0.0015, // $0.0015 per 1K tokens
  },
};

/**
 * Calculate cost for a single extraction
 */
export const calculateExtractionCost = (
  inputTokens: number,
  outputTokens: number,
  model: string = 'gpt-4o'
): CostBreakdown => {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o'];
  
  const inputCost = (inputTokens / 1000) * pricing.inputCostPer1k;
  const outputCost = (outputTokens / 1000) * pricing.outputCostPer1k;
  const totalCost = inputCost + outputCost;

  return {
    totalCost,
    inputCost,
    outputCost,
    tokenCount: {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens,
    },
    model: pricing.name,
  };
};

/**
 * Calculate total costs from multiple extractions
 */
export const calculateTotalCosts = (
  extractions: Array<{ inputTokens: number; outputTokens: number; model?: string }>
): CostBreakdown => {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalInputCost = 0;
  let totalOutputCost = 0;
  const model = extractions[0]?.model || 'gpt-4o';

  for (const extraction of extractions) {
    const cost = calculateExtractionCost(
      extraction.inputTokens,
      extraction.outputTokens,
      extraction.model || model
    );
    totalInputTokens += extraction.inputTokens;
    totalOutputTokens += extraction.outputTokens;
    totalInputCost += cost.inputCost;
    totalOutputCost += cost.outputCost;
  }

  return {
    totalCost: totalInputCost + totalOutputCost,
    inputCost: totalInputCost,
    outputCost: totalOutputCost,
    tokenCount: {
      input: totalInputTokens,
      output: totalOutputTokens,
      total: totalInputTokens + totalOutputTokens,
    },
    model,
  };
};

/**
 * Calculate monthly cost analysis
 */
export const calculateMonthlyCosts = (
  currentMonthCost: number,
  previousMonthCost: number,
  daysElapsed: number,
  totalDaysInMonth: number
): MonthlyCostAnalysis => {
  const percentageChange = previousMonthCost > 0
    ? ((currentMonthCost - previousMonthCost) / previousMonthCost) * 100
    : 0;

  const trend = percentageChange > 10 ? 'up' 
    : percentageChange < -10 ? 'down' 
    : 'stable';

  // Project end of month based on current spend rate
  const dailyRate = currentMonthCost / daysElapsed;
  const projectedEndOfMonth = dailyRate * totalDaysInMonth;

  return {
    currentMonth: currentMonthCost,
    previousMonth: previousMonthCost,
    percentageChange,
    trend,
    projectedEndOfMonth,
  };
};

/**
 * Calculate cost breakdown by category
 */
export const calculateCategoryBreakdown = (
  extractionsByCategory: Record<string, Array<{
    inputTokens: number;
    outputTokens: number;
    model?: string;
  }>>
): CategoryCostBreakdown[] => {
  const breakdown: CategoryCostBreakdown[] = [];
  let totalCost = 0;

  // Calculate cost for each category
  for (const [category, extractions] of Object.entries(extractionsByCategory)) {
    const costs = calculateTotalCosts(extractions);
    totalCost += costs.totalCost;
    
    breakdown.push({
      category,
      totalCost: costs.totalCost,
      extractionCount: extractions.length,
      avgCostPerExtraction: extractions.length > 0 ? costs.totalCost / extractions.length : 0,
      tokenUsage: costs.tokenCount.total,
      percentage: 0, // Will be calculated after total is known
    });
  }

  // Calculate percentages
  return breakdown.map(item => ({
    ...item,
    percentage: totalCost > 0 ? (item.totalCost / totalCost) * 100 : 0,
  }));
};

/**
 * Calculate cost savings by using different models
 */
export const calculateModelComparison = (
  inputTokens: number,
  outputTokens: number
): Record<string, CostBreakdown> => {
  const comparison: Record<string, CostBreakdown> = {};

  for (const modelKey of Object.keys(MODEL_PRICING)) {
    comparison[modelKey] = calculateExtractionCost(inputTokens, outputTokens, modelKey);
  }

  return comparison;
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, decimals: number = 4): string => {
  return `$${amount.toFixed(decimals)}`;
};

/**
 * Format large numbers with K, M suffixes
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

/**
 * Calculate cost efficiency (tokens per dollar)
 */
export const calculateEfficiency = (totalTokens: number, totalCost: number): number => {
  return totalCost > 0 ? totalTokens / totalCost : 0;
};

export default {
  MODEL_PRICING,
  calculateExtractionCost,
  calculateTotalCosts,
  calculateMonthlyCosts,
  calculateCategoryBreakdown,
  calculateModelComparison,
  formatCurrency,
  formatNumber,
  calculateEfficiency,
};
