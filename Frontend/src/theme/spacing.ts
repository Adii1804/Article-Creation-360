/**
 * Spacing System
 * Consistent spacing scale for margins, padding, and gaps
 */

export const spacing = {
  // Base spacing unit (4px)
  unit: 4,
  
  // Spacing scale
  0: 0,
  1: 4,    // 0.25rem
  2: 8,    // 0.5rem
  3: 12,   // 0.75rem
  4: 16,   // 1rem
  5: 20,   // 1.25rem
  6: 24,   // 1.5rem
  7: 28,   // 1.75rem
  8: 32,   // 2rem
  9: 36,   // 2.25rem
  10: 40,  // 2.5rem
  11: 44,  // 2.75rem
  12: 48,  // 3rem
  14: 56,  // 3.5rem
  16: 64,  // 4rem
  20: 80,  // 5rem
  24: 96,  // 6rem
  28: 112, // 7rem
  32: 128, // 8rem
  
  // Named spacing (semantic)
  none: 0,
  xxs: 4,   // Extra extra small
  xs: 8,    // Extra small
  sm: 12,   // Small
  md: 16,   // Medium (default)
  lg: 24,   // Large
  xl: 32,   // Extra large
  xxl: 48,  // Extra extra large
  xxxl: 64, // Extra extra extra large
  
  // Section spacing (for page layouts)
  section: {
    xs: 16,
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
    xxl: 96,
  },
  
  // Component spacing
  component: {
    padding: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 24,
      xl: 32,
    },
    margin: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 24,
      xl: 32,
    },
    gap: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 24,
      xl: 32,
    },
  },
  
  // Container spacing
  container: {
    padding: {
      mobile: 16,
      tablet: 24,
      desktop: 32,
      wide: 48,
    },
    maxWidth: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
      full: 1920,
    },
  },
  
  // Grid gaps
  grid: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
} as const;

// Helper functions
export const getSpacing = (multiplier: number): number => {
  return spacing.unit * multiplier;
};

export const px = (value: number): string => {
  return `${value}px`;
};

export const rem = (value: number): string => {
  return `${value / 16}rem`;
};

// Export individual spacing groups
export const {
  unit,
  none,
  xxs,
  xs,
  sm,
  md,
  lg,
  xl,
  xxl,
  xxxl,
  section,
  component,
  container,
  grid,
} = spacing;

// Types
export type SpacingScale = keyof typeof spacing;
export type SpacingValue = typeof spacing[SpacingScale];

export default spacing;
