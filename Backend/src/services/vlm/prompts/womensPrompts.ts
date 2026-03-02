import { 
  PromptContext, 
  SpecializedPrompt, 
  buildAllowedValuesReference,
  formatAllowedValuesForPrompt
} from './basePrompt';

/**
 * WOMENS/LADIES DEPARTMENT SPECIALIZED PROMPTS
 * 
 * Three specialized prompts for women's fashion:
 * - WOMENS_UPPER: Tops, blouses, tunics, crop tops
 * - WOMENS_LOWER: Pants, jeans, skirts, leggings, palazzos
 * - WOMENS_ALL_IN_ONE: Dresses, jumpsuits, co-ord sets
 * 
 * ALL PROMPTS NOW USE DATABASE VALIDATION:
 * - Extracts allowed values from schema
 * - Instructs VLM to use ONLY database enum values
 * - Prevents hallucinated or invalid values
 */

export function buildWomensUpperPrompt(context: PromptContext): SpecializedPrompt {
  const allowedValuesRef = buildAllowedValuesReference(context.schema);
  
  return {
    systemPrompt: `You are a LADIES UPPER WEAR specialist. Focus on tops, blouses, tunics, crop tops, and shirts.

⚠️ CRITICAL INSTRUCTION:
All extracted values MUST match the allowed values from the database schema.
Do NOT suggest or invent values. Use ONLY the exact enum values provided for each attribute.`,
    
    attributeInstructions: `
DATABASE ALLOWED VALUES FOR THIS CATEGORY:
${Object.entries(allowedValuesRef)
  .filter(([key]) => !['waist_rise', 'leg_style', 'inseam', 'skirt_length', 'rise', 'ankle_style', 'waistband'].some(skip => key.toLowerCase().includes(skip)))
  .map(([key, values]) => `- ${key}: ${formatAllowedValuesForPrompt(values)}`)
  .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIER 1: CRITICAL ATTRIBUTES (Extract FIRST with maximum focus)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 NECKLINE TYPE:
${allowedValuesRef.necklineType ? `
ALLOWED VALUES: ${allowedValuesRef.necklineType.join(', ')}

⚠️ CRITICAL: Extract ONLY from this list. Do NOT invent neckline types.
- Examine the top 15% of the garment
- Identify the exact neckline shape
- Match to the CLOSEST allowed value
- If unsure, pick the most similar allowed value and note LOW confidence

Examples:
✓ GOOD: "crew_neck" (exact match to DB enum)
✓ GOOD: "v_neck" (exact match to DB enum)
✗ BAD: "deep v-neck" (too descriptive, use enum only)
✗ BAD: "not sure" (pick from allowed list)
` : 'Use standard neckline classification'}

📍 SLEEVE LENGTH:
${allowedValuesRef.sleeveLengthType || allowedValuesRef.sleeve_length ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.sleeveLengthType || allowedValuesRef.sleeve_length || [])}

⚠️ CRITICAL: Use ONLY these exact values.
` : 'Use standard sleeve length classification'}

📍 PATTERN/PRINT:
${allowedValuesRef.patternCategory ? `
ALLOWED VALUES: ${allowedValuesRef.patternCategory.join(', ')}

⚠️ CRITICAL: 
- If SOLID color → patternCategory: null or "SOLID"
- If PATTERNED → Use exact enum from allowed list
- Do NOT describe the pattern, use the enum value only

Examples:
✓ GOOD: "FLORAL" (matches DB enum)
✓ GOOD: "GEOMETRIC" (matches DB enum)
✗ BAD: "floral with leaves" (descriptive, use enum only)
✗ BAD: "pretty flowers" (not in allowed list)
` : 'Classify pattern type'}

📍 EMBROIDERY/EMBELLISHMENT:
${allowedValuesRef.embroideryType ? `
ALLOWED VALUES: ${allowedValuesRef.embroideryType.join(', ')}

Detection:
1. Scan for sewn decorations, beads, sequins, raised texture
2. If NONE → embroideryPresent: "NO"
3. If PRESENT → embroideryType: Use exact enum from allowed list

Examples:
✓ GOOD: "hand_embroidery" (matches DB enum)
✓ GOOD: "machine_embroidery" (matches DB enum)
✗ BAD: "beautiful embroidery" (use enum only)
` : 'Identify embroidery type'}

TIER 2: STANDARD ATTRIBUTES

- COLOR: ${allowedValuesRef.color ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.color)}` : 'Primary body color'}
- FIT: ${allowedValuesRef.fitType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.fitType)}` : 'Fitted, regular, loose, oversized'}
- LENGTH: ${allowedValuesRef.length ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.length)}` : 'Crop, regular, tunic, longline'}
- FABRIC: ${allowedValuesRef.fabric ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.fabric)}` : 'Material composition'}

 TIER 3: OPTIONAL ATTRIBUTES (Extract if clearly visible and validate against schema)

