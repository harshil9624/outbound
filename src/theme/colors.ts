import type { ArrowColor } from '@/types/level';
import { getThemeMode, subscribeThemeMode } from './themeMode';

export const palette = {
  cream: '#FFF7E8',
  paper: '#FFFDF7',
  black: '#111111',
  white: '#FFFFFF',
  yellow: '#FFD83D',
  blue: '#35A7FF',
  pink: '#FF4FA3',
  green: '#48D36B',
  orange: '#FF8A34',
  purple: '#8B5CF6',
  red: '#FF4D4D',
  sand: '#E8DCC2',
  stone: '#B9AE98',
  gold: '#F2B705',
  lemon: '#FFEC8A',
} as const;

const lightColors = {
  background: palette.cream,
  surface: palette.white,
  /** Inner panels on a card: tracks, record tiles, the journey map paper. */
  paper: palette.cream,
  ink: palette.black,
  inkMuted: '#4A4640',
  /** Text and glyphs on a colour face (yellow, pink, blue...). Dark in both themes. */
  onColor: palette.black,
  onColorMuted: '#4A4640',
  /** Text on a block filled with ink. */
  inverseInk: palette.cream,
  /** Hard offset shadows. */
  shadow: palette.black,
  /** Outlines inside drawings (animals, hearts, icons, arrows): black in both themes. */
  artInk: palette.black,
  primary: palette.yellow,
  accent: palette.pink,
  info: palette.blue,
  success: palette.green,
  danger: palette.red,
  coin: palette.yellow,
  coinShade: palette.gold,
  heart: palette.red,
  /** Warm checkerboard play surface: the genre is all dark/neon, ArrowZing is paper and ink. */
  board: '#FBF1DC',
  boardAlt: '#F2E2C0',
  disabled: palette.sand,
  disabledInk: palette.stone,
  /** Unselected tab icons in the bottom bar: quiet, but clearly visible on the bar. */
  navIdle: palette.sand,
};

export type SemanticColors = { [K in keyof typeof lightColors]: string };

/**
 * Dark mode, "deep navy night": a deep blue desk with lighter blue cards, near-white ink and borders,
 * and shadows darker than the desk so the hard offset still shows. Colour faces keep their brightness
 * and dark text (onColor), so yellow, pink and green buttons pop against the blue.
 */
const darkColors: SemanticColors = {
  ...lightColors,
  background: '#121A2E',
  surface: '#1C2742',
  paper: '#243052',
  ink: '#F2F4FA',
  inkMuted: '#9AA6C4',
  inverseInk: '#121A2E',
  shadow: '#04070D',
  board: '#18213A',
  boardAlt: '#1F2A47',
  disabled: '#2E3A5C',
  disabledInk: '#7F8BA8',
  navIdle: '#8E9AB9',
};

/** Semantic roles. Components use these, not raw palette values. Updated in place on a theme switch. */
export const colors: SemanticColors = { ...(getThemeMode() === 'dark' ? darkColors : lightColors) };

subscribeThemeMode((mode) => Object.assign(colors, mode === 'dark' ? darkColors : lightColors));


export const arrowColors: Record<ArrowColor, string> = {
  yellow: palette.yellow,
  blue: palette.blue,
  pink: palette.pink,
  green: palette.green,
  orange: palette.orange,
  purple: palette.purple,
  red: palette.red,
};

export type SurfaceColor = 'surface' | 'primary' | 'accent' | 'info' | 'success' | 'danger' | 'background';
