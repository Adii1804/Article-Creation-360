import type { AttributeDefinition } from '../../types/category/CategoryTypes';
import type { AttributeData } from '../../types/extraction/ExtractionTypes';

/**
 * UNIVERSAL ATTRIBUTE PROCESSOR
 * 
 * Processes ALL extraction results by:
 * 1. Matching extracted values against schema allowedValues (exact match priority)
 * 2. Smart range detection for size/GSM attributes
 * 3. Fallback to raw value if no schema match found
 */

export class AttributeProcessor {
  
  /**
   * MAIN PROCESSING METHOD
   * Processes extracted value to find best match in schema or return raw value
   */
  public static processExtractionResult(
    attributeKey: string,
    extractedValue: string,
    attributeDefinition: AttributeDefinition
  ): string {
    
    if (!extractedValue?.trim()) {
      return extractedValue;
    }

    const cleanValue = extractedValue.trim();
    
    // 1. Try exact schema match first (highest priority)
    if (attributeDefinition.allowedValues) {
      const exactMatch = this.findExactSchemaMatch(cleanValue, attributeDefinition.allowedValues, attributeKey);
      if (exactMatch) {
        console.log(`✅ Exact Schema Match [${attributeKey}]: "${extractedValue}" → "${exactMatch}"`);
        return exactMatch;
      }
    }

    // OCR-only major_category: do NOT fuzzy-match or range-normalize; return raw if no exact match
    if (attributeKey === 'major_category') {
      console.log(`📝 Raw Value [${attributeKey}]: "${extractedValue}" (OCR-only, no fuzzy mapping)`);
      return cleanValue;
    }

    // 2. Try fuzzy/partial matching for common cases
    if (attributeDefinition.allowedValues) {
      const fuzzyMatch = this.findFuzzySchemaMatch(cleanValue, attributeDefinition.allowedValues);
      if (fuzzyMatch) {
        console.log(`🔍 Fuzzy Schema Match [${attributeKey}]: "${extractedValue}" → "${fuzzyMatch}"`);
        return fuzzyMatch;
      }
    }

    // 3. Apply range detection if configured
    if (attributeDefinition.rangeConfig?.enableRangeDetection) {
      const rangeMatch = this.detectRangeValue(cleanValue, attributeDefinition);
      if (rangeMatch && rangeMatch !== cleanValue) {
        console.log(`Range Detection [${attributeKey}]: "${extractedValue}" → "${rangeMatch}"`);
        return rangeMatch;
      }
    }

    // 4. Fallback to raw value ONLY for non-select attributes
    if (!attributeDefinition.allowedValues || attributeDefinition.allowedValues.length === 0) {
      console.log(`📝 Raw Value [${attributeKey}]: "${extractedValue}" (no schema match)`);
      return extractedValue;
    }

    if (attributeKey === 'major_category') {
      console.log(`📝 Raw Value [${attributeKey}]: "${extractedValue}" (major_category OCR fallback)`);
      return extractedValue;
    }

    console.log(`❌ NO SEMANTIC MATCH: "${extractedValue}" - RETURNING NULL (value not in allowed schema)`);
    return null;
  }

  /**
   * 🧠 CONTEXTUAL INTELLIGENCE PROCESSOR
   * Uses context between attributes for smarter matching
   */
  public static processBatchResults(
    results: AttributeData,
    attributeDefinitions: Record<string, AttributeDefinition>
  ): AttributeData {
    
    const processedResults: AttributeData = { ...results };
    
    console.log('Processing extraction results:', Object.keys(results));
    
    // STEP 1: Analyze context from all extracted values
    const extractionContext = this.analyzeExtractionContext(results);
    console.log('🧠 Extraction context:', extractionContext);
    
    for (const [key, attributeDetail] of Object.entries(results)) {
      const attributeDef = attributeDefinitions[key];
      
      if (attributeDetail && typeof attributeDetail === 'object') {
        // Get the original extracted value - could be in schemaValue or rawValue
        let originalValue = attributeDetail.rawValue || attributeDetail.schemaValue;
        
        if (originalValue && typeof originalValue === 'string' && originalValue.trim()) {
          originalValue = originalValue.trim();
          
          // 🔍 DEBUG: Log for specific attributes
          if (key === 'fab_weave-02') {
            console.log(`🔍 [PROCESSOR] fab_weave-02 BEFORE processing:`, {
              key,
              originalValue,
              rawValue: attributeDetail.rawValue,
              schemaValue: attributeDetail.schemaValue,
              fullAttributeDetail: attributeDetail
            });
          }
          
          console.log(`📝 Processing [${key}]: "${originalValue}"`);
          
          // Check if it's a null-like value first
          if (this.isNullLikeValue(originalValue)) {
            console.log(`🚫 Null-like value detected [${key}]: "${originalValue}" → showing blank`);
            processedResults[key] = {
              ...attributeDetail,
              schemaValue: null, // Will show blank in UI
              rawValue: null,
              mappingConfidence: 0,
              reasoning: 'Null-like value detected (unknown, null, etc.)'
            };
            continue;
          }
          
          // Try to find best match if we have schema definition
          let finalSchemaValue: string | null = null;
          let matchFound = false;
          
          if (attributeDef) {
            const processedValue = this.processExtractionResult(key, originalValue, attributeDef);
            if (processedValue) {
              // processedValue exists - either transformed or exact match
              finalSchemaValue = processedValue;
              matchFound = true;
              if (processedValue !== originalValue) {
                console.log(`✅ Schema match found [${key}]: "${originalValue}" → "${processedValue}"`);
              } else {
                console.log(`✅ Exact schema match [${key}]: "${originalValue}"`);
              }
            } else {
              // No schema match - do NOT show raw value for select attributes
              if (attributeDef.allowedValues && attributeDef.allowedValues.length > 0) {
                finalSchemaValue = null;
                console.log(`⚪ Unmatched value [${key}] for select attribute → showing blank`);
              } else if (this.isValidRawValue(originalValue)) {
                finalSchemaValue = originalValue; // Show meaningful raw value
                console.log(`📄 Valid raw value [${key}]: "${originalValue}"`);
              } else {
                finalSchemaValue = null; // Show blank for unclear values
                console.log(`⚪ Unclear value [${key}]: "${originalValue}" → showing blank`);
              }
            }
          } else {
            // No attribute definition - show raw value if valid
            if (this.isValidRawValue(originalValue)) {
              finalSchemaValue = originalValue;
              console.log(`⚠️ No schema definition [${key}]: showing raw value "${originalValue}"`);
            } else {
              finalSchemaValue = null;
              console.log(`⚠️ No schema definition + unclear value [${key}]: showing blank`);
            }
          }
          
          // Always update with intelligent values
          processedResults[key] = {
            ...attributeDetail,
            schemaValue: finalSchemaValue, // Schema match, valid raw value, or null
            rawValue: String(originalValue), // Always preserve original for debugging
            mappingConfidence: matchFound ? 95 : (finalSchemaValue ? 75 : 0),
            reasoning: matchFound 
              ? `AI extracted: "${originalValue}" → Schema matched: "${finalSchemaValue}"` 
              : finalSchemaValue 
                ? `AI extracted: "${originalValue}" (no schema match, showing raw value)`
                : `AI extracted: "${originalValue}" (unclear/null-like value, showing blank)`
          };
          
        } else {
          // Handle empty/null values
          console.log(`❌ Empty value for [${key}]`);
          processedResults[key] = {
            ...attributeDetail,
            schemaValue: null,
            rawValue: null,
            mappingConfidence: 0,
            reasoning: 'No value extracted'
          };
        }
      }
    }

    // Post-process: default child_belt when missing and father_belt is present
    if ('child_belt' in processedResults) {
      const child = processedResults.child_belt;
      const father = processedResults.father_belt;
      const childDef = attributeDefinitions.child_belt;

      if ((child === null || child?.schemaValue === null) && father && childDef?.allowedValues?.length) {
        const fatherValue = String(father.schemaValue || father.rawValue || '');
        const elasticFatherBelts = ['ELS_BLT', 'IE', 'OE', 'HLF_ELS_BLT', '3/4 ELS_BLT', 'FLEXI'];
        const desired = elasticFatherBelts.includes(fatherValue) ? 'SLF GTHR BLT' : 'SELF C&S BLT';
        const hasDesired = childDef.allowedValues.some(v => v.shortForm === desired);
        if (hasDesired) {
          processedResults.child_belt = {
            schemaValue: desired,
            rawValue: desired,
            isNewDiscovery: false,
            visualConfidence: 60,
            mappingConfidence: 60,
            reasoning: elasticFatherBelts.includes(fatherValue)
              ? 'Elastic waistband; defaulted to SELF GATHER BELT'
              : 'Fixed waistband; defaulted to SELF CUT & SEW BELT'
          };
        }
      }
    }

    // Post-process: default bottom_fold when missing and allowed values include BTM_OPEN
    if ('bottom_fold' in processedResults) {
      const bottom = processedResults.bottom_fold;
      const bottomDef = attributeDefinitions.bottom_fold;
      if ((bottom === null || bottom?.schemaValue === null) && bottomDef?.allowedValues?.length) {
        const hasDefault = bottomDef.allowedValues.some(v => v.shortForm === 'BTM OPEN');
        if (hasDefault) {
          processedResults.bottom_fold = {
            schemaValue: 'BTM OPEN',
            rawValue: 'BTM OPEN',
            isNewDiscovery: false,
            visualConfidence: 60,
            mappingConfidence: 60,
            reasoning: 'Bottom fold not detected; defaulted to BOTTOM OPEN'
          };
        }
      }
    }

    // Post-process: Knit major categories cannot use Y/D CHK; prefer PRT CHK if available
    if (processedResults.pattern && processedResults.major_category) {
      const majorCategory = String(processedResults.major_category.schemaValue || processedResults.major_category.rawValue || '').toLowerCase();
      const patternValue = String(processedResults.pattern.schemaValue || processedResults.pattern.rawValue || '').toUpperCase();
      const patternDef = attributeDefinitions.pattern;

      if (majorCategory.includes('knit') && patternValue === 'Y/D CHK') {
        const printedCheck = patternDef?.allowedValues?.find(v => v.shortForm === 'PRT CHK');
        if (printedCheck) {
          processedResults.pattern = {
            ...processedResults.pattern,
            schemaValue: 'PRT CHK',
            rawValue: 'PRT CHK',
            mappingConfidence: 70,
            reasoning: 'Knit category: replaced Y/D CHK with PRT CHK'
          };
        } else {
          processedResults.pattern = {
            ...processedResults.pattern,
            schemaValue: null,
            rawValue: null,
            mappingConfidence: 0,
            reasoning: 'Knit category: Y/D CHK not allowed'
          };
        }
      }
    }

    // Post-process: Denim rule for men/ladies major category
    if (processedResults.major_category && processedResults.division) {
      const divisionValue = String(processedResults.division.schemaValue || processedResults.division.rawValue || '').toLowerCase();
      const majorRaw = String(processedResults.major_category.schemaValue || processedResults.major_category.rawValue || '').toLowerCase();
      const majorDef = attributeDefinitions.major_category;
      const isDenim = majorRaw.includes('jean') || majorRaw.includes('denim');

      if (isDenim && majorDef?.allowedValues?.length) {
        if (divisionValue.includes('men')) {
          const hasMenJeans = majorDef.allowedValues.some(v => v.shortForm === 'M_JEANS');
          if (hasMenJeans) {
            processedResults.major_category = {
              ...processedResults.major_category,
              schemaValue: 'M_JEANS',
              rawValue: 'M_JEANS',
              mappingConfidence: 90,
              reasoning: 'Men denim rule: forced to M_JEANS'
            };
          }
        }

        if (divisionValue.includes('ladies')) {
          const hasLadiesJeans = majorDef.allowedValues.some(v => v.shortForm === 'L_JEANS');
          if (hasLadiesJeans) {
            processedResults.major_category = {
              ...processedResults.major_category,
              schemaValue: 'L_JEANS',
              rawValue: 'L_JEANS',
              mappingConfidence: 90,
              reasoning: 'Ladies denim rule: forced to L_JEANS'
            };
          }
        }
      }
    }

    // Post-process: Jeans straight/regular alignment
    if (processedResults.fit && processedResults.major_category) {
      const majorRaw = String(processedResults.major_category.schemaValue || processedResults.major_category.rawValue || '').toLowerCase();
      const fitValue = String(processedResults.fit.schemaValue || processedResults.fit.rawValue || '').toUpperCase();
      const isDenim = majorRaw.includes('jean') || majorRaw.includes('denim');

      if (isDenim && (fitValue === 'STRT_FIT' || fitValue === 'STRAIGHT')) {
        processedResults.fit = {
          ...processedResults.fit,
          schemaValue: 'REG FIT',
          rawValue: 'REG FIT',
          mappingConfidence: 85,
          reasoning: 'Jeans rule: straight cut treated as REG FIT'
        };
      }
    }

    // Post-process: Denim rule - TWILL weave not allowed for jeans/denim
    if (processedResults.weave && processedResults.major_category) {
      const majorRaw = String(processedResults.major_category.schemaValue || processedResults.major_category.rawValue || '').toLowerCase();
      const weaveValue = String(processedResults.weave.schemaValue || processedResults.weave.rawValue || '').toLowerCase();
      const isDenim = majorRaw.includes('jean') || majorRaw.includes('denim');

      if (isDenim && (weaveValue === 'twill' || weaveValue.includes('twill') || weaveValue === 'twl')) {
        processedResults.weave = {
          ...processedResults.weave,
          schemaValue: null,
          rawValue: null,
          mappingConfidence: 0,
          reasoning: 'Denim rule: TWILL weave not allowed for jeans/denim'
        };
      }
    }

    // Post-process: avoid false WIDE_LEG for jeans unless high confidence
    if (processedResults.fit && processedResults.major_category) {
      const fitValue = String(processedResults.fit.schemaValue || processedResults.fit.rawValue || '').toUpperCase();
      const majorCategory = String(processedResults.major_category.schemaValue || processedResults.major_category.rawValue || '').toLowerCase();
      const fitConfidence = processedResults.fit.visualConfidence ?? 0;

      if (majorCategory.includes('jean') && fitValue === 'WIDE_LEG' && fitConfidence < 85) {
        console.log(`👖 FIT SAFEGUARD: Low-confidence WIDE_LEG for jeans → null (confidence ${fitConfidence})`);
        processedResults.fit = {
          ...processedResults.fit,
          schemaValue: null,
          rawValue: null,
          mappingConfidence: 0,
          reasoning: 'Low-confidence WIDE_LEG for jeans; set to null'
        };
      }
    }
    
    return processedResults;
  }