- BUST_FIT, HEMLINE, BACK_STYLE: Use allowed values from schema if available

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 EXTRACTION QUALITY CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before finalizing:
✓ All values match database allowed values
✓ No invented or descriptive values
✓ Confidence scores provided for critical attributes
✓ If unsure, pick closest allowed value with LOW confidence
✓ NULL values for attributes not present

⚠️ FINAL RULE: NEVER invent values. Use ONLY from allowed list or leave NULL.
`,
    
    focusAreas: [
      'Database enum validation',
      'Exact value matching',
      'Neckline design classification',
      'Sleeve style and length',
      'Pattern category validation',
      'Embroidery type validation',
      'Confidence scoring'
    ],
    
    skipAttributes: [
      'waist_rise', 'leg_style', 'inseam', 'skirt_length', 'rise',
      'ankle_style', 'waistband'
    ]
  };
}

export function buildWomensLowerPrompt(context: PromptContext): SpecializedPrompt {
  const allowedValuesRef = buildAllowedValuesReference(context.schema);
  
  return {
    systemPrompt: `You are a LADIES LOWER WEAR specialist. Focus on pants, jeans, skirts, leggings, palazzos, and shorts.

⚠️ CRITICAL INSTRUCTION:
All extracted values MUST match the allowed values from the database schema.
Do NOT suggest or invent values. Use ONLY the exact enum values provided for each attribute.`,
    
    attributeInstructions: `
DATABASE ALLOWED VALUES FOR THIS CATEGORY:
${Object.entries(allowedValuesRef)
  .filter(([key]) => !['sleeve_length', 'neckline', 'collar_type', 'bust_fit', 'strap_style', 'shoulder_style', 'back_style'].some(skip => key.toLowerCase().includes(skip)))
  .map(([key, values]) => `- ${key}: ${formatAllowedValuesForPrompt(values)}`)
  .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIER 1: CRITICAL ATTRIBUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 BOTTOM TYPE:
${allowedValuesRef.bottomType ? `
ALLOWED VALUES: ${allowedValuesRef.bottomType.join(', ')}

⚠️ Use ONLY these exact values. No descriptive terms.
` : 'Classify bottom type'}

📍 WAIST RISE:
${allowedValuesRef.waistRise || allowedValuesRef.waist_rise ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.waistRise || allowedValuesRef.waist_rise || [])}

Measure from crotch to waistband:
- LOW: Below natural waist
- MID: At natural waist
- HIGH: Above natural waist

⚠️ Use exact enum from allowed list.
` : 'Classify waist rise'}

📍 LEG STYLE:
${allowedValuesRef.legStyle || allowedValuesRef.leg_style ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.legStyle || allowedValuesRef.leg_style || [])}

⚠️ CRITICAL: Match leg shape to exact enum value.

Examples:
✓ GOOD: "straight" (matches DB enum)
✓ GOOD: "wide_leg" (matches DB enum)
✗ BAD: "loose and flowy" (descriptive, use enum only)
` : 'Classify leg style'}

📍 LENGTH:
${allowedValuesRef.length ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.length)}

⚠️ Use exact enum from list.
` : 'Classify length'}

📍 PATTERN/PRINT:
${allowedValuesRef.patternCategory ? `
ALLOWED VALUES: ${allowedValuesRef.patternCategory.join(', ')}

⚠️ CRITICAL: Use ONLY these values for pattern classification.
` : 'Classify pattern'}

TIER 2: STANDARD ATTRIBUTES

- COLOR: ${allowedValuesRef.color ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.color)}` : 'Primary color'}
- FIT: ${allowedValuesRef.fitType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.fitType)}` : 'Fitted, regular, relaxed'}
- FABRIC: ${allowedValuesRef.fabric ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.fabric)}` : 'Material type'}
- CLOSURE: ${allowedValuesRef.closureType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.closureType)}` : 'Zipper, button, elastic'}

 TIER 3: OPTIONAL ATTRIBUTES

- WAISTBAND, POCKETS, HEMLINE: Use allowed values from schema if available
- EMBROIDERY: ${allowedValuesRef.embroideryType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.embroideryType)}` : 'Check for embellishments'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ SKIP THESE ATTRIBUTES (Not applicable to lower wear):
SLEEVE_LENGTH, NECKLINE, COLLAR_TYPE, BUST_FIT, STRAP_STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ FINAL RULE: All values from database allowed list. No invented values. Use NULL if attribute not present.
`,
    
    focusAreas: [
      'Database enum validation',
      'Waist construction and rise',
      'Leg cut and silhouette validation',
      'Length and proportion',
      'Pattern category validation',
      'Fabric and closure details'
    ],
    
    skipAttributes: [
      'sleeve_length', 'neckline', 'collar_type', 'bust_fit', 'strap_style',
      'shoulder_style', 'back_style'
    ]
  };
}

export function buildWomensAllInOnePrompt(context: PromptContext): SpecializedPrompt {
  const allowedValuesRef = buildAllowedValuesReference(context.schema);
  
  return {
    systemPrompt: `You are a LADIES FULL GARMENT specialist. Focus on dresses, jumpsuits, co-ord sets, and ethnic suits.

