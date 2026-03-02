import type { RangeConfiguration, NumericRange } from '../../types/category/CategoryTypes';

/**
 * SMART RANGE DETECTION UTILITY
 * 
 * Intelligently detects and formats attribute ranges like:
 * - Size ranges: "S-XXL", "XS-L", individual sizes
 * - GSM ranges: "120-150G", "100G", numeric values
 * - Custom patterns with fallback to raw values
 */

export class RangeDetector {
  
  // 📏 SIZE HIERARCHY (ordered from smallest to largest)
  private static readonly SIZE_HIERARCHY = [
    '0-3M', '0-6M', '3-6M', '6-12M', '12-18M', '18-24M',
    '2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y', '14-15Y', '14Y', '15Y', '16Y', '17Y',
    'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', '4XL', '5XL',
    '16', '18', '20', '22', '24', '26', '28', '30', '32', '34', '36', '38', '40', '42', '44',
    '75', '80', '85', '90', '95', '100'
  ];

  // 🧵 GSM COMMON RANGES
  private static readonly GSM_RANGES: NumericRange[] = [
    { min: 80, max: 100, label: '80-100G', unit: 'G' },
    { min: 100, max: 120, label: '100-120G', unit: 'G' },
    { min: 120, max: 140, label: '120-140G', unit: 'G' },
    { min: 140, max: 160, label: '140-160G', unit: 'G' },
    { min: 160, max: 180, label: '160-180G', unit: 'G' },
    { min: 180, max: 200, label: '180-200G', unit: 'G' },
    { min: 200, max: 250, label: '200-250G', unit: 'G' },
    { min: 250, max: 300, label: '250-300G', unit: 'G' }
  ];

  /**
   * MAIN DETECTION METHOD
   * Analyzes extracted text and returns formatted range or raw value
   */
  public static detectRange(
    extractedText: string, 
    rangeConfig: RangeConfiguration
  ): string {
    if (!rangeConfig.enableRangeDetection) {
      return extractedText;
    }

    const cleanText = extractedText.trim().toUpperCase();
    
    switch (rangeConfig.rangeType) {
      case 'size':
        return this.detectSizeRange(cleanText, rangeConfig);
      
      case 'gsm':
        return this.detectGsmRange(cleanText, rangeConfig);
      
      case 'numeric':
        return this.detectNumericRange(cleanText, rangeConfig);
      
      case 'custom':
        return this.detectCustomRange(cleanText, rangeConfig);
      
      default:
        return rangeConfig.fallbackToRaw ? extractedText : cleanText;
    }
  }

  /**
   * 👔 SIZE RANGE DETECTION
   * Detects patterns like "S-XXL", "SMALL TO EXTRA LARGE", individual sizes
   */
  private static detectSizeRange(text: string, config: RangeConfiguration): string {
    const hierarchy = config.sizeHierarchy || this.SIZE_HIERARCHY;
    
    // 1. Check for explicit ranges: "S-XXL", "XS-L", "SMALL TO LARGE"
    const rangePatterns = [
      /([A-Z0-9-]+)\s*(?:-|TO|THROUGH)\s*([A-Z0-9-]+)/,
      /FROM\s*([A-Z0-9-]+)\s*(?:TO|THROUGH)\s*([A-Z0-9-]+)/,
      /SIZE\s*([A-Z0-9-]+)\s*(?:-|TO)\s*([A-Z0-9-]+)/
    ];

    for (const pattern of rangePatterns) {
      const match = text.match(pattern);
      if (match) {
        const [, startSize, endSize] = match;
        const formattedRange = this.formatSizeRange(startSize, endSize, hierarchy);
        if (formattedRange) return formattedRange;
      }
    }

    // 2. Check for individual sizes in hierarchy
    for (const size of hierarchy) {
      if (text.includes(size)) {
        return size;
      }
    }

    // 3. Check for size keywords and map them
    const sizeMap: Record<string, string> = {
      'EXTRA SMALL': 'XS',
      'SMALL': 'S', 
      'MEDIUM': 'M',
      'LARGE': 'L',
      'EXTRA LARGE': 'XL',
      'DOUBLE EXTRA LARGE': 'XXL',
      'TRIPLE EXTRA LARGE': 'XXXL'
    };

    for (const [keyword, standardSize] of Object.entries(sizeMap)) {
      if (text.includes(keyword)) {
        return standardSize;
      }
    }

    // 4. Fallback to raw if enabled
    return config.fallbackToRaw ? text : 'SIZE_NOT_DETECTED';
  }

