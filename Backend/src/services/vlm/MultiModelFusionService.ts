import { VLMProvider, FashionExtractionRequest } from '../../types/vlm';
import { EnhancedExtractionResult, AttributeData, SchemaItem } from '../../types/extraction';

/**
 * MULTI-MODEL FUSION SERVICE
 * Combines results from multiple VLM providers to improve accuracy
 * Uses ensemble voting and confidence weighting
 */
export class MultiModelFusionService {
  
  /**
   * Extract attributes using multiple models and fuse results
   * @param providers Array of VLM providers to use (e.g., OpenAI, Claude, Google)
   * @param request Extraction request
   * @param fusionMode How to combine results: 'voting', 'confidence-weighted', 'best-only'
   */
  async extractWithFusion(
    providers: { id: string; provider: VLMProvider }[],
    request: FashionExtractionRequest,
    fusionMode: 'voting' | 'confidence-weighted' | 'best-only' = 'confidence-weighted'
  ): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();
    console.log(`\n🔀 ========== MULTI-MODEL FUSION ==========`);
    console.log(`📊 Using ${providers.length} models: ${providers.map(p => p.id).join(', ')}`);
    console.log(`🎯 Fusion Mode: ${fusionMode}`);

    // Run all providers in parallel
    const results = await Promise.allSettled(
      providers.map(async ({ id, provider }) => {
        try {
          const result = await provider.extractAttributes(request);
          return { id, result, success: true };
        } catch (error) {
          console.error(`❌ [${id}] Failed:`, error instanceof Error ? error.message : 'Unknown');
          return { id, result: null, success: false };
        }
      })
    );

    // Extract successful results
    const successfulResults = results
      .filter((r): r is PromiseFulfilledResult<{ id: string; result: EnhancedExtractionResult; success: boolean }> => 
        r.status === 'fulfilled' && r.value.success && r.value.result !== null
      )
      .map(r => ({ id: r.value.id, result: r.value.result! }));

    if (successfulResults.length === 0) {
      throw new Error('All models failed to extract attributes');
    }

    console.log(`✅ ${successfulResults.length}/${providers.length} models succeeded`);

    // Fuse results based on mode
    let fusedAttributes: AttributeData;
    let fusionStats: any;

    switch (fusionMode) {
      case 'voting':
        ({ attributes: fusedAttributes, stats: fusionStats } = this.fuseByVoting(successfulResults, request.schema));
        break;
      case 'confidence-weighted':
        ({ attributes: fusedAttributes, stats: fusionStats } = this.fuseByConfidenceWeighting(successfulResults, request.schema));
        break;
      case 'best-only':
        ({ attributes: fusedAttributes, stats: fusionStats } = this.fuseBestOnly(successfulResults, request.schema));
        break;
    }

    const totalTokens = successfulResults.reduce((sum, r) => sum + (r.result?.tokensUsed || 0), 0);
    const avgConfidence = this.calculateOverallConfidence(fusedAttributes);
    const processingTime = Date.now() - startTime;

    console.log(`🎯 Fusion Complete:`);
    console.log(`   - Attributes: ${Object.keys(fusedAttributes).length}`);
    console.log(`   - Avg Confidence: ${avgConfidence}%`);
    console.log(`   - Total Tokens: ${totalTokens}`);
    console.log(`   - Processing Time: ${processingTime}ms`);
    console.log(`================================================\n`);