⚠️ CRITICAL INSTRUCTION:
All extracted values MUST match the allowed values from the database schema.
Do NOT suggest or invent values. Use ONLY the exact enum values provided for each attribute.`,
    
    attributeInstructions: `
DATABASE ALLOWED VALUES FOR THIS CATEGORY:
${Object.entries(allowedValuesRef)
  .map(([key, values]) => `- ${key}: ${formatAllowedValuesForPrompt(values)}`)
  .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIER 1: CRITICAL ATTRIBUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 GARMENT TYPE:
${allowedValuesRef.garmentType || allowedValuesRef.garment_type || allowedValuesRef.dressType || allowedValuesRef.dress_type ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.garmentType || allowedValuesRef.garment_type || allowedValuesRef.dressType || allowedValuesRef.dress_type || [])}

⚠️ Use ONLY these exact values for full garments.
` : 'Dress, jumpsuit, co-ord, suit'}

📍 NECKLINE TYPE:
${allowedValuesRef.necklineType ? `
ALLOWED VALUES: ${allowedValuesRef.necklineType.join(', ')}

⚠️ CRITICAL: Extract ONLY from this list.

Examples:
✓ GOOD: "v_neck" (exact enum from DB)
✗ BAD: "deep v-neck" (descriptive)
✓ GOOD: "sweetheart" (exact enum)
✗ BAD: "sweetheart neckline with straps" (too descriptive)
` : 'Classify neckline'}

📍 SLEEVE LENGTH:
${allowedValuesRef.sleeveLength || allowedValuesRef.sleeve_length ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.sleeveLength || allowedValuesRef.sleeve_length || [])}

⚠️ Use exact enum from allowed list.
` : 'Classify sleeve length'}

📍 LENGTH:
${allowedValuesRef.length ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.length)}

⚠️ Use exact enum from list.
` : 'Classify dress/garment length'}

📍 PATTERN/PRINT:
${allowedValuesRef.patternCategory ? `
ALLOWED VALUES: ${allowedValuesRef.patternCategory.join(', ')}

⚠️ CRITICAL: Use ONLY these values for pattern classification.
` : 'Classify pattern'}

📍 SILHOUETTE:
${allowedValuesRef.silhouette ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.silhouette)}

⚠️ Match overall shape to exact enum value.

Examples:
✓ GOOD: "a_line" (matches DB enum)
✗ BAD: "flared from waist" (descriptive)
✓ GOOD: "bodycon" (matches DB enum)
✗ BAD: "tight fitting" (descriptive)
` : 'A-line, bodycon, shift, wrap'}

TIER 2: STANDARD ATTRIBUTES

- COLOR: ${allowedValuesRef.color ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.color)}` : 'Primary color'}
- FIT: ${allowedValuesRef.fitType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.fitType)}` : 'Fitted, regular, relaxed, flowy'}
- FABRIC: ${allowedValuesRef.fabric ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.fabric)}` : 'Material type'}
- OCCASION: ${allowedValuesRef.occasion ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.occasion)}` : 'Casual, party, formal'}

 TIER 3: OPTIONAL ATTRIBUTES

- BACK_STYLE: ${allowedValuesRef.backStyle ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.backStyle)}` : 'Zipper, backless, tie'}
- CLOSURE: ${allowedValuesRef.closureType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.closureType)}` : 'Zipper, button, tie'}
- EMBROIDERY: ${allowedValuesRef.embroideryType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.embroideryType)}` : 'Check for embellishments'}
- EMBELLISHMENT: ${allowedValuesRef.embellishment ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.embellishment)}` : 'Sequins, lace, beads'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ QUALITY CHECKLIST:
✓ All values match database allowed values exactly
✓ Use NULL for attributes that are not present/visible
✓ Use underscore format (snake_case) for multi-word values
✓ Confidence scoring: HIGH (perfect match), MEDIUM (partial), LOW (guess), UNCERTAIN (can't determine)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ FINAL RULE: NEVER invent values. Extract from database enums ONLY.
`,
    
    focusAreas: [
      'Database enum validation',
      'Overall silhouette and shape',
      'Neckline and bodice design validation',
      'Sleeve styling',
      'Length and proportion',
      'Print and embellishment details validation',
      'Fit and draping'
    ],
    
    skipAttributes: [] // All attributes potentially applicable
  };
}
