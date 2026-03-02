/**
 * Color Palette System
 * Centralized color definitions for the application
 */

export const colors = {
  // Primary Colors
  primary: {
    50: '#F2FBFA',
    100: '#DDF3F1',
    200: '#C1E8E4',
    300: '#A4DBD7',
    400: '#8CCBC6',
    500: '#7DB9B6', // Main primary
    600: '#6AA6A3',
    700: '#568F8D',
    800: '#447371',
    900: '#345756',
  },
  
  // Success Colors
  success: {
    50: '#F4FBF4',
    100: '#E2F3E1',
    200: '#C8E7C5',
    300: '#ACD9A8',
    400: '#96CB97',
    500: '#9CCB9A', // Main success
    600: '#7FB283',
    700: '#5F8E64',
    800: '#4A6E4D',
    900: '#355336',
  },
  
  // Warning Colors
  warning: {
    50: '#FFF8EC',
    100: '#F9EAD0',
    200: '#F2D9AE',
    300: '#EBC88F',
    400: '#E3BA79',
    500: '#E6C79C', // Main warning
    600: '#CFAF7F',
    700: '#B09261',
    800: '#8F7447',
    900: '#6B5633',
  },
  
  // Error Colors
  error: {
    50: '#FFF5F5',
    100: '#FADDDD',
    200: '#F2C0C0',
    300: '#E9A3A3',
    400: '#E08F8F', // Main error
    500: '#E08F8F',
    600: '#C97676',
    700: '#A85D5D',
    800: '#824646',
    900: '#5C3333',
  },
  
  // Info Colors
  info: {
    50: '#F4F6FB',
    100: '#E2E8F4',
    200: '#C8D3EA',
    300: '#AABBD9',
    400: '#91A6CC',
    500: '#A7B6D9', // Main info
    600: '#8799C4',
    700: '#6A7BA8',
    800: '#4F5E84',
    900: '#39455E',
  },
  
  // Neutral Colors (Gray Scale)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#f0f0f0',
    300: '#d9d9d9',
    400: '#bfbfbf',
    500: '#8c8c8c',
    600: '#595959',
    700: '#434343',
    800: '#262626',
    900: '#1f1f1f',
    950: '#141414',
  },
  
  // Text Colors
  text: {
    primary: '#3F3A34',
    secondary: '#7A6F66',
    tertiary: '#A79D94',
    quaternary: '#C9BFB6',
    disabled: '#C9BFB6',
    inverse: '#ffffff',
  },
  
  // Background Colors
  background: {
    base: '#FBF8F4',
    container: '#FFFFFF',
    elevated: '#FFFFFF',
    layout: '#F7F2EC',
    spotlight: '#EFE5DA',
    mask: 'rgba(0, 0, 0, 0.45)',
  },
  
  // Border Colors
  border: {
    base: '#E6DDD3',
    secondary: '#F1E9E0',
    light: '#FBF6F0',
  },
  
  // Functional Colors
  functional: {
    link: '#7DB9B6',
    linkHover: '#8FC6C3',
    linkActive: '#6AA6A3',
    linkVisited: '#531dab',
  },
  
  // Chart Colors (for analytics)
  chart: {
    blue: '#A7B6D9',
    green: '#9CCB9A',
    cyan: '#13c2c2',
    purple: '#7DB9B6',
    magenta: '#eb2f96',
    red: '#E08F8F',
    orange: '#E6C79C',
    yellow: '#E6C79C',
    volcano: '#fa541c',
    geekblue: '#7F8EB8',
    lime: '#a0d911',
    gold: '#E6C79C',
  },
  
  // Status Colors
  status: {
    processing: '#A7B6D9',
    success: '#9CCB9A',
    error: '#E08F8F',
    warning: '#E6C79C',
    default: '#d9d9d9',
  },
  
  // Semantic Colors (for specific use cases)
  semantic: {
    // Dashboard
    dashboardBg: '#F7F2EC',
    cardBg: '#ffffff',
    cardBorder: '#F1E9E0',
    
    // Sidebar
    sidebarBg: '#2F2A25',
    sidebarText: 'rgba(255, 255, 255, 0.72)',
    sidebarTextActive: '#ffffff',
    sidebarItemHover: 'rgba(255, 255, 255, 0.10)',
    sidebarItemActive: '#7DB9B6',
    
    // Header
    headerBg: '#ffffff',
    headerBorder: '#F1E9E0',
    headerText: '#3F3A34',
    
    // Footer
    footerBg: '#F7F2EC',
    footerText: '#7A6F66',
    
    // Table
    tableHeaderBg: '#FBF6F0',
    tableRowHover: '#F7F2EC',
    tableBorder: '#F1E9E0',
    
    // Form
    inputBg: '#ffffff',
    inputBorder: '#E6DDD3',
    inputBorderHover: '#8FC6C3',
    inputBorderFocus: '#7DB9B6',
  },
} as const;

// Export individual color groups for convenience
export const {
  primary,
  success,
  warning,
  error,
  info,
  neutral,
  text,
  background,
  border,
  functional,
  chart,
  status,
  semantic,
} = colors;

// Type for color palette
export type ColorPalette = typeof colors;
export type PrimaryColor = keyof typeof colors.primary;
export type SuccessColor = keyof typeof colors.success;
export type WarningColor = keyof typeof colors.warning;
export type ErrorColor = keyof typeof colors.error;
export type NeutralColor = keyof typeof colors.neutral;
export type ChartColor = keyof typeof colors.chart;

export default colors;
