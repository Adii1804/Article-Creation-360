import { PromptContext, SpecializedPrompt, buildAllowedValuesReference, formatAllowedValuesForPrompt } from './basePrompt';

/**
 * MENS DEPARTMENT SPECIALIZED PROMPTS
 * 
 * Three specialized prompts for men's fashion:
 * - MENS_UPPER: Shirts, t-shirts, jackets, sweaters
 * - MENS_LOWER: Pants, jeans, shorts, trousers
 * - MENS_ALL_IN_ONE: Suits, kurta sets, complete outfits
 */

export function buildMensUpperPrompt(context: PromptContext): SpecializedPrompt {
  const allowedValuesRef = buildAllowedValuesReference(context.schema);
  
  return {
    systemPrompt: `You are a MENS UPPER WEAR specialist. Focus on shirts, t-shirts, jackets, sweaters, and tops.

⚠️ CRITICAL INSTRUCTION:
All extracted values MUST match the allowed values from the database schema.
Do NOT suggest or invent values. Use ONLY the exact enum values provided for each attribute.`,
    
    attributeInstructions: `
DATABASE ALLOWED VALUES FOR THIS CATEGORY:
${Object.entries(allowedValuesRef)
  .filter(([key]) => !['waist_rise', 'leg_style', 'inseam', 'waistband', 'ankle_style', 'bottom_type'].some(skip => key.toLowerCase().includes(skip)))
  .map(([key, values]) => `- ${key}: ${formatAllowedValuesForPrompt(values)}`)
  .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIER 1: CRITICAL ATTRIBUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 SLEEVE LENGTH:
${allowedValuesRef.sleeveLength || allowedValuesRef.sleeve_length ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.sleeveLength || allowedValuesRef.sleeve_length || [])}

⚠️ Use exact enum from allowed list.
` : 'Full sleeve, half sleeve, sleeveless'}

📍 NECKLINE/COLLAR:
${allowedValuesRef.necklineType || allowedValuesRef.collarType ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.necklineType || allowedValuesRef.collarType || [])}

⚠️ CRITICAL: Extract ONLY from this list.

Examples:
✓ GOOD: "crew_neck" (exact enum)
✗ BAD: "round neckline" (descriptive)
` : 'Round neck, V-neck, collar'}

📍 PATTERN/PRINT:
${allowedValuesRef.patternCategory ? `
ALLOWED VALUES: ${allowedValuesRef.patternCategory.join(', ')}

⚠️ CRITICAL: Use ONLY these values for pattern classification.
` : 'Solid, striped, printed, checks'}

TIER 2: STANDARD ATTRIBUTES

- COLOR: ${allowedValuesRef.color ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.color)}` : 'Primary body color'}
- FIT: ${allowedValuesRef.fitType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.fitType)}` : 'Regular, slim, oversized'}
- FABRIC: ${allowedValuesRef.fabric ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.fabric)}` : 'Cotton, polyester, blend'}
- CLOSURE: ${allowedValuesRef.closureType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.closureType)}` : 'Buttons, zipper, pullover'}

 TIER 3: OPTIONAL ATTRIBUTES

- POCKET: ${allowedValuesRef.pocketType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.pocketType)}` : 'Chest pocket, side pockets'}
- HEMLINE: ${allowedValuesRef.hemlineStyle ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.hemlineStyle)}` : 'Straight, curved, ribbed'}
- BRAND: Check neck labels, logos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ SKIP THESE ATTRIBUTES (Not applicable to upper wear):
WAIST_RISE, LEG_STYLE, INSEAM, WAISTBAND, ANKLE_STYLE, BOTTOM_TYPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ FINAL RULE: All values from database allowed list. No invented values. Use NULL if attribute not present.
`,
    
    focusAreas: [
      'Database enum validation',
      'Sleeve construction and length',
      'Neckline and collar details validation',
      'Fit through shoulders and chest',
      'Pattern category validation',
      'Fabric texture and weight',
      'Color accuracy in body, sleeves, collar'
    ],
    
    skipAttributes: [
      'waist_rise', 'leg_style', 'inseam', 'waistband', 'ankle_style',
      'skirt_length', 'dress_length', 'rise', 'bottom_type'
    ]
  };
}

export function buildMensLowerPrompt(context: PromptContext): SpecializedPrompt {
  const allowedValuesRef = buildAllowedValuesReference(context.schema);
  
  return {
    systemPrompt: `You are a MENS LOWER WEAR specialist. Focus on pants, jeans, shorts, trousers, and joggers.

⚠️ CRITICAL INSTRUCTION:
All extracted values MUST match the allowed values from the database schema.
Do NOT suggest or invent values. Use ONLY the exact enum values provided for each attribute.`,
    
    attributeInstructions: `
DATABASE ALLOWED VALUES FOR THIS CATEGORY:
${Object.entries(allowedValuesRef)
  .filter(([key]) => !['sleeve_length', 'neckline', 'collar_type', 'shoulder_style', 'bust_fit'].some(skip => key.toLowerCase().includes(skip)))
  .map(([key, values]) => `- ${key}: ${formatAllowedValuesForPrompt(values)}`)
  .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIER 1: CRITICAL ATTRIBUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 LEG STYLE:
${allowedValuesRef.legStyle || allowedValuesRef.leg_style ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.legStyle || allowedValuesRef.leg_style || [])}

⚠️ CRITICAL: Match leg shape to exact enum value.

Examples:
✓ GOOD: "straight" (matches DB enum)
✗ BAD: "regular cut" (descriptive)
` : 'Straight, slim, tapered, relaxed, cargo'}

📍 WAIST RISE:
${allowedValuesRef.waistRise || allowedValuesRef.waist_rise ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.waistRise || allowedValuesRef.waist_rise || [])}

