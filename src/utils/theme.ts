import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  primary: '#111111',
  onPrimary: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F6F4F0',
  card: '#F6F4F0',
  text: '#111111',
  textSecondary: '#6E6A63',
  border: '#E6E2DB',
  accent: '#8C6B3F',
  error: '#B3382C',
  success: '#2F7D4F',
  warning: '#B7791F',
  info: '#2F5D8C',
  overlay: 'rgba(17,17,17,0.45)',
  disabled: '#C9C5BD',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const borderRadius = { sm: 4, md: 8, lg: 12, xl: 16, round: 9999 };

const family = Platform.select({ ios: 'System', default: undefined });

export const typography = {
  display: { fontFamily: family, fontSize: 30, fontWeight: '300', letterSpacing: 4 },
  h1: { fontFamily: family, fontSize: 26, fontWeight: '600', letterSpacing: 0.2 },
  h2: { fontFamily: family, fontSize: 20, fontWeight: '600' },
  h3: { fontFamily: family, fontSize: 16, fontWeight: '600' },
  body: { fontFamily: family, fontSize: 15, fontWeight: '400', lineHeight: 22 },
  caption: { fontFamily: family, fontSize: 13, fontWeight: '400' },
  label: { fontFamily: family, fontSize: 11, fontWeight: '600', letterSpacing: 1.4 },
} satisfies Record<string, TextStyle>;

export const elevation: Record<'sm' | 'md', ViewStyle> = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
};

export const MIN_TOUCH = 44;
// Text links are ~16dp tall: this slop lifts them to the 44pt target without changing layout.
export const LINK_SLOP = { top: 14, bottom: 14, left: 10, right: 10 };
// Cap for display text (logo, headings over images, tabs) so the largest Dynamic Type sizes do not clip it; body text scales freely.
export const FONT_CAP = 1.4;
