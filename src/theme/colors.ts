import type { ArrowColor } from '@/types/level';

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
} as const;

/** Semantic roles. Components use these, not raw palette values. */
export const colors = {
  background: palette.cream,
  surface: palette.white,
  ink: palette.black,
  inkMuted: '#4A4640',
  primary: palette.yellow,
  accent: palette.pink,
  info: palette.blue,
  success: palette.green,
  danger: palette.red,
  coin: palette.yellow,
  heart: palette.red,
  board: palette.paper,
  gridDot: palette.sand,
  disabled: palette.sand,
  disabledInk: palette.stone,
} as const;

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