    return {
      attributes: fusedAttributes,
      confidence: avgConfidence,
      tokensUsed: totalTokens,
      modelUsed: `multi-model-fusion-${fusionMode}` as any,
      processingTime,
      discoveries: [],
      discoveryStats: {
        totalFound: 0,
        highConfidence: 0,
        schemaPromotable: 0,
        uniqueKeys: 0
      }
    };
  }

  /**
   * VOTING FUSION: Each attribute value is voted on by all models
   * The value with most votes wins (ties go to highest confidence)
   */
  private fuseByVoting(
    results: Array<{ id: string; result: EnhancedExtractionResult }>,
    schema: SchemaItem[]
  ): { attributes: AttributeData; stats: any } {
    console.log(`🗳️  Using VOTING fusion (majority wins)`);
    
    const fusedAttributes: AttributeData = {};
    const stats = {
      unanimous: 0,
      majority: 0,
      split: 0,
      agreements: [] as any[]
    };

    for (const schemaItem of schema) {
      const key = schemaItem.key;
      const votes = new Map<string, { count: number; totalConfidence: number; models: string[] }>();

      // Collect votes from all models
      results.forEach(({ id, result }) => {
        const attr = result.attributes[key];
        if (attr && attr.schemaValue !== null) {
          const value = String(attr.schemaValue);
          const existing = votes.get(value) || { count: 0, totalConfidence: 0, models: [] };
          existing.count++;
          existing.totalConfidence += attr.visualConfidence || 0;
          existing.models.push(id);
          votes.set(value, existing);
        }
      });

      if (votes.size === 0) {
        fusedAttributes[key] = null;
        continue;
      }

      // Find winner (most votes, then highest confidence)
      interface WinnerData {
        count: number;
        totalConfidence: number;
        models: string[];
      }
      
      let winnerValue: string | null = null;
      let winnerData: WinnerData | null = null;
      let maxVotes = 0;
      let maxConfidence = 0;

      votes.forEach((data, value) => {
        if (data.count > maxVotes || (data.count === maxVotes && data.totalConfidence > maxConfidence)) {
          winnerValue = value;
          winnerData = data as WinnerData;
          maxVotes = data.count;
          maxConfidence = data.totalConfidence;
        }
      });

      if (winnerValue && winnerData) {
        const data = winnerData as WinnerData;
        const agreement = data.count / results.length;
        
        fusedAttributes[key] = {
          rawValue: winnerValue,
          schemaValue: winnerValue,
          visualConfidence: Math.round(data.totalConfidence / data.count),
          isNewDiscovery: false,
          mappingConfidence: Math.round(agreement * 100),
          reasoning: `Voted by ${data.count}/${results.length} models: ${data.models.join(', ')}`
        };

        if (agreement === 1.0) stats.unanimous++;
        else if (agreement >= 0.5) stats.majority++;
        else stats.split++;

        stats.agreements.push({
          attribute: key,
          value: winnerValue,
          votes: data.count,
          total: results.length,
          models: data.models
        });
      } else {
        fusedAttributes[key] = null;
      }
    }

    console.log(`   📊 Voting Stats: ${stats.unanimous} unanimous, ${stats.majority} majority, ${stats.split} split`);
    return { attributes: fusedAttributes, stats };
  }

  /**
   * CONFIDENCE-WEIGHTED FUSION: Weight each model's output by its confidence
   * Higher confidence models have more influence
   */
  private fuseByConfidenceWeighting(
    results: Array<{ id: string; result: EnhancedExtractionResult }>,
    schema: SchemaItem[]
  ): { attributes: AttributeData; stats: any } {
    console.log(`⚖️  Using CONFIDENCE-WEIGHTED fusion (quality matters)`);
    
    const fusedAttributes: AttributeData = {};
    const stats = {
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      weightedAvg: 0
    };

    for (const schemaItem of schema) {
      const key = schemaItem.key;
      const candidates = new Map<string, { totalWeight: number; maxConfidence: number; models: string[] }>();

      // Collect weighted votes
      results.forEach(({ id, result }) => {
        const attr = result.attributes[key];
        if (attr && attr.schemaValue !== null) {
          const value = String(attr.schemaValue);
          const confidence = attr.visualConfidence || 0;
          const weight = confidence / 100; // Convert to 0-1 range

          const existing = candidates.get(value) || { totalWeight: 0, maxConfidence: 0, models: [] };
          existing.totalWeight += weight;
          existing.maxConfidence = Math.max(existing.maxConfidence, confidence);
          existing.models.push(id);
          candidates.set(value, existing);
        }
      });

      if (candidates.size === 0) {
        fusedAttributes[key] = null;
        continue;
      }

      // Find highest weighted value
      interface CandidateData {
        totalWeight: number;
        maxConfidence: number;
        models: string[];
      }
      
      let winnerValue: string | null = null;
      let winnerData: CandidateData | null = null;
      let maxWeight = 0;

      candidates.forEach((data, value) => {
        if (data.totalWeight > maxWeight) {
          winnerValue = value;
          winnerData = data as CandidateData;
          maxWeight = data.totalWeight;
        }
      });

      if (winnerValue && winnerData) {
        const data = winnerData as CandidateData;
        const finalConfidence = Math.round(data.maxConfidence);
        fusedAttributes[key] = {
          rawValue: winnerValue,
          schemaValue: winnerValue,
          visualConfidence: finalConfidence,
          isNewDiscovery: false,
          mappingConfidence: Math.round((data.totalWeight / results.length) * 100),
          reasoning: `Confidence-weighted: ${data.models.join(', ')}`
        };

        if (finalConfidence >= 85) stats.highConfidence++;
        else if (finalConfidence >= 70) stats.mediumConfidence++;
        else stats.lowConfidence++;
      } else {
        fusedAttributes[key] = null;
      }
    }

    stats.weightedAvg = this.calculateOverallConfidence(fusedAttributes);
    console.log(`   📊 Confidence: ${stats.highConfidence} high, ${stats.mediumConfidence} medium, ${stats.lowConfidence} low`);
    return { attributes: fusedAttributes, stats };
  }

  /**
   * BEST-ONLY FUSION: Use the model with highest overall confidence
   * Fallback to other models only for missing attributes
   */
  private fuseBestOnly(
    results: Array<{ id: string; result: EnhancedExtractionResult }>,
    schema: SchemaItem[]
  ): { attributes: AttributeData; stats: any } {
    console.log(`🏆 Using BEST-ONLY fusion (highest confidence)`);
    
    // Find best model by overall confidence
    const sortedResults = results.sort((a, b) => (b.result?.confidence || 0) - (a.result?.confidence || 0));
    const bestModel = sortedResults[0];
    
    console.log(`   🥇 Best model: ${bestModel.id} (${bestModel.result?.confidence}% confidence)`);
    
    const fusedAttributes: AttributeData = { ...bestModel.result.attributes };
    const stats = {
      primaryModel: bestModel.id,
      primaryConfidence: bestModel.result.confidence,
      fallbacksUsed: 0,
      fallbackDetails: [] as any[]
    };

    // Fill in missing attributes from other models
    for (const schemaItem of schema) {
      const key = schemaItem.key;
      if (!fusedAttributes[key] || fusedAttributes[key] === null) {
        // Find best alternative for this attribute
        for (const { id, result } of sortedResults.slice(1)) {
          const attr = result.attributes[key];
          if (attr && attr.schemaValue !== null) {
            fusedAttributes[key] = {
              ...attr,
              reasoning: `Fallback from ${id} (primary model missing this attribute)`
            };
            stats.fallbacksUsed++;
            stats.fallbackDetails.push({ attribute: key, model: id });
            break;
          }
        }
      }
    }

    console.log(`   📊 Used ${stats.fallbacksUsed} fallback attributes from other models`);
    return { attributes: fusedAttributes, stats };
  }

  private calculateOverallConfidence(attributes: AttributeData): number {
    const values = Object.values(attributes).filter(attr => attr !== null);
    if (values.length === 0) return 0;
    
    const totalConfidence = values.reduce((sum, attr) => sum + (attr?.visualConfidence || 0), 0);
    return Math.round(totalConfidence / values.length);
  }
}