  /**
   * 🧠 CONTEXTUAL ANALYSIS  
   * Analyzes all extracted values to understand garment context
   */
  private static analyzeExtractionContext(results: AttributeData): {
    fabricType?: 'knit' | 'woven' | 'denim';
    garmentType?: string;
    dominantColors?: string[];
    isStructured?: boolean;
    confidence: number;
  } {
    const context: {
      fabricType?: 'knit' | 'woven' | 'denim';
      garmentType?: string;
      dominantColors?: string[];
      isStructured?: boolean;
      confidence: number;
    } = { confidence: 0 };
    
    // Analyze fabric division context
    const fabDiv = results.fab_division;
    if (fabDiv?.rawValue || fabDiv?.schemaValue) {
      const fabricValue = String(fabDiv.rawValue || fabDiv.schemaValue || '').toLowerCase();
      
      if (fabricValue.includes('knit') || fabricValue.includes('k')) {
        context.fabricType = 'knit';
        context.isStructured = false;
        context.confidence += 0.4;
        console.log('🧵 CONTEXT: Identified as KNIT fabric');
      } else if (fabricValue.includes('denim') || fabricValue.includes('dnm')) {
        context.fabricType = 'denim';
        context.isStructured = true;
        context.confidence += 0.4;
        console.log('🧵 CONTEXT: Identified as DENIM fabric');
      } else if (fabricValue.includes('woven') || fabricValue.includes('w')) {
        context.fabricType = 'woven';
        context.isStructured = true;
        context.confidence += 0.4;
        console.log('🧵 CONTEXT: Identified as WOVEN fabric');
      }
    }
    
    // Analyze garment type context
    const garmentIndicators = ['shirt', 'pant', 'dress', 'jacket', 'sweater'];
    for (const detail of Object.values(results)) {
      const value = String(detail?.rawValue || detail?.schemaValue || '').toLowerCase();
      for (const garment of garmentIndicators) {
        if (value.includes(garment)) {
          context.garmentType = garment;
          context.confidence += 0.2;
          console.log(`👕 CONTEXT: Identified as ${garment.toUpperCase()}`);
          break;
        }
      }
    }

    // Analyze color context
    const colors: string[] = [];
    for (const [key, detail] of Object.entries(results)) {
      if (key.includes('color') || key.includes('shade')) {
        const colorValue = String(detail?.rawValue || detail?.schemaValue || '').toLowerCase();
        if (colorValue && colorValue !== 'null' && colorValue.length > 2) {
          colors.push(colorValue);
        }
      }
    }
    context.dominantColors = colors;
    
    return context;
  }

