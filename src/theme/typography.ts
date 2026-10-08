import type { TextStyle } from 'react-native';
import { colors } from './colors';
import { themed } from './themeMode';

/**
 * Two faces, the way casual game studios pair them: a chunky display face for titles, buttons and
 * big numbers (Lilita One, in the spirit of Supercell's lettering) and a rounded UI face for
 * everything else (Nunito, close to Duolingo's rounded type). Both are loaded in the root layout.
 */
export const fonts = {
  display: 'LilitaOne_400Regular',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

/**
 * Android picks a custom face by family name, not by fontWeight, so Text maps the weight a style
 * asks for onto the matching Nunito file. Big heavy text (headlines, counters) gets the display face.
 */
export function fontFamilyFor(weight: TextStyle['fontWeight'], size: number | undefined): string {
  const w = Number(weight === 'bold' ? 700 : weight === 'normal' || weight === undefined ? 400 : weight);
  if (w >= 900 && (size ?? 14) >= 20) return fonts.display;
  if (w >= 900) return fonts.black;
  if (w >= 800) return fonts.extraBold;
  if (w >= 700) return fonts.bold;
  return fonts.semiBold;
}

/**
 * Cap on the phone's font-size setting. Text still grows for players who need it, but a fixed,
 * non-scrolling game layout (board, win card) can't be pushed off screen at "Largest".
 */
export const MAX_FONT_SCALE = 1.25;

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

export const textStyles = themed(() => ({
  display: { fontSize: fontSizes.display, fontFamily: fonts.display, color: colors.ink, letterSpacing: -0.5 },
  title: { fontSize: fontSizes.xxl, fontFamily: fonts.display, color: colors.ink, letterSpacing: -0.2 },
  heading: { fontSize: fontSizes.xl, fontFamily: fonts.display, color: colors.ink },
  subheading: { fontSize: fontSizes.lg, fontFamily: fonts.display, color: colors.ink, letterSpacing: 0.2 },
  body: { fontSize: fontSizes.md, fontWeight: fontWeights.regular, color: colors.ink },
  label: { fontSize: fontSizes.sm, fontWeight: fontWeights.heavy, color: colors.ink, letterSpacing: 0.5 },
  caption: { fontSize: fontSizes.xs, fontWeight: fontWeights.bold, color: colors.inkMuted },
  number: { fontSize: fontSizes.lg, fontFamily: fonts.display, color: colors.ink, fontVariant: ['tabular-nums'] },
  button: { fontSize: fontSizes.lg, fontFamily: fonts.display, color: colors.ink, letterSpacing: 1 },
}) as const satisfies Record<string, TextStyle>);
