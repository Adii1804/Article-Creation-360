/**
 * Theme System - Central Export
 * Import this to access the complete design system
 */

import antdThemeConfig from './antd-theme';
import colorsConfig from './colors';
import spacingConfig from './spacing';
import typographyConfig from './typography';

export { default as antdTheme } from './antd-theme';
export { default as colors, primary, success, warning, error, info, neutral, text, background, border, functional, chart, status, semantic } from './colors';
export { default as spacing, unit, none, xxs, xs, sm, md, lg, xl, xxl, xxxl, section, component, container, grid, getSpacing, px, rem } from './spacing';
export { default as typography, fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, getTypographyStyle, textTruncate } from './typography';

// Export types
export type { ColorPalette, PrimaryColor, SuccessColor, WarningColor, ErrorColor, NeutralColor, ChartColor } from './colors';
export type { SpacingScale, SpacingValue } from './spacing';
export type { FontFamily, FontSize, FontWeight, LineHeight, LetterSpacing, TypographyVariant } from './typography';

// Complete theme object
export const theme = {
  antd: antdThemeConfig,
  colors: colorsConfig,
  spacing: spacingConfig,
  typography: typographyConfig,
} as const;

export default theme;
