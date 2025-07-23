import type { GlobalThemeOverrides } from 'naive-ui'

// Naive UI 主题定制配置
export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#00B25A',
    primaryColorHover: '#009949',
    primaryColorPressed: '#007a3a',
    primaryColorSuppl: '#00D666',
    successColor: '#00B25A',
    successColorHover: '#009949',
    successColorPressed: '#007a3a',
    successColorSuppl: '#00D666'
  },
  Button: {
    colorPrimary: '#00B25A',
    colorHoverPrimary: '#009949',
    colorPressedPrimary: '#007a3a',
    borderPrimary: '#00B25A',
    borderHoverPrimary: '#009949',
    borderPressedPrimary: '#007a3a'
  },
  Tag: {
    colorPrimary: '#00B25A'
  },
  Card: {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  },
  Menu: {
    itemColorActive: 'rgba(0, 178, 90, 0.1)',
    itemTextColorActive: '#00B25A',
    itemTextColorActiveHover: '#00B25A',
    arrowColorActive: '#00B25A'
  }
} 