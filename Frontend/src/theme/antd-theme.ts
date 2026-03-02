/**
 * Ant Design Theme Configuration
 * Central theme tokens for the entire application
 */

import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    // Primary Colors
    colorPrimary: '#7DB9B6',
    colorSuccess: '#9CCB9A',
    colorWarning: '#E6C79C',
    colorError: '#E08F8F',
    colorInfo: '#A7B6D9',
    
    // Text Colors
    colorTextBase: '#3F3A34',
    colorTextSecondary: '#7A6F66',
    colorTextTertiary: '#A79D94',
    colorTextQuaternary: '#C9BFB6',
    
    // Background Colors
    colorBgBase: '#FBF8F4',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorBgLayout: '#F7F2EC',
    colorBgSpotlight: '#EFE5DA',
    
    // Border
    colorBorder: '#E6DDD3',
    colorBorderSecondary: '#F1E9E0',
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 6,
    
    // Typography
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    lineHeight: 1.5715,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    
    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingMD: 16,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,
    margin: 16,
    marginLG: 24,
    marginMD: 16,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,
    
    // Control
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
    
    // Shadow
    boxShadow: '0 8px 24px rgba(125, 185, 182, 0.18)',
    boxShadowSecondary: '0 12px 32px rgba(0, 0, 0, 0.12)',
    
    // Z-Index
    zIndexBase: 0,
    zIndexPopupBase: 1000,
  },
  
  components: {
    Layout: {
      siderBg: '#2F2A25',
      triggerBg: '#3A342E',
      triggerColor: '#EDE3D6',
      headerBg: '#FFFFFF',
      headerHeight: 64,
      headerPadding: '0 24px',
      footerBg: '#F7F2EC',
      bodyBg: '#F7F2EC',
    },
    
    Menu: {
      darkItemBg: '#2F2A25',
      darkItemSelectedBg: '#7DB9B6',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.10)',
      itemMarginInline: 4,
      itemBorderRadius: 10,
    },
    
    Button: {
      primaryShadow: '0 8px 18px rgba(125, 185, 182, 0.28)',
      defaultShadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
      dangerShadow: '0 6px 16px rgba(224, 143, 143, 0.25)',
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      paddingContentHorizontal: 15,
    },
    
    Card: {
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
      borderRadius: 14,
      headerHeight: 56,
    },
    
    Table: {
      headerBg: '#fafafa',
      headerColor: '#262626',
      borderColor: '#f0f0f0',
      rowHoverBg: '#fafafa',
      headerSortActiveBg: '#f0f0f0',
      headerFilterHoverBg: '#f0f0f0',
    },
    
    Statistic: {
      titleFontSize: 14,
      contentFontSize: 24,
    },
    
    Typography: {
      titleMarginTop: 0,
      titleMarginBottom: '0.5em',
    },
    
    Input: {
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      paddingBlock: 4,
      paddingInline: 11,
    },
    
    Select: {
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
    },
    
    Drawer: {
      zIndexPopup: 1000,
    },
    
    Modal: {
    },
    
    Notification: {
      zIndexPopup: 1010,
    },
    
    Message: {
      zIndexPopup: 1010,
    },
  },
};

export default antdTheme;