⚠️ Use exact enum from allowed list.
` : 'Low, mid, high'}

📍 LENGTH:
${allowedValuesRef.length ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.length)}

⚠️ Use exact enum from list.
` : 'Full length, cropped, shorts'}

TIER 2: STANDARD ATTRIBUTES

- COLOR: ${allowedValuesRef.color ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.color)}` : 'Primary color, wash'}
- FIT: ${allowedValuesRef.fitType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.fitType)}` : 'Slim, regular, relaxed'}
- FABRIC: ${allowedValuesRef.fabric ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.fabric)}` : 'Denim, cotton, chino'}
- CLOSURE: ${allowedValuesRef.closureType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.closureType)}` : 'Zipper, button, drawstring'}

 TIER 3: OPTIONAL ATTRIBUTES

- POCKETS: ${allowedValuesRef.pocketType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.pocketType)}` : 'Side, back, cargo'}
- WAISTBAND: ${allowedValuesRef.waistbandType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.waistbandType)}` : 'Belt loops, elastic'}
- ANKLE_STYLE: ${allowedValuesRef.ankleStyle ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.ankleStyle)}` : 'Regular, cuffed, tapered'}
- DISTRESSING: For denim - rips, fading, whiskering

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ SKIP THESE ATTRIBUTES (Not applicable to lower wear):
SLEEVE_LENGTH, NECKLINE, COLLAR_TYPE, SHOULDER_STYLE, BUST_FIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ FINAL RULE: All values from database allowed list. No invented values. Use NULL if attribute not present.
`,
    
    focusAreas: [
      'Database enum validation',
      'Waist construction and rise',
      'Leg cut and silhouette validation',
      'Fabric weight and stretch',
      'Pocket placement and style',
      'Hem and ankle finishing'
    ],
    
    skipAttributes: [
      'sleeve_length', 'neckline', 'collar_type', 'shoulder_style',
      'bust_fit', 'strap_style'
    ]
  };
}

export function buildMensAllInOnePrompt(context: PromptContext): SpecializedPrompt {
  const allowedValuesRef = buildAllowedValuesReference(context.schema);
  
  return {
    systemPrompt: `You are a MENS FULL GARMENT specialist. Focus on complete outfits: suits, jumpsuits, sets, kurta sets.

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

📍 TOP STYLE:
${allowedValuesRef.topStyle || allowedValuesRef.garmentType ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.topStyle || allowedValuesRef.garmentType || [])}

⚠️ Use exact enum for upper garment classification.
` : 'Shirt, kurta, jacket'}

📍 BOTTOM STYLE:
${allowedValuesRef.bottomStyle || allowedValuesRef.bottomType ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.bottomStyle || allowedValuesRef.bottomType || [])}

⚠️ Use exact enum for lower garment classification.
` : 'Pants, trousers, pajama'}

📍 MATCHING:
${allowedValuesRef.matching || allowedValuesRef.coordination ? `
ALLOWED VALUES: ${formatAllowedValuesForPrompt(allowedValuesRef.matching || allowedValuesRef.coordination || [])}

⚠️ Classify coordination from allowed list.
` : 'Coordinated, contrasting'}

TIER 2: UPPER COMPONENT ATTRIBUTES

- SLEEVE_LENGTH: ${allowedValuesRef.sleeveLength ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.sleeveLength)}` : 'Full, half, sleeveless'}
- NECKLINE/COLLAR: ${allowedValuesRef.necklineType || allowedValuesRef.collarType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.necklineType || allowedValuesRef.collarType || [])}` : 'Round, collar'}
- TOP_FIT: ${allowedValuesRef.fitType ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.fitType)}` : 'Slim, regular, relaxed'}

TIER 3: LOWER COMPONENT ATTRIBUTES

- LEG_STYLE: ${allowedValuesRef.legStyle ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.legStyle)}` : 'Straight, tapered'}
- WAIST_RISE: ${allowedValuesRef.waistRise ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.waistRise)}` : 'Low, mid, high'}
- LENGTH: ${allowedValuesRef.length ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.length)}` : 'Full, cropped'}

 TIER 4: COMMON ATTRIBUTES

- COLOR: ${allowedValuesRef.color ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.color)}` : 'Primary color of set'}
- FABRIC: ${allowedValuesRef.fabric ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.fabric)}` : 'Material of both pieces'}
- OCCASION: ${allowedValuesRef.occasion ? `Use from: ${formatAllowedValuesForPrompt(allowedValuesRef.occasion)}` : 'Casual, formal, ethnic'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ IMPORTANT: Extract attributes for BOTH upper and lower components
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ FINAL RULE: All values from database allowed list. No invented values. Use NULL if attribute not present.
`,
    
    focusAreas: [
      'Database enum validation',
      'Upper garment construction',
      'Lower garment construction',
      'Color coordination validation',
      'Overall fit and styling',
      'Fabric consistency across pieces'
    ],
    
    skipAttributes: [] // All attributes potentially applicable
  };
}
