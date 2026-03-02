/**
 * Simple API Cost Calculator
 * Calculates cost based on model and token usage
 */

interface ModelPricing {
    inputCostPer1M: number;  // Cost per 1M input tokens
    outputCostPer1M: number; // Cost per 1M output tokens
}

// Pricing as of 2024 (update as needed)
const MODEL_PRICING: Record<string, ModelPricing> = {
    'gpt-4-vision-preview': {
        inputCostPer1M: 10.00,
        outputCostPer1M: 30.00
    },
    'gpt-4-turbo': {
        inputCostPer1M: 10.00,
        outputCostPer1M: 30.00
    },
    'gpt-4': {
        inputCostPer1M: 30.00,
        outputCostPer1M: 60.00
    },
    'gpt-3.5-turbo': {
        inputCostPer1M: 0.50,
        outputCostPer1M: 1.50
    },
    'claude-3-opus': {
        inputCostPer1M: 15.00,
        outputCostPer1M: 75.00
    },
    'claude-3-sonnet': {
        inputCostPer1M: 3.00,
        outputCostPer1M: 15.00
    },
    'claude-sonnet': {
        inputCostPer1M: 3.00,
        outputCostPer1M: 15.00
    },
    'gemini-pro-vision': {
        inputCostPer1M: 0.00,  // Free tier
        outputCostPer1M: 0.00
    },
    'gemini-2.5-pro': {
        inputCostPer1M: 1.25,  // Paid tier: $1.25 per 1M input tokens
        outputCostPer1M: 5.00  // Paid tier: $5.00 per 1M output tokens
    },
    'google-gemini': {
        inputCostPer1M: 1.25,  // Paid tier (same as gemini-2.5-pro)
        outputCostPer1M: 5.00
    }
};

/**
 * Calculate API cost based on token usage and model
 */
export function calculateApiCost(
    inputTokens: number,
    outputTokens: number,
    modelName: string
): number {
    const pricing = MODEL_PRICING[modelName] || MODEL_PRICING['gpt-4-turbo']; // Default to GPT-4 Turbo

    const inputCost = (inputTokens / 1_000_000) * pricing.inputCostPer1M;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputCostPer1M;

    return inputCost + outputCost;
}

/**
 * Calculate cost from total tokens (when input/output split not available)
 */
export function calculateApiCostFromTotal(
    totalTokens: number,
    modelName: string
): number {
    // Estimate: assume 70% input, 30% output (typical for vision tasks)
    const estimatedInput = Math.floor(totalTokens * 0.7);
    const estimatedOutput = Math.floor(totalTokens * 0.3);

    return calculateApiCost(estimatedInput, estimatedOutput, modelName);
}
