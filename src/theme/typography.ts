import type { TextStyle } from 'react-native';
import { colors } from './colors';

/** System font at heavy weights: zero font-loading cost, reads chunky on Android. */
export const fontWeights = {
  regular: '500',
  bold: '700',
  heavy: '900',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 36,
  display: 54,
} as const;

export const textStyles = {
  display: { fontSize: fontSizes.display, fontWeight: fontWeights.heavy, color: colors.ink, letterSpacing: -1.5 },
  title: { fontSize: fontSizes.xxl, fontWeight: fontWeights.heavy, color: colors.ink, letterSpacing: -0.8 },
  heading: { fontSize: fontSizes.xl, fontWeight: fontWeights.heavy, color: colors.ink },
  subheading: { fontSize: fontSizes.lg, fontWeight: fontWeights.heavy, color: colors.ink },
  body: { fontSize: fontSizes.md, fontWeight: fontWeights.regular, color: colors.ink },
  label: { fontSize: fontSizes.sm, fontWeight: fontWeights.heavy, color: colors.ink, letterSpacing: 0.5 },
  caption: { fontSize: fontSizes.xs, fontWeight: fontWeights.bold, color: colors.inkMuted },
  number: { fontSize: fontSizes.lg, fontWeight: fontWeights.heavy, color: colors.ink, fontVariant: ['tabular-nums'] },
  button: { fontSize: fontSizes.lg, fontWeight: fontWeights.heavy, color: colors.ink, letterSpacing: 1 },
} as const satisfies Record<string, TextStyle>;
