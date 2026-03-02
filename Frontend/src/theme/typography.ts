/**
 * Typography System
 * Consistent typography scale for fonts, sizes, and weights
 */

import type { CSSProperties } from 'react';

// Font families
export const fontFamily = {
  base: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  mono: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
  code: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
} as const;

// Font sizes
export const fontSize = {
  xs: 12,    // 0.75rem
  sm: 14,    // 0.875rem
  base: 16,  // 1rem (default)
  lg: 18,    // 1.125rem
  xl: 20,    // 1.25rem
  '2xl': 24, // 1.5rem
  '3xl': 30, // 1.875rem
  '4xl': 36, // 2.25rem
  '5xl': 48, // 3rem
  '6xl': 60, // 3.75rem
  '7xl': 72, // 4.5rem
  '8xl': 96, // 6rem
  '9xl': 128, // 8rem
} as const;

// Font weights
export const fontWeight = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

// Line heights
export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
  
  // Semantic line heights
  heading: 1.2,
  body: 1.5715,
  button: 1.5715,
} as const;

// Letter spacing
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

// Typography variants (complete styles)
export const typography = {
  // Headings
  h1: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.heading,
  },
  h2: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.heading,
  },
  h3: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.heading,
  },
  h4: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.heading,
  },
  h5: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.heading,
  },
  h6: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.heading,
  },
  
  // Body text
  body1: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.base,
  },
  body2: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.base,
  },
  
  // Subtitles
  subtitle1: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.base,
  },
  subtitle2: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.base,
  },
  
  // Captions
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.base,
  },
  overline: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
    fontFamily: fontFamily.base,
  },
  
  // Code
  code: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.code,
  },
  
  // Buttons
  button: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.button,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.base,
  },
  buttonLarge: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.button,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.base,
  },
  buttonSmall: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.button,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.base,
  },
} as const;

// Helper function to get typography styles
export const getTypographyStyle = (
  variant: keyof typeof typography
): CSSProperties => {
  return typography[variant] as CSSProperties;
};

// Text truncation utilities
export const textTruncate = {
  single: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as CSSProperties,
  
  multiline: (lines: number) => ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as CSSProperties),
};

// Export types
export type FontFamily = keyof typeof fontFamily;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type LineHeight = keyof typeof lineHeight;
export type LetterSpacing = keyof typeof letterSpacing;
export type TypographyVariant = keyof typeof typography;

// Export default
export default {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  typography,
  getTypographyStyle,
  textTruncate,
};