  /**
   * 🧠 HUMAN-LIKE TEXT NORMALIZATION
   * Cleans text the way humans mentally process it
   */
  private static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, '') // Remove all spaces
      .trim();
  }

  /**
   * 🧠 PRECISE SEMANTIC MATCHING
   * Uses semantic understanding, not just string similarity
   */
  private static findExactSchemaMatch(
    value: string, 
    allowedValues: Array<{shortForm: string; fullForm?: string}>,
    attributeKey?: string
  ): string | null {
    // 1. Filter out null-like values first
    if (this.isNullLikeValue(value)) {
      return null;
    }

    // 2. Clean and normalize for exact comparison (prefer exact matches first)
    const normalizedValue = this.normalizeText(value);
    const upperValue = value.toUpperCase();
    
    for (const allowed of allowedValues) {
      // PRIORITY 1: Match against fullForm first (human readable)
      if (allowed.fullForm) {
        const normalizedFull = this.normalizeText(allowed.fullForm);
        const upperFull = allowed.fullForm.toUpperCase();
        
        // Check normalized match
        if (normalizedValue === normalizedFull) {
          return allowed.shortForm;
        }
        
        // Check capital letter match (schema intelligence)
        if (upperValue === upperFull) {
          return allowed.shortForm;
        }
      }
      
      // PRIORITY 2: Match against shortForm as fallback
      const normalizedShort = this.normalizeText(allowed.shortForm);
      const upperShort = allowed.shortForm.toUpperCase();
      
      if (normalizedValue === normalizedShort || upperValue === upperShort) {
        return allowed.shortForm;
      }
    }
    
    // 3. Semantic word matching (fallback only)
    const bestSemanticMatch = this.findSemanticMatch(value, allowedValues, attributeKey);
    if (bestSemanticMatch) {
      return bestSemanticMatch;
    }

    return null;
  }

  /**
   * ULTRA-STRICT SEMANTIC MATCHING  
   * Only matches when 100% semantically correct
   */
  private static findSemanticMatch(
    value: string,
    allowedValues: Array<{shortForm: string; fullForm?: string}>,
    attributeKey?: string
  ): string | null {
    const valueLower = value.toLowerCase();
    
    // CRITICAL: Check for negative/absence indicators first
    const negativeWords = ['no', 'none', 'without', 'absent', 'missing', 'not', 'zero'];
    const hasNegative = negativeWords.some(neg => valueLower.includes(neg));
    
    if (hasNegative) {
      console.log(`🚫 Negative indicator detected in "${value}" - rejecting all schema matches`);
      return null; // Never match "no pockets" to pocket types!
    }
    
    // 🧵 CRITICAL FABRIC TYPE SAFEGUARDS
    // These patterns MUST be handled correctly to prevent fabric type confusion
    const fabricSafeguards = [
      { pattern: /knit|knitted|jersey|stretch/i, correctMatch: 'K', incorrectMatches: ['DNM', 'W'] },
      { pattern: /denim|jean|dungaree/i, correctMatch: 'DNM', incorrectMatches: ['K', 'W'] },
      { pattern: /woven|non.?stretch|structured/i, correctMatch: 'W', incorrectMatches: ['K', 'DNM'] }
    ];
    
    for (const safeguard of fabricSafeguards) {
      if (safeguard.pattern.test(valueLower)) {
        // Check if the correct match exists in allowed values
        const correctOption = allowedValues.find(opt => opt.shortForm === safeguard.correctMatch);
        if (correctOption) {
          console.log(`🧵 FABRIC SAFEGUARD: "${value}" → FORCED to "${safeguard.correctMatch}" (preventing confusion)`);
          return correctOption.shortForm;
        }
        
        // Block incorrect matches
        const incorrectMatches = allowedValues.filter(opt => 
          safeguard.incorrectMatches.includes(opt.shortForm)
        );
        if (incorrectMatches.length > 0) {
          console.log(`🚨 FABRIC SAFEGUARD: Blocking incorrect matches for "${value}": ${incorrectMatches.map(m => m.shortForm).join(', ')}`);
          return null; // Reject all matches if we can't find the correct one
        }
      }
    }

    // 👕 CRITICAL SLEEVE TYPE SAFEGUARDS
    // These patterns help distinguish between different sleeve styles for T-shirts and garments
    const sleeveSafeguards = [
      { pattern: /short\s*(sleeve)?|regular\s*(sleeve)?|standard\s*(sleeve)?|t.?shirt\s*(sleeve)?/i, correctMatch: 'SHORT_SLV', fallback: 'REG_SLV' },
      { pattern: /half\s*(sleeve)?|mid\s*(sleeve)?|elbow/i, correctMatch: 'HS_FLAT_TPNG', fallback: 'SHORT_SLV' },
      { pattern: /cap\s*(sleeve)?|very\s*short|minimal\s*(sleeve)?/i, correctMatch: 'CAP', fallback: 'CAP_SLV' },
      { pattern: /quarter\s*(sleeve)?|3\/4\s*(sleeve)?|three.?quarter/i, correctMatch: 'QTR_SLV', fallback: 'SHORT_SLV' },
      { pattern: /sleeveless|tank|no\s*sleeve|armless/i, correctMatch: 'SL', fallback: null }
    ];
    
    for (const sleeveSafeguard of sleeveSafeguards) {
      if (sleeveSafeguard.pattern.test(valueLower)) {
        // Try primary match first
        let correctOption = allowedValues.find(opt => opt.shortForm === sleeveSafeguard.correctMatch);
        if (correctOption) {
          console.log(`👕 SLEEVE SAFEGUARD: "${value}" → MATCHED to "${sleeveSafeguard.correctMatch}" (sleeve intelligence)`);
          return correctOption.shortForm;
        }
        
        // Try fallback if primary not available
        if (sleeveSafeguard.fallback) {
          correctOption = allowedValues.find(opt => opt.shortForm === sleeveSafeguard.fallback);
          if (correctOption) {
            console.log(`👕 SLEEVE SAFEGUARD: "${value}" → FALLBACK to "${sleeveSafeguard.fallback}" (sleeve intelligence)`);
            return correctOption.shortForm;
          }
        }
      }
    }

    // 👛 CRITICAL POCKET TYPE SAFEGUARDS
    // These patterns help distinguish between pocket presence vs absence
    const pocketSafeguards = [
      { pattern: /no\s*(pockets?|pocket)|without\s*(pockets?|pocket)|none|absent/i, correctMatch: 'NO_PKT', fallback: null },
      { pattern: /kangaroo|pouch\s*(pocket)?|front\s*pouch/i, correctMatch: 'KNG_PKT', fallback: 'PATCH_PKT' },
      { pattern: /patch\s*(pocket)?|applied\s*(pocket)?|surface\s*(pocket)?/i, correctMatch: 'PATCH_PKT', fallback: null },
      { pattern: /side\s*(pocket)?|lateral\s*(pocket)?/i, correctMatch: 'SIDE POCKET', fallback: 'PATCH_PKT' },
      { pattern: /zip(per)?\s*(pocket)?|zipper\s*(pocket)?/i, correctMatch: 'ZIPPER_PKT', fallback: 'PKT WITH ZIP' },
      { pattern: /welt\s*(pocket)?|inset\s*(pocket)?/i, correctMatch: 'WELT_PKT', fallback: 'PATCH_PKT' }
    ];
    
    for (const pocketSafeguard of pocketSafeguards) {
      if (pocketSafeguard.pattern.test(valueLower)) {
        // Try primary match first
        let correctOption = allowedValues.find(opt => opt.shortForm === pocketSafeguard.correctMatch);
        if (correctOption) {
          console.log(`👛 POCKET SAFEGUARD: "${value}" → MATCHED to "${pocketSafeguard.correctMatch}" (pocket intelligence)`);
          return correctOption.shortForm;
        }
        
        // Try fallback if primary not available
        if (pocketSafeguard.fallback) {
          correctOption = allowedValues.find(opt => opt.shortForm === pocketSafeguard.fallback);
          if (correctOption) {
            console.log(`👛 POCKET SAFEGUARD: "${value}" → FALLBACK to "${pocketSafeguard.fallback}" (pocket intelligence)`);
            return correctOption.shortForm;
          }
        }
        
        // CRITICAL: If pocket matched but not in schema - RETURN NULL
        console.log(`👛 POCKET SAFEGUARD: "${value}" matched pattern but not in schema - RETURNING NULL`);
        return null;
      }
    }

    // 👖 CRITICAL FIT SAFEGUARDS
    if (attributeKey === 'fit') {
      const fitSafeguards = [
        { pattern: /wide\s*leg|wideleg/i, shortForms: ['WIDE_LEG'] },
        { pattern: /boot\s*cut|bootcut/i, shortForms: ['B_CUT'] },
        { pattern: /bell\s*bottom|bellbottom/i, shortForms: ['BL_BTM'] },
        { pattern: /balloon|ballon|ballon\s*fit/i, shortForms: ['BLN_FIT'] },
        { pattern: /baggy|baggy\s*fit/i, shortForms: ['BGY_FIT'] },
        { pattern: /boxy|boxy\s*fit/i, shortForms: ['BOXY'] },
        { pattern: /straight|straight\s*fit/i, shortForms: ['STRT_FIT', 'STRAIGHT'] },
        { pattern: /tapered|taper|narrowing/i, shortForms: ['TAPRD'] },
        { pattern: /mom\s*fit/i, shortForms: ['MOM_FIT'] },
        { pattern: /slim\s*fit|slim/i, shortForms: ['SLIM FIT', 'SLIM_FIT'] },
        { pattern: /skinny\s*fit|skinny/i, shortForms: ['SKNY FIT', 'SKINNY FIT'] },
        { pattern: /narrow\s*fit|narrow/i, shortForms: ['NRW_FIT'] },
        { pattern: /regular\s*fit|regular/i, shortForms: ['REG FIT', 'REG_FIT'] },
        { pattern: /relax\s*fit|relaxed|loose|comfort\s*fit|easy\s*fit/i, shortForms: ['RLX FIT', 'RELAX FIT', 'BGY_FIT'] }
      ];

      for (const fitSafeguard of fitSafeguards) {
        if (fitSafeguard.pattern.test(valueLower)) {
          for (const shortForm of fitSafeguard.shortForms) {
            const option = allowedValues.find(opt => opt.shortForm === shortForm);
            if (option) {
              console.log(`👖 FIT SAFEGUARD: "${value}" → MATCHED to "${shortForm}"`);
              return option.shortForm;
            }
          }

          console.log(`👖 FIT SAFEGUARD: "${value}" matched pattern but not in schema - RETURNING NULL`);
          return null;
        }
      }
    }

    // 🧷 CRITICAL PLACKET SAFEGUARDS
    // Map common placket phrasing to exact allowed shortForms
    if (attributeKey === 'placket') {
      const placketSafeguards = [
        { pattern: /no\s*placket|without\s*placket|none/i, correctMatch: null, blockMatch: true },
        { pattern: /concealed\s*zip|hidden\s*zip/i, correctMatch: 'CON. ZIP PLKT', fallback: 'ZIP PLKT' },
        { pattern: /zip\s*\+\s*button|zip\s*and\s*button/i, correctMatch: 'ZIP + BTN PLKT', fallback: 'ZIP PLKT' },
        { pattern: /gold(\s*en)?\s*zip/i, correctMatch: 'GOLD ZIP PLKT', fallback: 'ZIP PLKT' },
        { pattern: /silver\s*zip/i, correctMatch: 'SLV ZIP PLKT', fallback: 'ZIP PLKT' },
        { pattern: /multi\s*zip/i, correctMatch: 'MULT ZIP PLKT', fallback: 'ZIP PLKT' },
        { pattern: /zip|zipper/i, correctMatch: 'ZIP PLKT', fallback: null },
        { pattern: /polo/i, correctMatch: 'POLO PLKT', fallback: 'PLN PLKT' },
        { pattern: /rib\s*placket|ribbed\s*placket/i, correctMatch: 'RIB PLKT', fallback: 'PLN PLKT' },
        { pattern: /plain\s*placket|simple\s*placket/i, correctMatch: 'PLN PLKT', fallback: null },
        { pattern: /textile\s*placket/i, correctMatch: 'TXT PLKT', fallback: 'PLN PLKT' },
        { pattern: /brand\s*print\s*placket|branded\s*placket/i, correctMatch: 'BRND PRT PLKT', fallback: 'PLN PLKT' },
        { pattern: /central\s*placket/i, correctMatch: 'CTRL PLKT', fallback: 'PLN PLKT' },
        { pattern: /jacquard\s*placket|jaquard\s*placket/i, correctMatch: 'JAQ PLKT', fallback: 'PLN PLKT' },
        { pattern: /layer\s*placket/i, correctMatch: 'LAYER PLKT', fallback: 'PLN PLKT' },
        { pattern: /embroider|emb\s*placket/i, correctMatch: 'EMB PLKT', fallback: 'PLN PLKT' },
        { pattern: /double\s*placket|dbl\s*placket/i, correctMatch: 'DBL_PLKT', fallback: 'PLN PLKT' },
        { pattern: /non\s*functional/i, correctMatch: 'NON FUNCTIONAL', fallback: null }
      ];

      for (const placketSafeguard of placketSafeguards) {
        if (placketSafeguard.pattern.test(valueLower)) {
          if (placketSafeguard.blockMatch) {
            console.log(`🧷 PLACKET SAFEGUARD: Blocking "${value}" - return null`);
            return null;
          }

          if (placketSafeguard.correctMatch) {
            const correctOption = allowedValues.find(opt => opt.shortForm === placketSafeguard.correctMatch);
            if (correctOption) {
              console.log(`🧷 PLACKET SAFEGUARD: "${value}" → MATCHED to "${placketSafeguard.correctMatch}"`);
              return correctOption.shortForm;
            }
          }

          if (placketSafeguard.fallback) {
            const correctOption = allowedValues.find(opt => opt.shortForm === placketSafeguard.fallback);
            if (correctOption) {
              console.log(`🧷 PLACKET SAFEGUARD: "${value}" → FALLBACK to "${placketSafeguard.fallback}"`);
              return correctOption.shortForm;
            }
          }

          console.log(`🧷 PLACKET SAFEGUARD: "${value}" matched pattern but not in schema - RETURNING NULL`);
          return null;
        }
      }
    }

    // CRITICAL NECK TYPE SAFEGUARDS
    // Block incorrect "plain" detections and enforce proper neck construction identification
    const neckSafeguards = [
      // Block meaningless terms
      { pattern: /^plain$|^simple$|^basic$|^standard$/i, correctMatch: null, blockMatch: true },
      
      // Proper neck constructions
      { pattern: /rib\s*(neck|collar)?|ribbed\s*(neck|collar)?/i, correctMatch: 'DTM RIB NK', fallback: 'RIB PLN CLR' },
      { pattern: /crew\s*(neck)?|round\s*(neck)?|circular\s*(neck)?/i, correctMatch: 'DTM RIB NK', fallback: 'RIB PLN CLR' },
      { pattern: /henley|button\s*(neck|placket)/i, correctMatch: 'HNL_NK 2 BTN', fallback: 'HNL_NK 3 BTN' },
      { pattern: /v\s*neck|v-neck|vneck/i, correctMatch: 'VN HUD', fallback: 'neck detail' },
      { pattern: /collar|collared/i, correctMatch: 'RIB PLN CLR', fallback: 'KNITS PLN CLR' },
      { pattern: /mandarin|chinese\s*collar|stand\s*collar/i, correctMatch: 'MANDARIAN NK', fallback: null },
      { pattern: /hood|hooded/i, correctMatch: 'RN HUD', fallback: 'VN HUD' },
      { pattern: /zip|zipper/i, correctMatch: 'RN ZIP', fallback: null },
      { pattern: /polo/i, correctMatch: 'RN', fallback: 'REG_CLR' },
      { pattern: /brand|logo/i, correctMatch: 'BRAND RIB NK', fallback: 'LOGO RIB NK' },
      { pattern: /contrast|two\s*tone|dual\s*color/i, correctMatch: 'CNT RIB NK', fallback: 'RIB 2 TONE CLR' },
      { pattern: /tipping|trim|edge/i, correctMatch: 'TPNG RIB NK', fallback: 'RIB 1 TPNG CLR' }
    ];
    
    for (const neckSafeguard of neckSafeguards) {
      if (neckSafeguard.pattern.test(valueLower)) {
        // Block meaningless matches
        if (neckSafeguard.blockMatch) {
          console.log(`NECK SAFEGUARD: Blocking meaningless term "${value}" - requires proper neck construction identification`);
          return null; // Force AI to look deeper
        }
        
        // Try primary match first
        if (neckSafeguard.correctMatch) {
          const correctOption = allowedValues.find(opt => opt.shortForm === neckSafeguard.correctMatch);
          if (correctOption) {
            console.log(`NECK SAFEGUARD: "${value}" → MATCHED to "${neckSafeguard.correctMatch}" (neck intelligence)`);
            return correctOption.shortForm;
          }
        }
        
        // Try fallback if primary not available
        if (neckSafeguard.fallback) {
          const correctOption = allowedValues.find(opt => opt.shortForm === neckSafeguard.fallback);
          if (correctOption) {
            console.log(`NECK SAFEGUARD: "${value}" → FALLBACK to "${neckSafeguard.fallback}" (neck intelligence)`);
            return correctOption.shortForm;
          }
        }
        
        // CRITICAL: If neck matched but not in schema - RETURN NULL
        console.log(`NECK SAFEGUARD: "${value}" matched pattern but not in schema - RETURNING NULL`);
        return null;
      }
    }

    // 🏷️ CRITICAL MVGR INTELLIGENCE SAFEGUARDS
    // Distinguish between MACRO (product types) vs MICRO (design features)
    
    // Check if this is for macro_mvgr or micro_mvgr based on allowed values
    const isMacroMvgr = allowedValues.some(opt => 
      ['1PC', '2PC', '3PC', 'DNM', 'BSC'].includes(opt.shortForm)
    );
    const isMicroMvgr = allowedValues.some(opt => 
      ['PRT', 'STP', 'CHK', 'PLN', 'AOP - ABST'].includes(opt.shortForm)
    );
    
    if (isMacroMvgr) {
      // MACRO_MVGR: Focus on PRODUCT TYPES, block design features
      const macroSafeguards = [
        // Product Types (correct for macro)
        { pattern: /one\s*piece|single\s*piece|1\s*pc/i, correctMatch: '1PC' },
        { pattern: /two\s*piece|2\s*piece|2\s*pc/i, correctMatch: '2PC' },
        { pattern: /three\s*piece|3\s*piece|3\s*pc/i, correctMatch: '3PC' },
        { pattern: /denim|jean|dungaree/i, correctMatch: 'DNM' },
        { pattern: /basic|plain\s*basic|simple/i, correctMatch: 'BSC' },
        { pattern: /cargo|utility/i, correctMatch: 'CRG' },
        { pattern: /bomber|jacket/i, correctMatch: 'BOMBER' },
        { pattern: /crop|cropped/i, correctMatch: 'CROP' },
        
        // Block design features (wrong for macro)
        { pattern: /print|stripe|check|embroidery|floral|abstract|chest\s*print/i, blockMatch: true, reason: 'Design feature belongs in MICRO_MVGR' },
        { pattern: /horizontal\s*stripe|vertical\s*stripe|all\s*over\s*print/i, blockMatch: true, reason: 'Pattern detail belongs in MICRO_MVGR' }
      ];
      
      for (const safeguard of macroSafeguards) {
        if (safeguard.pattern.test(valueLower)) {
          if (safeguard.blockMatch) {
            console.log(`🏷️ MACRO_MVGR SAFEGUARD: Blocking design feature "${value}" - ${safeguard.reason}`);
            return null; // Force AI to identify product type instead
          }
          
          if (safeguard.correctMatch) {
            const correctOption = allowedValues.find(opt => opt.shortForm === safeguard.correctMatch);
            if (correctOption) {
              console.log(`🏷️ MACRO_MVGR SAFEGUARD: "${value}" → MATCHED to "${safeguard.correctMatch}" (product type intelligence)`);
              return correctOption.shortForm;
            }
          }
          
          // CRITICAL: If macro_mvgr matched but not in schema - RETURN NULL
          console.log(`🏷️ MACRO_MVGR SAFEGUARD: "${value}" matched pattern but not in schema - RETURNING NULL`);
          return null;
        }
      }
    }
    
    if (isMicroMvgr) {
      // MICRO_MVGR: Focus on DESIGN FEATURES, block product types
      const microSafeguards = [
        // Design Features (correct for micro)
        { pattern: /print|printed/i, correctMatch: 'PRT' },
        { pattern: /chest\s*print|front\s*print/i, correctMatch: 'PRT - CHEST' },
        { pattern: /stripe|striped/i, correctMatch: 'STP' },
        { pattern: /horizontal\s*stripe/i, correctMatch: 'H_STP' },
        { pattern: /vertical\s*stripe/i, correctMatch: 'V_STP' },
        { pattern: /check|checkered|checked/i, correctMatch: 'CHK' },
        { pattern: /plain(?!\s*(t-?shirt|shirt|basic))/i, correctMatch: 'PLN' }, // Plain as design, not product
        { pattern: /all\s*over\s*print.*abstract/i, correctMatch: 'AOP - ABST' },
        { pattern: /all\s*over\s*print.*floral/i, correctMatch: 'AOP - FLRL' },
        { pattern: /all\s*over\s*print.*check/i, correctMatch: 'AOP - CHKS' },
        { pattern: /jacquard|woven\s*pattern/i, correctMatch: 'JAQ' },
        { pattern: /dobby|textured\s*weave/i, correctMatch: 'DBY' },
        
        // Block product types (wrong for micro)
        { pattern: /t-?shirt|shirt|one\s*piece|two\s*piece|denim|cargo|bomber/i, blockMatch: true, reason: 'Product type belongs in MACRO_MVGR' }
      ];
      
      for (const safeguard of microSafeguards) {
        if (safeguard.pattern.test(valueLower)) {
          if (safeguard.blockMatch) {
            console.log(`🏷️ MICRO_MVGR SAFEGUARD: Blocking product type "${value}" - ${safeguard.reason}`);
            return null; // Force AI to identify design feature instead
          }
          
          if (safeguard.correctMatch) {
            const correctOption = allowedValues.find(opt => opt.shortForm === safeguard.correctMatch);
            if (correctOption) {
              console.log(`🏷️ MICRO_MVGR SAFEGUARD: "${value}" → MATCHED to "${safeguard.correctMatch}" (design feature intelligence)`);
              return correctOption.shortForm;
            }
          }
          
          // CRITICAL: If micro_mvgr matched but not in schema - RETURN NULL
          console.log(`🏷️ MICRO_MVGR SAFEGUARD: "${value}" matched pattern but not in schema - RETURNING NULL`);
          return null;
        }
      }
    }

    // 📐 CRITICAL PATTERN INTELLIGENCE SAFEGUARDS
    // Distinguish between different pattern types and constructions
    if (attributeKey === 'pattern') {
      const patternSafeguards = [
        // Stripe Patterns (engineered vs regular)
        { pattern: /engineered\s*stripe|placement\s*stripe/i, correctMatch: 'E_STP', fallback: null },
        { pattern: /horizontal\s*stripe/i, correctMatch: 'H_STP', fallback: 'E_STP' },
        { pattern: /vertical\s*stripe/i, correctMatch: 'V_STP', fallback: 'E_STP' },
        { pattern: /stripe\s*pattern|striped\s*design/i, correctMatch: 'E_STP', fallback: 'BSC' },
        
        // Construction Types
        { pattern: /self\s*(fabric\s*)?cut.*sew|self\s*c\s*&?\s*s/i, correctMatch: 'C&S', fallback: '2_C&S' },
        { pattern: /cut.*sew|cut.*n.*sew|panel/i, correctMatch: 'C&S', fallback: '2_C&S' },
        { pattern: /2.*cut.*sew|two.*cut.*sew/i, correctMatch: '2_C&S', fallback: 'C&S' },
        { pattern: /3.*cut.*sew|three.*cut.*sew/i, correctMatch: '3_C&S', fallback: '2_C&S' },
        
        // SOLID/PLAIN/BASIC - Return null if not in schema (don't guess!)
        { pattern: /^solid$|^plain$|^simple$|^basic$/i, correctMatch: 'BSC', fallback: null, blockIfNotFound: true },
        
        // Specific Style Patterns  
        { pattern: /asymmetric|asymmetrical|uneven/i, correctMatch: 'ASYM', fallback: 'BSC' },
        { pattern: /a.?line|flared|flowing/i, correctMatch: 'A_LINE', fallback: 'BSC' },
        { pattern: /crop|cropped|shortened/i, correctMatch: 'CROP', fallback: 'BSC' },
        { pattern: /bomber|military/i, correctMatch: 'BOMBER', fallback: 'BSC' },
        { pattern: /cargo|utility|multi.?pocket/i, correctMatch: 'CARGO', fallback: 'BSC' },
        
        // Block meaningless terms
        { pattern: /^abstract$|^random$|^generic$/i, blockMatch: true, reason: 'Too vague - need specific pattern identification' }
      ];
      
      for (const safeguard of patternSafeguards) {
        if (safeguard.pattern.test(valueLower)) {
          // Block meaningless matches
          if (safeguard.blockMatch) {
            console.log(`📐 PATTERN SAFEGUARD: Blocking vague term "${value}" - ${safeguard.reason}`);
            return null; // Force AI to look deeper
          }
          
          // Try primary match first
          if (safeguard.correctMatch) {
            const correctOption = allowedValues.find(opt => opt.shortForm === safeguard.correctMatch);
            if (correctOption) {
              console.log(`📐 PATTERN SAFEGUARD: "${value}" → MATCHED to "${safeguard.correctMatch}" (pattern intelligence)`);
              return correctOption.shortForm;
            }
          }
          
          // Try fallback if primary not available
          if (safeguard.fallback) {
            const correctOption = allowedValues.find(opt => opt.shortForm === safeguard.fallback);
            if (correctOption) {
              console.log(`📐 PATTERN SAFEGUARD: "${value}" → FALLBACK to "${safeguard.fallback}" (pattern intelligence)`);
              return correctOption.shortForm;
            }
          }
          
          // CRITICAL: If pattern matched but neither correctMatch nor fallback found in schema
          // Return null to prevent wrong guessing
          console.log(`📐 PATTERN SAFEGUARD: "${value}" matched pattern but not in schema - RETURNING NULL`);
          return null;
        }
      }
    }

    // 🧵 CRITICAL EMBROIDERY INTELLIGENCE SAFEGUARDS  
    // Distinguish between embroidery presence vs absence and identify types
    if (attributeKey === 'embroidery' || attributeKey === 'embroidery_type') {
      const embroiderySafeguards = [
        // Embroidery Absence  
        { pattern: /no\s*(embroidery|emb)|without\s*(embroidery|emb)|none|absent|plain\s*(fabric|garment)/i, correctMatch: 'NO_EMB', fallback: null },
        
        // Brand/Logo Embroidery
        { pattern: /brand\s*(embroidery|emb)|logo\s*(embroidery|emb)|company\s*logo/i, correctMatch: 'BRND EMB', fallback: 'LOGO EMB' },
        { pattern: /logo\s*(embroidery|emb)|brand\s*logo/i, correctMatch: 'LOGO EMB', fallback: 'BRND EMB' },
        
        // Placement-based Embroidery
        { pattern: /neck\s*(embroidery|emb)|collar\s*(embroidery|emb)/i, correctMatch: 'NK_EMB', fallback: 'PLCMNT_EMB' },
        { pattern: /sleeve\s*(embroidery|emb)|arm\s*(embroidery|emb)/i, correctMatch: 'SLV_EMB', fallback: 'PLCMNT_EMB' },
        { pattern: /bottom\s*(embroidery|emb)|hem\s*(embroidery|emb)/i, correctMatch: 'BTM_EMB', fallback: 'PLCMNT_EMB' },
        { pattern: /border\s*(embroidery|emb)|edge\s*(embroidery|emb)/i, correctMatch: 'BDR EMB', fallback: 'EMB_BORDER' },
        { pattern: /placement\s*(embroidery|emb)|positioned\s*(embroidery|emb)/i, correctMatch: 'PLCMNT_EMB', fallback: 'NK_EMB' },
        { pattern: /neck.*bottom|bottom.*neck/i, correctMatch: 'NK&BTM_EMB', fallback: 'NK_EMB' },
        { pattern: /neck.*sleeve|sleeve.*neck/i, correctMatch: 'NK&SLV_EMB', fallback: 'NK_EMB' },
        
        // Technique-based Embroidery  
        { pattern: /thread\s*(work|embroidery)|hand\s*stitch/i, correctMatch: 'THREAD_WRK', fallback: 'PLCMNT_EMB' },
        { pattern: /sequin|sequins\s*(work|embroidery)/i, correctMatch: 'SEQ_WRK', fallback: 'THREAD_WRK' },
        { pattern: /mirror\s*(work|embroidery)/i, correctMatch: 'MIRROR_WRK', fallback: 'THREAD_WRK' },
        { pattern: /stone\s*(work|embroidery)|rhinestone/i, correctMatch: 'STONE WORK', fallback: 'SEQ_WRK' },
        { pattern: /bead|beads\s*(work|embroidery)/i, correctMatch: 'BEADS', fallback: 'STONE WORK' },
        { pattern: /lace.*over|lace.*all/i, correctMatch: 'LACE_AOP', fallback: 'LACE_BTM' },
        { pattern: /lace.*bottom/i, correctMatch: 'LACE_BTM', fallback: 'LACE_WAIST' },
        { pattern: /lace.*waist/i, correctMatch: 'LACE_WAIST', fallback: 'LACE_BTM' },
        { pattern: /cut\s*work|cutwork/i, correctMatch: 'CUT_WRK', fallback: 'THREAD_WRK' },
        { pattern: /zari|gold\s*thread/i, correctMatch: 'ZARI EMB', fallback: 'THREAD_WRK' },
        { pattern: /dori|cord\s*work/i, correctMatch: 'DORI_EMB', fallback: 'THREAD_WRK' },
        
        // Special Traditional Embroidery
        { pattern: /gotta\s*patti|gota\s*patti/i, correctMatch: 'GOTTA_PATTI', fallback: 'ZARI EMB' },
        
        // All-over Embroidery
        { pattern: /all\s*over.*embroidery|embroidery.*all\s*over/i, correctMatch: 'EMB_AOP', fallback: 'PLCMNT_EMB' },
        
        // Embroidery Tape/Trim
        { pattern: /embroidery\s*tape|embroidered\s*trim/i, correctMatch: 'EMB TAPE', fallback: 'BDR EMB' }
      ];
      
      for (const safeguard of embroiderySafeguards) {
        if (safeguard.pattern.test(valueLower)) {
          // Try primary match first
          if (safeguard.correctMatch) {
            const correctOption = allowedValues.find(opt => opt.shortForm === safeguard.correctMatch);
            if (correctOption) {
              console.log(`🧵 EMBROIDERY SAFEGUARD: "${value}" → MATCHED to "${safeguard.correctMatch}" (embroidery intelligence)`);
              return correctOption.shortForm;
            }
          }
          
          // Try fallback if primary not available
          if (safeguard.fallback) {
            const correctOption = allowedValues.find(opt => opt.shortForm === safeguard.fallback);
            if (correctOption) {
              console.log(`🧵 EMBROIDERY SAFEGUARD: "${value}" → FALLBACK to "${safeguard.fallback}" (embroidery intelligence)`);
              return correctOption.shortForm;
            }
          }
          
          // CRITICAL: If embroidery matched but not in schema - RETURN NULL
          console.log(`🧵 EMBROIDERY SAFEGUARD: "${value}" matched pattern but not in schema - RETURNING NULL`);
          return null;
        }
      }
    }

    // 🧬 CRITICAL COMPOSITION INTELLIGENCE SAFEGUARDS
    // Use retail industry standards for fabric composition detection
    if (attributeKey === 'fab_composition') {
      const compositionSafeguards = [
        // 100% Pure Fabrics
        { pattern: /100%?\s*cotton|pure\s*cotton|all\s*cotton/i, correctMatch: '100% CTN', fallback: null },
        { pattern: /100%?\s*poly(?:ester)?|pure\s*poly|all\s*poly/i, correctMatch: '100% POLY', fallback: null },
        { pattern: /100%?\s*viscose|pure\s*viscose|all\s*viscose/i, correctMatch: '100% VIS', fallback: null },
        { pattern: /100%?\s*rayon|pure\s*rayon|all\s*rayon/i, correctMatch: '100% RAYON', fallback: null },
        { pattern: /100%?\s*silk|pure\s*silk|all\s*silk/i, correctMatch: '100% SILK', fallback: null },
        { pattern: /100%?\s*linen|pure\s*linen|all\s*linen/i, correctMatch: '100% LINEN', fallback: null },
        { pattern: /100%?\s*modal|pure\s*modal|all\s*modal/i, correctMatch: '100% MODAL', fallback: null },
        { pattern: /100%?\s*nylon|pure\s*nylon|all\s*nylon/i, correctMatch: '100% NYLON', fallback: null },
        
        // Cotton-Polyester Blends (Most Common in Retail)
        { pattern: /60%?\s*cotton.*40%?\s*poly/i, correctMatch: '60% CTN, 40% POLY', fallback: '100% CTN' },
        { pattern: /70%?\s*cotton.*30%?\s*poly/i, correctMatch: '70% CTN, 30% POLY', fallback: '60% CTN, 40% POLY' },
        { pattern: /80%?\s*cotton.*20%?\s*poly/i, correctMatch: '80% CTN, 20% POLY', fallback: '70% CTN, 30% POLY' },
        { pattern: /52%?\s*cotton.*48%?\s*poly/i, correctMatch: '52% CTN, 48% POLY', fallback: '60% CTN, 40% POLY' },
        { pattern: /67%?\s*cotton.*33%?\s*poly/i, correctMatch: '67% CTN, 33% POLY', fallback: '70% CTN, 30% POLY' },
        
        // Cotton-Lycra Blends (Stretch Fabrics)  
        { pattern: /95%?\s*cotton.*5%?\s*(lycra|spandex|elastane)/i, correctMatch: '95% CTN, 5% LYCRA', fallback: '100% CTN' },
        { pattern: /97%?\s*cotton.*3%?\s*(lycra|spandex|elastane)/i, correctMatch: '97% CTN, 3% LYCRA', fallback: '95% CTN, 5% LYCRA' },
        { pattern: /98%?\s*cotton.*2%?\s*(lycra|spandex|elastane)/i, correctMatch: '98% CTN, 2% LYCRA', fallback: '97% CTN, 3% LYCRA' },
        { pattern: /92%?\s*cotton.*8%?\s*(lycra|spandex|elastane)/i, correctMatch: '92% CTN, 8% LYCRA', fallback: '95% CTN, 5% LYCRA' },
        { pattern: /85%?\s*cotton.*15%?\s*(lycra|spandex|elastane)/i, correctMatch: '85% CTN, 15% LYCRA', fallback: '92% CTN, 8% LYCRA' },
        
        // Polyester-Lycra Blends (Athletic/Performance)
        { pattern: /95%?\s*poly.*5%?\s*(lycra|spandex|elastane)/i, correctMatch: '95% POLY, 5% LYCRA', fallback: '100% POLY' },
        { pattern: /97%?\s*poly.*3%?\s*(lycra|spandex|elastane)/i, correctMatch: '97% POLY, 3% LYCRA', fallback: '95% POLY, 5% LYCRA' },
        { pattern: /98%?\s*poly.*2%?\s*(lycra|spandex|elastane)/i, correctMatch: '98% POLY, 2% LYCRA', fallback: '97% POLY, 3% LYCRA' },
        { pattern: /92%?\s*poly.*8%?\s*(lycra|spandex|elastane)/i, correctMatch: '92% POLY, 8% LYCRA', fallback: '95% POLY, 5% LYCRA' },
        { pattern: /85%?\s*poly.*15%?\s*(lycra|spandex|elastane)/i, correctMatch: '85% POLY, 15% LYCRA', fallback: '92% POLY, 8% LYCRA' },
        { pattern: /90%?\s*poly.*10%?\s*(lycra|spandex|elastane)/i, correctMatch: '90% POLY, 10% LYCRA', fallback: '95% POLY, 5% LYCRA' },
        
        // Viscose Blends
        { pattern: /95%?\s*viscose.*5%?\s*(lycra|spandex|elastane)/i, correctMatch: '95% VIS, 5% LYCRA', fallback: '100% VIS' },
        { pattern: /97%?\s*viscose.*3%?\s*(lycra|spandex|elastane)/i, correctMatch: '97% VIS, 3% LYCRA', fallback: '95% VIS, 5% LYCRA' },
        { pattern: /98%?\s*viscose.*2%?\s*(lycra|spandex|elastane)/i, correctMatch: '98% VIS, 2% LYCRA', fallback: '97% VIS, 3% LYCRA' },
        { pattern: /75%?\s*viscose.*25%?\s*poly/i, correctMatch: '75% VIS, 25% POLY', fallback: '100% VIS' },
        { pattern: /67%?\s*viscose.*33%?\s*poly/i, correctMatch: '67% VIS, 33% POLY', fallback: '75% VIS, 25% POLY' },
        
        // Cotton-Linen Blends (Summer Fabrics)
        { pattern: /75%?\s*cotton.*25%?\s*linen/i, correctMatch: '75% CTN, 25% LINEN', fallback: '100% CTN' },
        { pattern: /80%?\s*cotton.*20%?\s*linen/i, correctMatch: '80% CTN, 20% LINEN', fallback: '75% CTN, 25% LINEN' },
        { pattern: /93%?\s*cotton.*7%?\s*linen/i, correctMatch: '93% CTN, 7% LINEN', fallback: '80% CTN, 20% LINEN' },
        
        // Synthetic Blends
        { pattern: /60%?\s*poly.*40%?\s*nylon/i, correctMatch: '60% POLY, 40% NYLON', fallback: '100% POLY' },
        { pattern: /80%?\s*poly.*20%?\s*nylon/i, correctMatch: '80% POLY, 20% NYLON', fallback: '60% POLY, 40% NYLON' },
        { pattern: /95%?\s*nylon.*5%?\s*(lycra|spandex|elastane)/i, correctMatch: '95% NYLON, 5% LYCRA', fallback: '100% NYLON' },
        
        // Common Industry Terms Mapping
        { pattern: /cotton\s*poly\s*blend|poly\s*cotton\s*blend/i, correctMatch: '60% CTN, 40% POLY', fallback: '100% CTN' },
        { pattern: /stretch\s*cotton|cotton\s*stretch/i, correctMatch: '95% CTN, 5% LYCRA', fallback: '100% CTN' },
        { pattern: /stretch\s*poly|poly\s*stretch/i, correctMatch: '95% POLY, 5% LYCRA', fallback: '100% POLY' },
        { pattern: /performance\s*fabric|athletic\s*fabric/i, correctMatch: '90% POLY, 10% LYCRA', fallback: '100% POLY' }
      ];
      
      for (const safeguard of compositionSafeguards) {
        if (safeguard.pattern.test(valueLower)) {
          // Try primary match first
          if (safeguard.correctMatch) {
            const correctOption = allowedValues.find(opt => opt.shortForm === safeguard.correctMatch);
            if (correctOption) {
              console.log(`🧬 COMPOSITION SAFEGUARD: "${value}" → MATCHED to "${safeguard.correctMatch}" (retail standard)`);
              return correctOption.shortForm;
            }
          }
          
          // Try fallback if primary not available
          if (safeguard.fallback) {
            const correctOption = allowedValues.find(opt => opt.shortForm === safeguard.fallback);
            if (correctOption) {
              console.log(`🧬 COMPOSITION SAFEGUARD: "${value}" → FALLBACK to "${safeguard.fallback}" (retail standard)`);
              return correctOption.shortForm;
            }
          }
          
          // CRITICAL: If composition matched but not in schema - RETURN NULL
          console.log(`🧬 COMPOSITION SAFEGUARD: "${value}" matched pattern but not in schema - RETURNING NULL`);
          return null;
        }
      }
    }

    // Extract meaningful words (ignore filler words)
    const fillerWords = ['and', 'the', 'of', 'in', 'on', 'at', 'for', 'with', 'by'];
    const valueWords = valueLower.split(/[\s\-_]+/)
      .filter(word => word.length > 2 && !fillerWords.includes(word));
    
    if (valueWords.length === 0) return null;
    
    let bestMatch = null;
    let highestSemanticScore = 0;
    
    for (const allowed of allowedValues) {
      const schemaText = `${allowed.shortForm} ${allowed.fullForm || ''}`.toLowerCase();
      let positiveMatches = 0;
      const totalWords = valueWords.length;
      
      console.log(`🔍 Testing "${value}" against "${allowed.shortForm}" (${allowed.fullForm})`);
      
      // Each word must have semantic justification
      for (const word of valueWords) {
        let wordMatched = false;
        
        // 1. Direct word match in schema
        if (schemaText.includes(word)) {
          positiveMatches += 1.0;
          wordMatched = true;
          console.log(`  ✅ Direct match: "${word}" found in schema`);
        }
        // 2. Strong semantic synonym
        else {
          const synonymScore = this.getSemanticSynonymScore(word, schemaText);
          if (synonymScore > 0.8) {
            positiveMatches += synonymScore;
            wordMatched = true;
            console.log(`  ✅ Synonym match: "${word}" → ${synonymScore.toFixed(2)} confidence`);
          }
        }
        
        if (!wordMatched) {
          console.log(`  ❌ No match for: "${word}"`);
        }
      }
      
      // ULTRA-STRICT: Require 90%+ word matching
      const semanticScore = positiveMatches / totalWords;
      console.log(`  📊 Final score: ${semanticScore.toFixed(2)} (${positiveMatches}/${totalWords})`);
      
      if (semanticScore > highestSemanticScore && semanticScore >= 0.9) {
        highestSemanticScore = semanticScore;
        bestMatch = allowed.shortForm;
        console.log(`  New best match: ${allowed.shortForm} (score: ${semanticScore.toFixed(2)})`);
      }
    }
    
    if (bestMatch) {
      console.log(`✅ SEMANTIC MATCH: "${value}" → "${bestMatch}" (confidence: ${highestSemanticScore.toFixed(2)})`);
    } else {
      console.log(`❌ NO SEMANTIC MATCH: "${value}" - RETURNING NULL (value not in allowed schema)`);
    }
    
    // CRITICAL: Return null if no match found - DO NOT guess or use raw value
    // This prevents showing invalid values like "SOLID" mapped to "E_STP"
    return bestMatch; // Will be null if no match found
  }

  /**
   * 🧠 ADVANCED SEMANTIC INTELLIGENCE
   * Human-level understanding of fashion terminology
   */
  private static getSemanticSynonymScore(word: string, schemaText: string): number {
    // 🚨 CRITICAL: Handle "knitted fabric" explicitly first
    if (word === 'knitted' || word === 'knit' || word === 'fabric') {
      const knittedTerms = ['knit', 'knits', 'knitted', 'knitting', 'jersey', 'stretch'];
      if (knittedTerms.some(term => schemaText.includes(term))) {
        console.log(`🧵 EXPLICIT KNIT MATCH: "${word}" → knit schema (confidence: 0.99)`);
        return 0.99;
      }
      // Block denim/woven matches for knit-related words
      if (schemaText.includes('denim') || schemaText.includes('dnm') || schemaText.includes('woven')) {
        console.log(`🚨 BLOCKING INCORRECT FABRIC MATCH: "${word}" cannot match denim/woven`);
        return 0;
      }
    }
    
    // COMPREHENSIVE FASHION SEMANTIC MAPS
    const fashionSemantics: Record<string, { terms: string[], confidence: number }> = {
      // FABRIC TYPES (Critical - Never confuse!)
      'knit': { 
        terms: ['knits', 'knitted', 'knitting', 'jersey', 'stretch', 'stretchy', 'flexible', 'soft', 'cotton knit', 'jersey knit', 'ribbed', 'interlock', 'fabric'], 
        confidence: 0.99 
      },
      'denim': { 
        terms: ['jean', 'jeans', 'dungaree', 'blue jean', 'denim fabric', 'twill weave', 'rigid', 'structured'], 
        confidence: 0.99 
      },
      'woven': { 
        terms: ['woven fabric', 'non-stretch', 'structured', 'crisp', 'dress shirt', 'formal fabric', 'twill', 'poplin'], 
        confidence: 0.99 
      },
      
      // FABRIC PROPERTIES  
      'cotton': { 
        terms: ['cotton fabric', '100% cotton', 'pure cotton', 'organic cotton', 'cotton fiber', 'cotton blend'], 
        confidence: 0.95 
      },
      'polyester': { 
        terms: ['poly', 'synthetic', 'man-made', 'artificial fiber', 'performance fabric'], 
        confidence: 0.95 
      },
      'blend': { 
        terms: ['mixed', 'combination', 'cotton poly', 'poly cotton', 'fabric blend'], 
        confidence: 0.90 
      },
      
      // COLORS (Specific shades)
      'navy': { 
        terms: ['dark blue', 'deep blue', 'marine blue', 'midnight blue', 'navy blue'], 
        confidence: 0.92 
      },
      'black': { 
        terms: ['dark', 'charcoal', 'jet black', 'coal', 'midnight', 'ebony'], 
        confidence: 0.90 
      },
      'white': { 
        terms: ['cream', 'ivory', 'off-white', 'pearl', 'snow white', 'vanilla'], 
        confidence: 0.90 
      },
      'gray': { 
        terms: ['grey', 'silver', 'ash', 'slate', 'gunmetal', 'stone'], 
        confidence: 0.90 
      },
      'red': { 
        terms: ['maroon', 'crimson', 'scarlet', 'burgundy', 'wine', 'cherry'], 
        confidence: 0.90 
      },
      'blue': { 
        terms: ['royal blue', 'sky blue', 'ocean blue', 'cobalt', 'azure'], 
        confidence: 0.85 
      },
      
      // NECKLINES
      'round': { 
        terms: ['crew', 'crew neck', 'circular', 'o-neck', 'round neck'], 
        confidence: 0.95 
      },
      'vneck': { 
        terms: ['v-neck', 'v neck', 'plunging', 'deep v', 'vneckline'], 
        confidence: 0.98 
      },
      'collar': { 
        terms: ['collared', 'polo collar', 'shirt collar', 'formal collar'], 
        confidence: 0.95 
      },
      
      // PATTERNS
      'solid': { 
        terms: ['plain', 'single color', 'uniform', 'monochrome', 'solid color'], 
        confidence: 0.95 
      },
      'stripe': { 
        terms: ['striped', 'stripes', 'linear', 'lines', 'horizontal stripe', 'vertical stripe'], 
        confidence: 0.98 
      },
      'print': { 
        terms: ['printed', 'graphic', 'design', 'pattern', 'artwork'], 
        confidence: 0.90 
      },
      
      // GARMENT TYPES
      'shirt': { 
        terms: ['t-shirt', 'tee', 'top', 'blouse', 'tee shirt'], 
        confidence: 0.90 
      },
      'pant': { 
        terms: ['pants', 'trousers', 'bottom', 'leg wear'], 
        confidence: 0.90 
      },
      
      // CONSTRUCTION DETAILS
      'pocket': { 
        terms: ['pockets', 'chest pocket', 'side pocket', 'patch pocket'], 
        confidence: 0.95 
      },
      'button': { 
        terms: ['buttons', 'button-up', 'buttoned', 'snap button'], 
        confidence: 0.95 
      }
    };
    
    // Advanced matching with word variations
    for (const [concept, mapping] of Object.entries(fashionSemantics)) {
      const allTerms = [concept, ...mapping.terms];
      
      // Check for exact matches and partial matches
      for (const term of allTerms) {
        const wordLower = word.toLowerCase();
        const termLower = term.toLowerCase();
        
        // Exact match
        if (wordLower === termLower) {
          if (schemaText.includes(concept) || schemaText.includes(termLower)) {
            return mapping.confidence;
          }
        }
        
        // Partial match (for compound words)
        if (wordLower.length > 4 && termLower.length > 4) {
          if (wordLower.includes(termLower) || termLower.includes(wordLower)) {
            if (schemaText.includes(concept) || schemaText.includes(termLower)) {
              return mapping.confidence * 0.9; // Slightly lower confidence for partial
            }
          }
        }
      }
    }
    
    return 0;
  }

  /**
   * 🚫 NULL-LIKE VALUE DETECTOR
   * Identifies values that should be treated as "no value"
   */
  private static isNullLikeValue(value: string): boolean {
    if (!value || typeof value !== 'string') return true;
    
    const cleanValue = value.trim().toLowerCase();
    
    // Common null-like patterns
    const nullPatterns = [
      '', 'null', 'undefined', 'none', 'n/a', 'na', 'not available',
      'unknown', 'not specified', 'not mentioned', 'not found',
      'blank', 'empty', 'no data', 'no value', 'nil', 'void',
      'not applicable', 'not given', 'not provided', 'missing',
      'unspecified', 'not clear', 'not visible', 'cannot determine',
      'unable to determine', 'not determinable', 'indeterminate',
      // Fashion-specific meaningless terms
      'plain', 'simple', 'basic', 'standard', 'regular', 'normal',
      'typical', 'usual', 'common', 'ordinary', 'conventional'
    ];
    
    return nullPatterns.includes(cleanValue) || 
           cleanValue.length === 0 || 
           /^[\s\-_.]*$/.test(cleanValue); // Only spaces, dashes, underscores, dots
  }

  /**
   * ✅ VALID RAW VALUE CHECKER
   * Determines if a raw value is meaningful enough to display
   */
  private static isValidRawValue(value: string): boolean {
    if (!value || this.isNullLikeValue(value)) return false;
    
    const cleanValue = value.trim();
    
    // Must have meaningful content
    if (cleanValue.length < 2) return false;
    
    // Reject if it's just numbers or special characters
    if (/^[\d\s\-_.]+$/.test(cleanValue)) return false;
    
    // Reject vague descriptive words
    const vaguePatterns = [
      'various', 'different', 'multiple', 'mixed', 'assorted',
      'standard', 'typical', 'common', 'regular', 'normal',
      'basic', 'simple', 'generic', 'general', 'default',
      'see image', 'as shown', 'as per image', 'image',
      'description not clear', 'unclear', 'varies'
    ];
    
    const lowerValue = cleanValue.toLowerCase();
    if (vaguePatterns.some(pattern => lowerValue.includes(pattern))) {
      return false;
    }
    
    // Accept if it contains meaningful fashion terms
    const fashionTerms = [
      'neck', 'sleeve', 'collar', 'hem', 'fit', 'style',
      'color', 'pattern', 'fabric', 'cotton', 'poly', 
      'blue', 'red', 'green', 'black', 'white', 'gray',
      'stripe', 'solid', 'print', 'plain', 'check',
      'round', 'v-neck', 'crew', 'polo', 'button'
    ];
    
    if (fashionTerms.some(term => lowerValue.includes(term))) {
      return true;
    }
    
    // Accept if it looks like a proper description (has letters and reasonable length)
    return /^[a-zA-Z]/.test(cleanValue) && cleanValue.length >= 3 && cleanValue.length <= 100;
  }

  /**
   * 🧠 INTELLIGENT FUZZY MATCHING  
   * Prioritizes fullForm, uses capital letter intelligence, advanced scoring
   */
  private static findFuzzySchemaMatch(
    value: string, 
    allowedValues: Array<{shortForm: string; fullForm?: string}>
  ): string | null {
    if (value.length < 2 || this.isNullLikeValue(value)) return null;
    
    const normalizedValue = this.normalizeText(value);
    const upperValue = value.toUpperCase();
    
    let bestMatch = null;
    let highestScore = 0;
    const SIMILARITY_THRESHOLD = 0.70; // Higher threshold for quality
    
    for (const allowed of allowedValues) {
      let maxScore = 0;
      
      // PRIORITY SCORING: fullForm gets bonus points
      const normalizedShort = this.normalizeText(allowed.shortForm);
      const normalizedFull = allowed.fullForm ? this.normalizeText(allowed.fullForm) : '';
      const upperFull = allowed.fullForm?.toUpperCase() || '';
      
      // 1. Capital letter intelligence (schema matching)
      if (upperFull && this.checkCapitalMatch(upperValue, upperFull)) {
        maxScore = Math.max(maxScore, 0.95);
      }
      
      // 2. FullForm similarity (higher priority)
      if (normalizedFull) {
        const fullScore = this.stringSimilarity(normalizedValue, normalizedFull);
        maxScore = Math.max(maxScore, fullScore + 0.1); // Bonus for fullForm
      }
      
      // 3. ShortForm similarity (lower priority)  
      const shortScore = this.stringSimilarity(normalizedValue, normalizedShort);
      maxScore = Math.max(maxScore, shortScore);
      
      // 4. Advanced matching techniques
      const abbrevScore = this.checkAbbreviationMatch(normalizedValue, normalizedShort, normalizedFull);
      const partialScore = this.checkPartialMatch(normalizedValue, normalizedShort, normalizedFull);
      const smartScore = this.checkSmartPatterns(value, allowed.shortForm, allowed.fullForm || '');
      const contextScore = this.checkContextualIntelligence(value, allowed.shortForm, allowed.fullForm || '');
      
      maxScore = Math.max(maxScore, abbrevScore, partialScore, smartScore, contextScore);
      
      if (maxScore > highestScore && maxScore >= SIMILARITY_THRESHOLD) {
        highestScore = maxScore;
        bestMatch = allowed.shortForm;
      }
    }
    
    return bestMatch;
  }

  /**
   * CAPITAL LETTER INTELLIGENCE
   * Smart matching for capital letter schemas
   */
  private static checkCapitalMatch(userValue: string, schemaValue: string): boolean {
    // Direct capital match
    if (userValue === schemaValue) return true;
    
    // Handle common variations
    const variations = [
      userValue.replace(/\s+/g, ''), // Remove spaces
      userValue.replace(/[-_]/g, ' '), // Convert dashes/underscores to spaces
      userValue.replace(/\s+/g, '_'), // Convert spaces to underscores
      userValue.replace(/\s+/g, '-'), // Convert spaces to dashes
    ];
    
    return variations.some(variation => variation === schemaValue);
  }

  /**
   * 🧠 SMART PATTERN RECOGNITION
   * Advanced pattern matching for complex cases
   */
  private static checkSmartPatterns(value: string, _shortForm: string, fullForm: string): number {
    const valueLower = value.toLowerCase();
    const fullLower = fullForm.toLowerCase();
    
    // 1. Word order independence ("neck round" = "round neck")
    if (fullForm && this.checkWordOrderMatch(valueLower, fullLower)) {
      return 0.85;
    }
    
    // 2. Plural/singular handling
    if (this.checkPluralMatch(valueLower, fullLower)) {
      return 0.80;
    }
    
    // 3. Common fashion abbreviations
    if (this.checkFashionAbbreviations(valueLower, fullLower)) {
      return 0.90;
    }
    
    return 0;
  }

  /**
   * 🔄 WORD ORDER INDEPENDENCE
   */
  private static checkWordOrderMatch(value: string, schema: string): boolean {
    const valueWords = value.split(/\s+/).filter(w => w.length > 2);
    const schemaWords = schema.split(/\s+/).filter(w => w.length > 2);
    
    if (valueWords.length !== schemaWords.length) return false;
    
    return valueWords.every(word => schemaWords.includes(word));
  }

  /**
   * 📝 PLURAL/SINGULAR MATCHING
   */
  private static checkPluralMatch(value: string, schema: string): boolean {
    // Simple plural handling
    const singularValue = value.endsWith('s') ? value.slice(0, -1) : value + 's';
    return singularValue === schema || value === (schema.endsWith('s') ? schema.slice(0, -1) : schema + 's');
  }

  /**
   * 👔 FASHION ABBREVIATION INTELLIGENCE
   */
  private static checkFashionAbbreviations(value: string, schema: string): boolean {
    const fashionAbbrevs: Record<string, string[]> = {
      'tshirt': ['t-shirt', 'tee shirt', 'tee'],
      'polo': ['polo shirt'],
      'hoodie': ['hooded sweatshirt', 'hooded'],
      'jeans': ['denim pants', 'denim'],
      'shorts': ['short pants'],
      'xl': ['extra large'],
      'lg': ['large'],
      'med': ['medium'],
      'sm': ['small'],
    };
    
    for (const [abbrev, expansions] of Object.entries(fashionAbbrevs)) {
      if ((value.includes(abbrev) && expansions.some(exp => schema.includes(exp))) ||
          (expansions.some(exp => value.includes(exp)) && schema.includes(abbrev))) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 🧠 ABBREVIATION INTELLIGENCE
   * Detects if value is abbreviation of schema (XL vs Extra Large)
   */
  private static checkAbbreviationMatch(value: string, shortForm: string, fullForm: string): number {
    // Check if value is already the shortForm
    if (value === shortForm) return 0.95;
    
    if (!fullForm || value.length >= fullForm.length) return 0;
    
    // Check if value could be abbreviation of fullForm
    const words = fullForm.split(/\s+/);
    if (words.length > 1) {
      const abbreviation = words.map(word => word.charAt(0)).join('');
      if (value === abbreviation) return 0.9; // High confidence for abbreviations
    }
    
    // Check if it's a partial abbreviation (like "RN" for "Round Neck")
    if (words.length > 1 && value.length <= 3) {
      const partialAbbrev = words.slice(0, value.length).map(word => word.charAt(0)).join('');
      if (value === partialAbbrev) return 0.85;
    }
    
    return 0;
  }
  
  /**
   * 🧠 PARTIAL WORD MATCHING
   * Handles cases like "neck" matching "Round Neck"
   */
  private static checkPartialMatch(value: string, shortForm: string, fullForm: string): number {
    // 1. Direct contains check
    if (shortForm.includes(value) || fullForm.includes(value)) {
      return 0.8;
    }
    
    // 2. Reverse contains (schema word in value)
    const allWords = `${shortForm} ${fullForm}`.toLowerCase().split(/\s+/);
    const valueWords = value.toLowerCase().split(/\s+/);
    
    for (const schemaWord of allWords) {
      for (const valueWord of valueWords) {
        if (schemaWord.length >= 3 && valueWord.includes(schemaWord)) {
          return 0.75;
        }
        if (valueWord.length >= 3 && schemaWord.includes(valueWord)) {
          return 0.75;
        }
      }
    }
    
    // 3. Synonym matching using fashion intelligence
    const synonymScore = this.checkFashionSynonyms(value, shortForm, fullForm);
    if (synonymScore > 0) return synonymScore;
    
    return 0;
  }
  
  /**
   * 🧠 ADVANCED FASHION INTELLIGENCE
   * Comprehensive fashion knowledge like a human expert
   */
  private static checkFashionSynonyms(value: string, shortForm: string, fullForm: string): number {
    const fashionIntelligence: Record<string, string[]> = {
      // Necklines (comprehensive - enhanced with construction details)
      'round': ['crew', 'crewneck', 'round neck', 'crew neck', 'o neck', 'circular'],
      'rib': ['ribbed neck', 'rib neck', 'rib collar', 'ribbed collar', 'knit neck', 'stretch neck'],
      'crew': ['crew neck', 'crewneck', 'round neck', 'circular neck', 'o-neck'],
      'vneck': ['v neck', 'v-neck', 'v neckline', 'deep v', 'plunging'],
      'henley': ['henley neck', 'button placket', 'partial button', 'grandad collar'],
      'collar': ['collared', 'polo collar', 'shirt collar', 'fold collar'],
      'scoop': ['scoop neck', 'scoopneck', 'deep scoop', 'wide neck'],
      'turtle': ['turtleneck', 'turtle neck', 'high neck', 'polo neck'],
      'boat': ['boat neck', 'boatneck', 'off shoulder', 'wide neck'],
      'mandarin': ['mandarin collar', 'chinese collar', 'stand collar', 'nehru collar'],
      'hood': ['hooded', 'hoodie neck', 'drawstring neck'],
      'zip': ['zip neck', 'zipper neck', 'quarter zip', 'half zip'],
      'contrast': ['contrast neck', 'two tone neck', 'dual color neck'],
      'brand': ['branded neck', 'logo neck', 'embroidered neck'],
      'tipping': ['tipped neck', 'trim neck', 'edge detail neck'],
      
      // Colors (extensive variations)
      'blue': ['navy', 'royal blue', 'sky blue', 'ocean blue', 'marine', 'denim blue', 'cobalt'],
      'red': ['maroon', 'crimson', 'scarlet', 'burgundy', 'wine', 'cherry', 'brick red'],
      'green': ['olive', 'forest green', 'lime', 'mint', 'sage', 'emerald', 'khaki'],
      'black': ['charcoal', 'dark', 'jet black', 'coal', 'midnight', 'ebony'],
      'white': ['off white', 'cream', 'ivory', 'pearl', 'snow', 'vanilla', 'bone'],
      'gray': ['grey', 'silver', 'ash', 'slate', 'pewter', 'stone', 'gunmetal'],
      'yellow': ['gold', 'mustard', 'lemon', 'sunshine', 'amber', 'honey'],
      'pink': ['rose', 'coral', 'salmon', 'blush', 'magenta', 'fuchsia'],
      'purple': ['violet', 'lavender', 'plum', 'grape', 'amethyst', 'lilac'],
      'brown': ['tan', 'beige', 'khaki', 'chocolate', 'camel', 'bronze', 'rust'],
      'orange': ['peach', 'coral', 'tangerine', 'apricot', 'copper', 'burnt orange'],
      
      // Patterns (detailed)
      'solid': ['plain', 'solid color', 'single color', 'uniform', 'monochrome'],
      'striped': ['stripe', 'stripes', 'linear', 'horizontal stripe', 'vertical stripe', 'pin stripe'],
      'printed': ['print', 'graphic', 'design', 'pattern', 'motif', 'artwork'],
      'checked': ['check', 'checkered', 'plaid', 'gingham', 'tartan', 'grid'],
      'floral': ['flower', 'flowers', 'botanical', 'leaf', 'rose print', 'garden'],
      'polka': ['polka dot', 'dot', 'dots', 'spotted', 'circular print'],
      
      // Sleeves (comprehensive - enhanced for T-shirt accuracy)
      'short': ['half', 'short sleeve', 'half sleeve', 'regular sleeve', 't-shirt sleeve', 'standard sleeve'],
      'regular_sleeve': ['short sleeve', 'standard', 't-shirt', 'tee sleeve', 'normal sleeve', 'basic sleeve'],
      'cap': ['cap sleeve', 'very short', 'minimal sleeve', 'tiny sleeve', 'micro sleeve'],
      'half': ['half sleeve', 'elbow length', 'mid sleeve', 'medium sleeve', 'above elbow'],
      'quarter': ['quarter sleeve', '3/4 sleeve', 'three quarter', 'below elbow', 'bracelet sleeve'],
      'long': ['full', 'long sleeve', 'full sleeve', 'extended', 'full length sleeve'],
      'sleeveless': ['tank', 'vest', 'no sleeve', 'armless', 'without sleeve', 'muscle tee'],
      'three quarter': ['3/4', '3 quarter', 'three fourth', 'elbow length'],
      
      // Fits & Styles
      'regular_fit': ['standard', 'normal', 'classic', 'straight', 'traditional'],
      'slim': ['fitted', 'tight', 'narrow', 'skinny', 'close fit', 'tailored'],
      'loose': ['relaxed', 'oversized', 'baggy', 'comfort fit', 'easy fit'],
      'athletic': ['sport', 'performance', 'active', 'gym', 'workout'],
      
      // Pockets (comprehensive)
      'no': ['no pockets', 'without pockets', 'none', 'absent', 'missing pockets', 'pocketless'],
      'patch': ['patch pocket', 'applied pocket', 'surface pocket', 'external pocket', 'sewn on'],
      'side': ['side pocket', 'lateral pocket', 'hip pocket', 'side seam pocket'],
      'kangaroo': ['kangaroo pocket', 'pouch pocket', 'front pouch', 'center pocket', 'muff pocket'],
      'zipper': ['zipper pocket', 'zip pocket', 'secured pocket', 'closed pocket'],
      'welt': ['welt pocket', 'inset pocket', 'tailored pocket', 'dress pocket'],
      'cargo': ['cargo pocket', 'utility pocket', 'large pocket', 'functional pocket'],
      
      // Fabric Intelligence
      'cotton': ['pure cotton', '100% cotton', 'cotton blend', 'organic cotton'],
      'polyester': ['poly', 'synthetic', 'man made', 'artificial'],
      'denim': ['jean', 'jeans fabric', 'blue jean', 'dungaree'],
      'wool': ['woolen', 'merino', 'cashmere', 'lamb wool'],
      'silk': ['silky', 'satin', 'smooth', 'lustrous'],
      'linen': ['flax', 'natural', 'breathable', 'summer fabric'],
      
      // Garment Types (MACRO_MVGR - Product Categories)
      'shirt': ['top', 'blouse', 'tunic', 'tee'],
      'tshirt': ['t-shirt', 'tee shirt', 'tee', 't shirt'],
      'polo': ['polo shirt', 'golf shirt', 'collared tee'],
      'hoodie': ['hooded sweatshirt', 'hooded', 'pullover hoodie'],
      'one_piece': ['one piece', '1 piece', 'single piece', 'onesie', 'jumpsuit'],
      'two_piece': ['two piece', '2 piece', 'twin set', 'co-ord set', 'matching set'],
      'three_piece': ['three piece', '3 piece', 'triple set', 'suit set'],
      'basic': ['basic tee', 'plain shirt', 'simple top', 'essential', 'staple'],
      'cargo_garment': ['cargo pants', 'utility wear', 'tactical', 'multi-pocket'],
      'bomber': ['bomber jacket', 'flight jacket', 'varsity jacket', 'zip jacket'],
      
      // Design Features (MICRO_MVGR - Design Details)
      'print': ['printed', 'graphic', 'design', 'pattern', 'artwork', 'motif'],
      'stripe': ['striped', 'linear', 'banded', 'horizontal line', 'vertical line'],
      'check': ['checked', 'checkered', 'plaid', 'gingham', 'grid pattern'],
      'plain_design': ['solid color', 'monotone', 'single color', 'no pattern'],
      'chest_print': ['front print', 'chest graphic', 'front design', 'logo placement'],
      'all_over_print': ['aop', 'full print', 'overall pattern', 'complete design'],
      'abstract': ['abstract print', 'artistic', 'modern art', 'geometric art'],
      'floral_print': ['flower print', 'botanical print', 'leaf pattern', 'garden print'],
      'geometric': ['geo print', 'shapes', 'angular', 'mathematical pattern'],
      'jacket': ['coat', 'blazer', 'outerwear', 'windbreaker'],
      'jeans': ['denim pants', 'denim', 'blue jeans'],
      'shorts': ['short pants', 'bermuda', 'half pants'],
      'dress': ['frock', 'gown', 'one piece'],
      
      // Seasons & Occasions
      'summer': ['hot weather', 'warm', 'beach', 'vacation', 'tropical'],
      'winter': ['cold weather', 'warm', 'thermal', 'cozy', 'holiday'],
      'casual': ['everyday', 'informal', 'relaxed', 'weekend', 'leisure'],
      'formal': ['office', 'business', 'professional', 'dress up', 'elegant'],
      'party': ['evening', 'night out', 'celebration', 'festive', 'special occasion']
    };
    
    const valueLower = value.toLowerCase();
    const schemaLower = `${shortForm} ${fullForm}`.toLowerCase();
    
    // Advanced pattern matching with contextual intelligence
    for (const [baseWord, synonyms] of Object.entries(fashionIntelligence)) {
      // Multi-word phrase matching
      const allPhrases = [baseWord, ...synonyms];
      
      for (const phrase of allPhrases) {
        // Check if phrase appears in value and base word in schema
        if (valueLower.includes(phrase) && schemaLower.includes(baseWord)) {
          return 0.90; // High confidence for comprehensive matches
        }
        
        // Reverse check
        if (schemaLower.includes(phrase) && valueLower.includes(baseWord)) {
          return 0.90;
        }
      }
      
      // Partial word matching for compound terms
      if (baseWord.length > 4) {
        const valueWords = valueLower.split(/[\s\-_]+/);
        const schemaWords = schemaLower.split(/[\s\-_]+/);
        
        for (const vWord of valueWords) {
          for (const sWord of schemaWords) {
            if (vWord.length > 3 && sWord.length > 3 && 
                (vWord.includes(baseWord) || baseWord.includes(vWord))) {
              return 0.85;
            }
          }
        }
      }
    }
    
    return 0;
  }

  /**
   * SIMPLE RANGE DETECTION
   * Only for attributes that have range configuration
   */
  private static detectRangeValue(
    value: string,
    attributeDefinition: AttributeDefinition
  ): string | null {
    const rangeConfig = attributeDefinition.rangeConfig;
    if (!rangeConfig) return null;

    const upperValue = value.toUpperCase();
    
    switch (rangeConfig.rangeType) {
      case 'size':
        return this.detectSizeRange(upperValue);
      case 'gsm':
        return this.detectGsmRange(upperValue);
      default:
        return null;
    }
  }

  /**
   * 👔 SIZE RANGE DETECTION - ROBUST FOR HANDWRITING ERRORS
   * Handles: s-xxl, s.m.l, s/m/l, s m l, s,m,l, etc.
   */
  private static detectSizeRange(value: string): string | null {
    console.log(`📏 Processing size value: "${value}"`);
    
    // Clean up common handwriting issues
    const cleanValue = value.toUpperCase()
      .replace(/[.\s,/|\\]+/g, '-')  // Replace dots, spaces, commas, slashes with dash
      .replace(/[-]+/g, '-')        // Multiple dashes to single dash
      .replace(/^-+|-+$/g, '')      // Remove leading/trailing dashes
      .trim();
    
    console.log(`📏 Cleaned value: "${cleanValue}"`);
    
    // Size abbreviation mapping with fuzzy matching
    const sizeMap: Record<string, string> = {
      'XS': 'XS', 'EXTRASMALL': 'XS', 'EXTRA-SMALL': 'XS',
      'S': 'S', 'SMALL': 'S', 'SM': 'S',
      'M': 'M', 'MEDIUM': 'M', 'MED': 'M', 'MD': 'M',
      'L': 'L', 'LARGE': 'L', 'LG': 'L', 'LRG': 'L',
      'XL': 'XL', 'EXTRALARGE': 'XL', 'EXTRA-LARGE': 'XL', 'XXL': 'XXL', 'XXXL': 'XXXL',
      '2XL': 'XXL', '3XL': 'XXXL', '4XL': 'XXXL'
    };
    
    // Split by dash to detect ranges
    const parts = cleanValue.split('-');
    
    if (parts.length === 1) {
      // Single size - normalize it
      const normalizedSize = sizeMap[parts[0]] || parts[0];
      if (normalizedSize && ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].includes(normalizedSize)) {
        console.log(`📏 Single size detected: "${value}" → "${normalizedSize}"`);
        return normalizedSize;
      }
    } else if (parts.length === 2) {
      // Range detected
      const startSize = sizeMap[parts[0]] || parts[0];
      const endSize = sizeMap[parts[1]] || parts[1];
      
      if (startSize && endSize) {
        const range = `${startSize}-${endSize}`;
        console.log(`📏 Size range detected: "${value}" → "${range}"`);
        return range;
      }
    } else if (parts.length > 2) {
      // Multiple sizes like S-M-L-XL
      const normalizedSizes = parts
        .map(part => sizeMap[part] || part)
        .filter(size => ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].includes(size));
      
      if (normalizedSizes.length >= 2) {
        const range = `${normalizedSizes[0]}-${normalizedSizes[normalizedSizes.length - 1]}`;
        console.log(`📏 Multi-size range detected: "${value}" → "${range}"`);
        return range;
      }
    }
    
    // Fuzzy matching for partial matches
    for (const [key, normalized] of Object.entries(sizeMap)) {
      if (cleanValue.includes(key)) {
        console.log(`📏 Fuzzy size match: "${value}" → "${normalized}"`);
        return normalized;
      }
    }
    
    console.log(`📏 No size match found for: "${value}"`);
    return null;
  }

  /**
   * 🧵 GSM RANGE DETECTION - ROBUST FOR HANDWRITING ERRORS  
   * Handles: 180-220g, 180.220g, 180 220g, 180/220g, etc.
   */
  private static detectGsmRange(value: string): string | null {
    console.log(`🧵 Processing GSM value: "${value}"`);
    
    // Clean up handwriting issues and normalize
    const cleanValue = value.toUpperCase()
      .replace(/[.\s,/|\\]+/g, '-')  // Replace separators with dash
      .replace(/[-]+/g, '-')        // Multiple dashes to single
      .replace(/^-+|-+$/g, '')      // Remove edge dashes
      .replace(/GRAMS?/gi, 'G')     // Normalize grams to G
      .replace(/GSM/gi, 'G')        // Normalize GSM to G
      .trim();
    
    console.log(`🧵 Cleaned GSM value: "${cleanValue}"`);
    
    // Extract numbers from the cleaned string
    const numbers = cleanValue.match(/\d+/g);
    
    if (!numbers || numbers.length === 0) {
      console.log(`🧵 No numbers found in GSM value: "${value}"`);
      return null;
    }
    
    if (numbers.length === 1) {
      // Single GSM value
      const gsm = `${numbers[0]}G`;
      console.log(`🧵 Single GSM detected: "${value}" → "${gsm}"`);
      return gsm;
    } else if (numbers.length === 2) {
      // GSM range  
      const gsmRange = `${numbers[0]}-${numbers[1]}G`;
      console.log(`🧵 GSM range detected: "${value}" → "${gsmRange}"`);
      return gsmRange;
    } else if (numbers.length > 2) {
      // Multiple GSM values - take first and last
      const gsmRange = `${numbers[0]}-${numbers[numbers.length - 1]}G`;
      console.log(`🧵 Multi-GSM range detected: "${value}" → "${gsmRange}"`);
      return gsmRange;
    }
    
    console.log(`🧵 No GSM match found for: "${value}"`);
    return null;
  }

  /**
   * CONTEXTUAL INTELLIGENCE
   * Understands fashion context like size+color combinations
   */
  private static checkContextualIntelligence(value: string, shortForm: string, fullForm: string): number {
    const valueLower = value.toLowerCase();
    const schemaText = `${shortForm} ${fullForm}`.toLowerCase();
    
    // Size context intelligence
    if (this.isLikelySizeContext(valueLower) && this.containsSizeTerms(schemaText)) {
      return 0.88;
    }
    
    // Color context intelligence  
    if (this.isLikelyColorContext(valueLower) && this.containsColorTerms(schemaText)) {
      return 0.88;
    }
    
    // Material context intelligence
    if (this.isLikelyMaterialContext(valueLower) && this.containsMaterialTerms(schemaText)) {
      return 0.88;
    }
    
    // Pattern context intelligence
    if (this.isLikelyPatternContext(valueLower) && this.containsPatternTerms(schemaText)) {
      return 0.88;
    }
    
    return 0;
  }
  
  private static isLikelySizeContext(value: string): boolean {
    return /\b(size|length|width|fit|large|small|medium|xl|xs|inch|cm)\b/.test(value);
  }
  
  private static containsSizeTerms(schema: string): boolean {
    return /\b(xs|s|m|l|xl|xxl|small|medium|large|size|fit)\b/.test(schema);
  }
  
  private static isLikelyColorContext(value: string): boolean {
    return /\b(color|colour|shade|tint|hue|bright|dark|light|deep)\b/.test(value);
  }
  
  private static containsColorTerms(schema: string): boolean {
    return /\b(red|blue|green|black|white|gray|yellow|pink|purple|brown|orange)\b/.test(schema);
  }
  
  private static isLikelyMaterialContext(value: string): boolean {
    return /\b(fabric|material|cotton|poly|wool|silk|blend|synthetic|natural)\b/.test(value);
  }
  
  private static containsMaterialTerms(schema: string): boolean {
    return /\b(cotton|polyester|wool|silk|linen|denim|fabric|material)\b/.test(schema);
  }
  
  private static isLikelyPatternContext(value: string): boolean {
    return /\b(pattern|print|design|stripe|solid|check|floral|dot)\b/.test(value);
  }
  
  private static containsPatternTerms(schema: string): boolean {
    return /\b(stripe|solid|print|check|floral|dot|pattern|plain)\b/.test(schema);
  }

  /**
   * 🧮 ADVANCED STRING SIMILARITY
   * Calculates similarity score using Levenshtein distance + human intelligence
   */
  private static stringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    // Use Levenshtein distance for base similarity
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,     // deletion
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }

    const distance = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
  }
}