// Design tokens shared between the web app (Tailwind preset) and the React Native TV app
// (consumed directly in StyleSheet). Keep this file free of any framework imports.

export const colors = {
  // Cinematic dark theme inspired by streaming platforms
  background: {
    base: '#0A0A0B',
    surface: '#141416',
    elevated: '#1C1C1F',
    overlay: 'rgba(10, 10, 11, 0.75)',
  },
  foreground: {
    primary: '#F5F5F4',
    secondary: '#A8A8A6',
    muted: '#737370',
    inverted: '#0A0A0B',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    strong: 'rgba(255, 255, 255, 0.16)',
  },
  accent: {
    // Warm gold — premium editorial feel
    DEFAULT: '#E8B14F',
    hover: '#F1C36A',
    active: '#D49C36',
    foreground: '#0A0A0B',
  },
  danger: '#E5484D',
  success: '#46A758',
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const spacing = {
  px: 1,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    serif: ['"Playfair Display"', 'Georgia', 'serif'],
    mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
    '8xl': 96,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.65,
  },
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  tv: 1920,
} as const;

export const tokens = { colors, radius, spacing, typography, breakpoints } as const;
export type Tokens = typeof tokens;
