import type { DiscoveredAttribute,  SchemaItem } from '../../../types/extraction/ExtractionTypes';
import { logger } from '../../../utils/common/logger';

export class DiscoveryManager {
  private static instance: DiscoveryManager;
  private discoveries: Map<string, DiscoveredAttribute> = new Map();
  private categoryDiscoveries: Map<string, Set<string>> = new Map();
  private sessionStats = {
    totalExtractions: 0,
    totalDiscoveries: 0,
    uniqueDiscoveries: 0
  };

  static getInstance(): DiscoveryManager {
    if (!DiscoveryManager.instance) {
      DiscoveryManager.instance = new DiscoveryManager();
    }
    return DiscoveryManager.instance;
  }

  addDiscoveries(newDiscoveries: DiscoveredAttribute[], categoryName?: string): void {
    this.sessionStats.totalExtractions++;
    this.sessionStats.totalDiscoveries += newDiscoveries.length;

    newDiscoveries.forEach(discovery => {
      const existing = this.discoveries.get(discovery.key);
      
      if (existing) {
        // Update existing discovery
        existing.frequency += 1;
        existing.confidence = Math.round(
          (existing.confidence * (existing.frequency - 1) + discovery.confidence) / existing.frequency
        );
        
        // Merge possible values for select types
        if (existing.suggestedType === 'select' && discovery.normalizedValue) {
          if (!existing.possibleValues) existing.possibleValues = [];
          if (!existing.possibleValues.includes(discovery.normalizedValue)) {
            existing.possibleValues.push(discovery.normalizedValue);
            existing.possibleValues.sort();
          }
        }
        
        // Update with latest reasoning
        existing.reasoning = discovery.reasoning;
        existing.isPromotable = this.isPromotable(existing);
      } else {
        // Add new discovery
        const newDiscovery: DiscoveredAttribute = { 
          ...discovery, 
          frequency: 1,
          isPromotable: false
        };
        
        this.discoveries.set(discovery.key, newDiscovery);
        this.sessionStats.uniqueDiscoveries++;
      }
      
      // Track by category
      if (categoryName) {
        if (!this.categoryDiscoveries.has(categoryName)) {
          this.categoryDiscoveries.set(categoryName, new Set());
        }
        this.categoryDiscoveries.get(categoryName)!.add(discovery.key);
      }
    });

    logger.info('Discoveries processed', {
      newDiscoveries: newDiscoveries.length,
      totalUnique: this.discoveries.size,
      categoryName
    });
  }

  getDiscoveriesForCategory(categoryName?: string): DiscoveredAttribute[] {
    if (!categoryName) {
      return Array.from(this.discoveries.values())
        .sort((a, b) => this.getDiscoveryScore(b) - this.getDiscoveryScore(a));
    }
    
    const categoryKeys = this.categoryDiscoveries.get(categoryName);
    if (!categoryKeys) return [];
    
    return Array.from(categoryKeys)
      .map(key => this.discoveries.get(key)!)
      .filter(Boolean)
      .sort((a, b) => this.getDiscoveryScore(b) - this.getDiscoveryScore(a));
  }

  getPromotableDiscoveries(minFrequency = 2, minConfidence = 75): DiscoveredAttribute[] {
    return Array.from(this.discoveries.values())
      .filter(d => d.frequency >= minFrequency && d.confidence >= minConfidence)
      .sort((a, b) => this.getDiscoveryScore(b) - this.getDiscoveryScore(a));
  }

  

  promoteToSchema(discoveryKey: string): SchemaItem | null {
    const discovery = this.discoveries.get(discoveryKey);
    if (!discovery || !discovery.isPromotable) return null;
    
    const schemaItem: SchemaItem = {
      key: discovery.key,
      label: discovery.label,
      type: discovery.suggestedType,
      required: false,
      allowedValues: discovery.suggestedType === 'select' ? discovery.possibleValues?.map(val => ({ shortForm: val })) : undefined,
      description: `Auto-discovered: ${discovery.reasoning.substring(0, 100)}...`
    };

    logger.info('Discovery promoted to schema', {
      key: discovery.key,
      frequency: discovery.frequency,
      confidence: discovery.confidence
    });

    return schemaItem;
  }

  private getDiscoveryScore(discovery: DiscoveredAttribute): number {
    // Score = frequency * confidence * type_weight
    const typeWeight = discovery.suggestedType === 'select' ? 1.2 : 1.0;
    return discovery.frequency * discovery.confidence * typeWeight;
  }

  private isPromotable(discovery: DiscoveredAttribute): boolean {
    return discovery.frequency >= 2 && 
           discovery.confidence >= 75 && 
           discovery.normalizedValue.length > 0;
  }

  getSessionStats() {
    return { ...this.sessionStats };
  }

  clear(): void {
    this.discoveries.clear();
    this.categoryDiscoveries.clear();
    this.sessionStats = { totalExtractions: 0, totalDiscoveries: 0, uniqueDiscoveries: 0 };
    logger.info('Discovery manager cleared');
  }

  
}

// Singleton instance
export const discoveryManager = DiscoveryManager.getInstance();