  /**
   * 🧵 GSM RANGE DETECTION
   * Detects fabric weight patterns like "120G", "100-150G", "120 GSM"
   */
  private static detectGsmRange(text: string, config: RangeConfiguration): string {
    const ranges = config.numericRanges || this.GSM_RANGES;
    
    // 1. Check for explicit GSM ranges: "120-150G", "100 TO 140 GSM"
    const rangePatterns = [
      /(\d+)\s*(?:-|TO|THROUGH)\s*(\d+)\s*(?:G|GSM|GRAMS?)/,
      /(\d+)\s*(?:G|GSM|GRAMS?)\s*(?:-|TO)\s*(\d+)\s*(?:G|GSM|GRAMS?)/
    ];

    for (const pattern of rangePatterns) {
      const match = text.match(pattern);
      if (match) {
        const [, minVal, maxVal] = match;
        return `${minVal}-${maxVal}G`;
      }
    }

    // 2. Check for single GSM values: "120G", "150 GSM"
    const singleGsmMatch = text.match(/(\d+)\s*(?:G|GSM|GRAMS?)/);
    if (singleGsmMatch) {
      const gsmValue = parseInt(singleGsmMatch[1]);
      
      // Find appropriate range for this GSM value
      for (const range of ranges) {
        if (gsmValue >= range.min && gsmValue <= range.max) {
          return range.label;
        }
      }
      
      // Return individual value if no range matches
      return `${gsmValue}G`;
    }

    // 3. Check for just numbers and infer GSM
    const numberMatch = text.match(/(\d{2,3})/); // 2-3 digit numbers likely GSM
    if (numberMatch) {
      const num = parseInt(numberMatch[1]);
      if (num >= 80 && num <= 500) { // Reasonable GSM range
        // Find range for this number
        for (const range of ranges) {
          if (num >= range.min && num <= range.max) {
            return range.label;
          }
        }
        return `${num}G`;
      }
    }

    return config.fallbackToRaw ? text : 'GSM_NOT_DETECTED';
  }

  /**
   * 🔢 NUMERIC RANGE DETECTION
   * For general numeric ranges
   */
  private static detectNumericRange(text: string, config: RangeConfiguration): string {
    const ranges = config.numericRanges || [];
    
    const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-|TO|THROUGH)\s*(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      const [, min, max] = rangeMatch;
      return `${min}-${max}`;
    }

    const singleMatch = text.match(/(\d+(?:\.\d+)?)/);
    if (singleMatch) {
      const value = parseFloat(singleMatch[1]);
      
      for (const range of ranges) {
        if (value >= range.min && value <= range.max) {
          return range.label;
        }
      }
      
      return singleMatch[1];
    }

    return config.fallbackToRaw ? text : 'NUMERIC_NOT_DETECTED';
  }

  /**
   * 🎨 CUSTOM RANGE DETECTION
   * For custom patterns defined in config
   */
  private static detectCustomRange(text: string, config: RangeConfiguration): string {
    const customRanges = config.customRanges || [];
    
    for (const customRange of customRanges) {
      if (text.includes(customRange)) {
        return customRange;
      }
    }

    return config.fallbackToRaw ? text : 'CUSTOM_NOT_DETECTED';
  }

  /**
   * 📐 SIZE RANGE FORMATTER
   * Formats size range based on hierarchy
   */
  private static formatSizeRange(startSize: string, endSize: string, hierarchy: string[]): string | null {
    const startIndex = hierarchy.indexOf(startSize);
    const endIndex = hierarchy.indexOf(endSize);
    
    if (startIndex !== -1 && endIndex !== -1) {
      if (startIndex <= endIndex) {
        return `${startSize}-${endSize}`;
      } else {
        return `${endSize}-${startSize}`; // Swap if order is wrong
      }
    }
    
    return null;
  }

  /**
   * ✅ VALIDATION HELPERS
   */
  public static isValidRange(text: string, rangeType: string): boolean {
    switch (rangeType) {
      case 'size':
        return this.SIZE_HIERARCHY.some(size => text.includes(size)) || 
               /([A-Z0-9]+)-([A-Z0-9]+)/.test(text);
      
      case 'gsm':
        return /\d+\s*(?:G|GSM)/.test(text) || 
               /\d+-\d+\s*(?:G|GSM)/.test(text);
      
      default:
        return true;
    }
  }
}