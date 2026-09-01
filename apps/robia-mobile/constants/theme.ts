/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Brand = {
  navy: '#1F3A5F', navyLight: '#2D5282', navyDark: '#172D47',
  teal: '#14B8A6', tealLight: '#CCFBF1', tealDark: '#0F766E',
  orange: '#F97316', orangeLight: '#FED7AA', orangeDark: '#EA580C',
  electric: '#1D4ED8', electricLight: '#DBEAFE', electricDark: '#1E40AF',
  white: '#FFFFFF', slate50: '#F8FAFC', slate100: '#F1F5F9',
  slate200: '#E2E8F0', slate400: '#94A3B8', slate500: '#64748B', slate800: '#1E293B',
} as const;

export const Colors = {
  light: {
    text: Brand.slate800, textSecondary: Brand.slate500,
    background: Brand.slate50, surface: Brand.white, surfaceSubtle: Brand.slate100,
    border: Brand.slate200, primary: Brand.navy, tint: Brand.teal,
    intelligence: Brand.teal, opportunity: Brand.orange,
    icon: Brand.slate500, tabIconDefault: Brand.slate400, tabIconSelected: Brand.teal,
  },
  dark: {
    text: Brand.slate100, textSecondary: Brand.slate400,
    background: '#0F172A', surface: Brand.navyDark, surfaceSubtle: Brand.navy,
    border: Brand.navyLight, primary: Brand.slate100, tint: '#2DD4BF',
    intelligence: '#2DD4BF', opportunity: '#FB923C',
    icon: Brand.slate400, tabIconDefault: Brand.slate400, tabIconSelected: '#2DD4BF',
  },
} as const;

export const Radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
