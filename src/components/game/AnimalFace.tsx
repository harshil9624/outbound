import { memo, type ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { Point } from '@/types';
import { colors, palette } from '@/theme';
import { mixHex } from '@/utils/color';

export { ANIMALS, type Animal } from '@/constants/animals';
import type { FaceAnimal } from '@/constants/animals';
export type { FaceAnimal } from '@/constants/animals';

/** happy = idle, scared = hammer armed, ouch = just bumped into a blocker. */
export type FaceMood = 'happy' | 'scared' | 'ouch';

const INK = colors.artInk;
const PINK = '#FF9EC4';
/** Muzzles and face patches: warm cream, so the face reads on any arrow colour. */
const CREAM = '#FFF1D6';
const W = 0.09; // outline width in face units (face radius = 1)

const line = { stroke: INK, strokeWidth: W, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
const outline = { stroke: INK, strokeWidth: W, strokeLinejoin: 'round' } as const;

/** Manes, stripes and spots are a darker shade of the arrow's own colour, so colour still codes. */
const dark = (color: string) => mixHex(color, '#000000', 0.3);
const light = (color: string) => mixHex(color, '#FFFFFF', 0.55);

/** Direction pointer behind the face: the arrow's "nose" showing which way it will travel. */
function Pointer({ dir, color }: { dir: Point; color: string }) {
  const tip = { x: dir.x * 1.42, y: dir.y * 1.42 };
  const base = { x: dir.x * 0.72, y: dir.y * 0.72 };
  const half = { x: -dir.y * 0.46, y: dir.x * 0.46 };
  const d = `M${tip.x} ${tip.y} L${base.x + half.x} ${base.y + half.y} L${base.x - half.x} ${base.y - half.y} Z`;
  return <Path d={d} fill={color} stroke={INK} strokeWidth={W} strokeLinejoin="round" />;
}

/** Lion mane: 16 swirled tufts around the head, as one outlined shape. */
const MANE_D = (() => {
  const n = 16;
  const pt = (a: number, r: number) => `${(Math.cos(a) * r).toFixed(3)} ${(Math.sin(a) * r).toFixed(3)}`;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const step = (Math.PI * 2) / n;
    if (i === 0) d += `M${pt(a0, 1.08)}`;
    // Out to a slightly swept tip, then back in to the next notch.
    d += ` Q${pt(a0 + step * 0.2, 1.34)} ${pt(a0 + step * 0.62, 1.4)} Q${pt(a0 + step * 0.86, 1.22)} ${pt(a0 + step, 1.08)}`;
  }
  return d + ' Z';
})();

/** Mane colour: warm golden brown, tinted by the arrow colour so colour coding still holds. */
const mane = (color: string) => mixHex(color, '#8A4B14', 0.55);

/**
 * Everything behind the head circle: ears, mane, horns. Also drawn in ink as the drop shadow,
 * so `color` is INK on that pass.
 */
function Ears({ animal, color }: { animal: FaceAnimal; color: string }): ReactNode {
  switch (animal) {
    case 'cat':
      return (
        <G>
          <Path d="M-0.95 -0.3 L-0.78 -1.22 L-0.18 -0.86 Z" fill={color} {...outline} />
          <Path d="M0.95 -0.3 L0.78 -1.22 L0.18 -0.86 Z" fill={color} {...outline} />
          <Path d="M-0.78 -0.5 L-0.7 -0.98 L-0.38 -0.8 Z" fill={PINK} />
          <Path d="M0.78 -0.5 L0.7 -0.98 L0.38 -0.8 Z" fill={PINK} />
        </G>
      );
    case 'bear':
      return (
        <G>
          <Circle cx={-0.72} cy={-0.74} r={0.34} fill={color} {...outline} />
          <Circle cx={0.72} cy={-0.74} r={0.34} fill={color} {...outline} />
          <Circle cx={-0.72} cy={-0.74} r={0.16} fill={PINK} />
          <Circle cx={0.72} cy={-0.74} r={0.16} fill={PINK} />
        </G>
      );
    case 'bunny':
      return (
        <G>
          <Ellipse cx={-0.38} cy={-0.98} rx={0.21} ry={0.46} fill={color} {...outline} />
          <Ellipse cx={0.38} cy={-0.98} rx={0.21} ry={0.46} fill={color} {...outline} />
          <Ellipse cx={-0.38} cy={-0.96} rx={0.09} ry={0.3} fill={PINK} />
          <Ellipse cx={0.38} cy={-0.96} rx={0.09} ry={0.3} fill={PINK} />
        </G>
      );
    case 'frog':
      return (
        <G>
          <Circle cx={-0.48} cy={-0.72} r={0.4} fill={color} {...outline} />
          <Circle cx={0.48} cy={-0.72} r={0.4} fill={color} {...outline} />
        </G>
      );
    case 'pig':
      return (
        <G>
          <Path d="M-0.92 -0.42 Q-0.98 -1.08 -0.36 -0.86 Z" fill={color} {...outline} />
          <Path d="M0.92 -0.42 Q0.98 -1.08 0.36 -0.86 Z" fill={color} {...outline} />
        </G>
      );
    case 'panda':
      return (
        <G>
          <Circle cx={-0.72} cy={-0.74} r={0.32} fill={INK} />
          <Circle cx={0.72} cy={-0.74} r={0.32} fill={INK} />
        </G>
      );
    case 'lion':
      // Shaggy mane with a darker inner band for depth, and round ears sitting on it.
      return (
        <G>
          <Path d={MANE_D} fill={mane(color)} {...outline} />
          <Circle cx={0} cy={0} r={1.12} fill={dark(mane(color))} />
          <Circle cx={-0.66} cy={-0.78} r={0.22} fill={color} {...outline} />
          <Circle cx={0.66} cy={-0.78} r={0.22} fill={color} {...outline} />
          <Circle cx={-0.66} cy={-0.78} r={0.1} fill={CREAM} />
          <Circle cx={0.66} cy={-0.78} r={0.1} fill={CREAM} />
        </G>
      );
    case 'tiger':
      return (
        <G>
          <Path d="M-0.98 -0.36 Q-1.02 -1.12 -0.32 -0.9 Z" fill={color} {...outline} />
          <Path d="M0.98 -0.36 Q1.02 -1.12 0.32 -0.9 Z" fill={color} {...outline} />
          <Path d="M-0.82 -0.52 Q-0.84 -0.92 -0.48 -0.84 Z" fill={CREAM} />
          <Path d="M0.82 -0.52 Q0.84 -0.92 0.48 -0.84 Z" fill={CREAM} />
        </G>
      );
    case 'elephant':
      // Big fan ears tilted out to the sides, lined with a lighter shade. Sized to stay inside the
  // ±1.5 face box with the drop shadow (wider ears get clipped at the box edge).
      return (
        <G>
          <Ellipse cx={-0.8} cy={-0.08} rx={0.48} ry={0.8} fill={color} {...outline} transform="rotate(-16 -0.8 -0.08)" />
          <Ellipse cx={0.8} cy={-0.08} rx={0.48} ry={0.8} fill={color} {...outline} transform="rotate(16 0.8 -0.08)" />
          <Ellipse cx={-0.9} cy={-0.05} rx={0.27} ry={0.54} fill={light(color)} transform="rotate(-16 -0.9 -0.05)" />
          <Ellipse cx={0.9} cy={-0.05} rx={0.27} ry={0.54} fill={light(color)} transform="rotate(16 0.9 -0.05)" />
        </G>
      );
    case 'monkey':
      return (
        <G>
          <Circle cx={-1.0} cy={-0.06} r={0.34} fill={color} {...outline} />
          <Circle cx={1.0} cy={-0.06} r={0.34} fill={color} {...outline} />
          <Circle cx={-1.0} cy={-0.06} r={0.19} fill={CREAM} />
          <Circle cx={1.0} cy={-0.06} r={0.19} fill={CREAM} />
        </G>
      );
    case 'giraffe':
      // Two knobbly horns (ossicones) and small sideways ears.
      return (
        <G>
          <Rect x={-0.5} y={-1.32} width={0.16} height={0.5} rx={0.06} fill={color} {...outline} />
          <Rect x={0.34} y={-1.32} width={0.16} height={0.5} rx={0.06} fill={color} {...outline} />
          <Circle cx={-0.42} cy={-1.32} r={0.15} fill={dark(color)} {...outline} />
          <Circle cx={0.42} cy={-1.32} r={0.15} fill={dark(color)} {...outline} />
          <Ellipse cx={-0.9} cy={-0.56} rx={0.32} ry={0.15} fill={color} {...outline} transform="rotate(-25 -0.9 -0.56)" />
          <Ellipse cx={0.9} cy={-0.56} rx={0.32} ry={0.15} fill={color} {...outline} transform="rotate(25 0.9 -0.56)" />
        </G>
      );
    case 'zebra':
      // Tall ears with a spiky ink mane between them.
      return (
        <G>
          <Ellipse cx={-0.52} cy={-1.0} rx={0.17} ry={0.38} fill={color} {...outline} transform="rotate(-14 -0.52 -1)" />
          <Ellipse cx={0.52} cy={-1.0} rx={0.17} ry={0.38} fill={color} {...outline} transform="rotate(14 0.52 -1)" />
          <Path d="M-0.3 -0.9 L-0.2 -1.24 L-0.08 -0.96 L0.02 -1.3 L0.12 -0.96 L0.24 -1.22 L0.32 -0.9 Z" fill={INK} />
        </G>
      );
    case 'hippo':
      return (
        <G>
          <Circle cx={-0.56} cy={-0.86} r={0.17} fill={color} {...outline} />
          <Circle cx={0.56} cy={-0.86} r={0.17} fill={color} {...outline} />
          <Circle cx={-0.56} cy={-0.86} r={0.08} fill={PINK} />
          <Circle cx={0.56} cy={-0.86} r={0.08} fill={PINK} />
        </G>
      );
    case 'fox':
      // Tall pointed ears with dark tips.
      return (
        <G>
          <Path d="M-0.98 -0.22 L-0.72 -1.34 L-0.18 -0.86 Z" fill={color} {...outline} />
          <Path d="M0.98 -0.22 L0.72 -1.34 L0.18 -0.86 Z" fill={color} {...outline} />
          <Path d="M-0.8 -0.98 L-0.72 -1.34 L-0.56 -1.2 Z" fill={INK} />
          <Path d="M0.8 -0.98 L0.72 -1.34 L0.56 -1.2 Z" fill={INK} />
        </G>
      );
  }
}

/** Markings on the face itself, under the eyes: patches, stripes, spots, muzzles, trunks. */
function Markings({ animal, color }: { animal: FaceAnimal; color: string }): ReactNode {
  switch (animal) {
    case 'panda':
      return (
        <G>
          <Ellipse cx={-0.38} cy={-0.06} rx={0.3} ry={0.25} fill={INK} transform="rotate(-20 -0.38 -0.06)" />
          <Ellipse cx={0.38} cy={-0.06} rx={0.3} ry={0.25} fill={INK} transform="rotate(20 0.38 -0.06)" />
        </G>
      );
    case 'lion':
      // What separates a lion from a cat: mane falling over the brow and wrapping under the chin,
      // a long broad nose bridge, and a wide muzzle instead of small whisker pads.
      return (
        <G>
          <Path d="M-0.18 -0.36 Q0 -0.42 0.18 -0.36 L0.26 0.2 L-0.26 0.2 Z" fill={light(color)} />
          <Ellipse cx={0} cy={0.38} rx={0.46} ry={0.3} fill={CREAM} />
          <Path
            d="M-0.62 -0.8 Q-0.5 -0.44 -0.3 -0.6 Q-0.16 -0.36 0 -0.56 Q0.16 -0.36 0.3 -0.6 Q0.5 -0.44 0.62 -0.8 Q0.3 -1.08 0 -1.02 Q-0.3 -1.08 -0.62 -0.8 Z"
            fill={mane(color)}
            {...outline}
          />
          <Path d="M-0.46 0.84 Q-0.26 1.14 -0.1 0.98 Q0 1.18 0.1 0.98 Q0.26 1.14 0.46 0.84 Q0.2 0.94 0 0.92 Q-0.2 0.94 -0.46 0.84 Z" fill={mane(color)} {...outline} />
        </G>
      );
    case 'tiger':
      return (
        <G>
          <Path d="M0 -0.98 L0 -0.7 M-0.28 -0.93 L-0.2 -0.7 M0.28 -0.93 L0.2 -0.7" stroke={INK} strokeWidth={0.1} strokeLinecap="round" />
          <Path d="M-0.99 -0.06 L-0.72 0.02 M-0.95 0.24 L-0.72 0.2 M0.99 -0.06 L0.72 0.02 M0.95 0.24 L0.72 0.2" stroke={INK} strokeWidth={0.09} strokeLinecap="round" />
          <Ellipse cx={0} cy={0.34} rx={0.38} ry={0.26} fill={CREAM} />
        </G>
      );
    case 'monkey':
      // Heart-shaped face patch: the eyes sit in it.
      return (
        <G>
          <Circle cx={-0.3} cy={-0.1} r={0.36} fill={CREAM} />
          <Circle cx={0.3} cy={-0.1} r={0.36} fill={CREAM} />
          <Ellipse cx={0} cy={0.3} rx={0.56} ry={0.42} fill={CREAM} />
          <Path d="M-0.12 -0.98 Q0.02 -1.22 0.14 -0.96" {...line} />
        </G>
      );
    case 'giraffe':
      return (
        <G>
          <Circle cx={-0.56} cy={-0.56} r={0.13} fill={dark(color)} />
          <Circle cx={0.62} cy={-0.42} r={0.11} fill={dark(color)} />
          <Circle cx={-0.78} cy={0.14} r={0.09} fill={dark(color)} />
          <Circle cx={0.74} cy={0.2} r={0.1} fill={dark(color)} />
          <Ellipse cx={0} cy={0.4} rx={0.44} ry={0.27} fill={light(color)} stroke={INK} strokeWidth={W * 0.7} />
        </G>
      );
    case 'zebra':
      return (
        <G>
          <Path d="M0 -0.99 L0 -0.74 M-0.34 -0.93 Q-0.26 -0.78 -0.32 -0.62 M0.34 -0.93 Q0.26 -0.78 0.32 -0.62 M-0.98 -0.22 L-0.66 -0.12 M-0.99 0.04 L-0.68 0.08 M-0.94 0.3 L-0.66 0.28 M0.98 -0.22 L0.66 -0.12 M0.99 0.04 L0.68 0.08 M0.94 0.3 L0.66 0.28" stroke={INK} strokeWidth={0.09} strokeLinecap="round" fill="none" />
          <Ellipse cx={0} cy={0.42} rx={0.44} ry={0.28} fill={dark(color)} stroke={INK} strokeWidth={W * 0.7} />
        </G>
      );
    case 'hippo':
      return <Ellipse cx={0} cy={0.36} rx={0.64} ry={0.4} fill={light(color)} stroke={INK} strokeWidth={W * 0.8} />;
    case 'fox':
      // White cheeks sweeping down to the chin.
      return <Path d="M-0.96 0.0 Q-0.56 0.0 -0.22 0.28 L0 0.36 L0.22 0.28 Q0.56 0.0 0.96 0.0 Q0.9 0.64 0 0.98 Q-0.9 0.64 -0.96 0.0 Z" fill={CREAM} />;
    default:
      return null;
  }
}

/** Drawn over everything else (after the mouth): only the elephant's trunk needs this. */
function Overlay({ animal, color }: { animal: FaceAnimal; color: string }): ReactNode {
  if (animal !== 'elephant') return null;
  return (
    <G>
      <Path d="M-0.26 0.4 Q-0.48 0.5 -0.46 0.7 Q-0.34 0.6 -0.2 0.58 Z" fill={CREAM} {...outline} strokeWidth={W * 0.7} />
      <Path d="M0.26 0.4 Q0.48 0.5 0.46 0.7 Q0.34 0.6 0.2 0.58 Z" fill={CREAM} {...outline} strokeWidth={W * 0.7} />
      <Path
        d="M-0.22 0.0 C-0.26 0.5 -0.2 0.86 0.0 1.04 C0.16 1.18 0.44 1.12 0.48 0.9 C0.5 0.8 0.4 0.76 0.33 0.83 C0.27 0.9 0.15 0.88 0.13 0.72 C0.11 0.5 0.18 0.24 0.22 0.0 Z"
        fill={color}
        {...outline}
      />
      <Path d="M-0.19 0.36 Q-0.02 0.43 0.17 0.34 M-0.16 0.58 Q-0.02 0.64 0.14 0.56" {...line} strokeWidth={W * 0.6} />
    </G>
  );
}

function Eye({ x, y, look, mood }: { x: number; y: number; look: Point; mood: FaceMood }) {
  if (mood === 'ouch') {
    // Squeezed shut: > <
    const s = x < 0 ? 1 : -1;
    return <Path d={`M${x - 0.14 * s} ${y - 0.13} L${x + 0.12 * s} ${y} L${x - 0.14 * s} ${y + 0.13}`} {...line} strokeWidth={W * 1.3} />;
  }
  const scared = mood === 'scared';
  const pupil = scared ? 0.08 : 0.13;
  const off = scared ? 0.05 : 0.09;
  return (
    <G>
      <Circle cx={x} cy={y} r={scared ? 0.28 : 0.24} fill={palette.white} stroke={INK} strokeWidth={W * 0.8} />
      <Circle cx={x + look.x * off} cy={y + look.y * off} r={pupil} fill={INK} />
      {scared ? null : <Circle cx={x + look.x * off + 0.045} cy={y + look.y * off - 0.05} r={0.045} fill={palette.white} />}
    </G>
  );
}

function Mouth({ animal, mood }: { animal: FaceAnimal; mood: FaceMood }): ReactNode {
  // The elephant's trunk covers the middle: its mood mouths sit off to one side.
  const moodShift = animal === 'elephant' ? 'translate(-0.5 0.06) scale(0.6)' : undefined;
  if (mood === 'scared') return <Ellipse cx={0} cy={0.44} rx={0.12} ry={0.16} fill={INK} transform={moodShift} />;
  if (mood === 'ouch') return <Path d="M-0.24 0.44 L-0.12 0.36 L0 0.44 L0.12 0.36 L0.24 0.44" {...line} transform={moodShift} />;
  switch (animal) {
    case 'cat':
      return (
        <G>
          <Path d="M-0.08 0.16 L0.08 0.16 L0 0.26 Z" fill={PINK} stroke={INK} strokeWidth={W * 0.6} />
          <Path d="M-0.2 0.32 Q-0.1 0.44 0 0.3 Q0.1 0.44 0.2 0.32" {...line} />
          <Path d="M-0.42 0.24 L-0.86 0.16 M-0.42 0.34 L-0.84 0.4 M0.42 0.24 L0.86 0.16 M0.42 0.34 L0.84 0.4" {...line} strokeWidth={W * 0.6} />
        </G>
      );
    case 'bear':
      return (
        <G>
          <Ellipse cx={0} cy={0.36} rx={0.38} ry={0.27} fill={palette.white} opacity={0.85} />
          <Ellipse cx={0} cy={0.26} rx={0.13} ry={0.09} fill={INK} />
          <Path d="M-0.14 0.42 Q0 0.54 0.14 0.42" {...line} />
        </G>
      );
    case 'bunny':
      return (
        <G>
          <Circle cx={0} cy={0.2} r={0.08} fill={PINK} stroke={INK} strokeWidth={W * 0.6} />
          <Path d="M-0.16 0.3 Q0 0.4 0.16 0.3" {...line} />
          <Rect x={-0.09} y={0.34} width={0.18} height={0.15} rx={0.03} fill={palette.white} stroke={INK} strokeWidth={W * 0.6} />
        </G>
      );
    case 'frog':
      return <Path d="M-0.5 0.22 Q0 0.62 0.5 0.22" {...line} strokeWidth={W * 1.2} />;
    case 'pig':
      return (
        <G>
          <Ellipse cx={0} cy={0.32} rx={0.32} ry={0.22} fill={PINK} stroke={INK} strokeWidth={W * 0.8} />
          <Ellipse cx={-0.1} cy={0.32} rx={0.05} ry={0.08} fill={INK} />
          <Ellipse cx={0.1} cy={0.32} rx={0.05} ry={0.08} fill={INK} />
        </G>
      );
    case 'panda':
      return (
        <G>
          <Ellipse cx={0} cy={0.24} rx={0.12} ry={0.08} fill={INK} />
          <Path d="M-0.16 0.38 Q0 0.5 0.16 0.38" {...line} />
        </G>
      );
    case 'lion':
      return (
        <G>
          <Path d="M-0.24 0.12 Q0 0.04 0.24 0.12 Q0.18 0.3 0 0.34 Q-0.18 0.3 -0.24 0.12 Z" fill={INK} />
          <Path d="M0 0.34 L0 0.44 M-0.22 0.52 Q-0.11 0.62 0 0.46 Q0.11 0.62 0.22 0.52" {...line} strokeWidth={W * 0.9} />
        </G>
      );
    case 'tiger':
      return (
        <G>
          <Path d="M-0.13 0.16 L0.13 0.16 L0 0.3 Z" fill={INK} />
          <Path d="M0 0.3 L0 0.38 M-0.2 0.38 Q-0.1 0.5 0 0.38 Q0.1 0.5 0.2 0.38" {...line} />
        </G>
      );
    case 'elephant':
      return null;
    case 'monkey':
      return (
        <G>
          <Ellipse cx={-0.07} cy={0.22} rx={0.04} ry={0.06} fill={INK} />
          <Ellipse cx={0.07} cy={0.22} rx={0.04} ry={0.06} fill={INK} />
          <Path d="M-0.3 0.38 Q0 0.62 0.3 0.38" {...line} />
        </G>
      );
    case 'giraffe':
      return (
        <G>
          <Ellipse cx={-0.13} cy={0.34} rx={0.05} ry={0.07} fill={INK} />
          <Ellipse cx={0.13} cy={0.34} rx={0.05} ry={0.07} fill={INK} />
          <Path d="M-0.16 0.5 Q0 0.6 0.16 0.5" {...line} />
        </G>
      );
    case 'zebra':
      return (
        <G>
          <Ellipse cx={-0.15} cy={0.36} rx={0.06} ry={0.08} fill={palette.white} />
          <Ellipse cx={0.15} cy={0.36} rx={0.06} ry={0.08} fill={palette.white} />
          <Path d="M-0.16 0.54 Q0 0.62 0.16 0.54" stroke={palette.white} strokeWidth={W} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'hippo':
      return (
        <G>
          <Ellipse cx={-0.22} cy={0.22} rx={0.07} ry={0.1} fill={INK} />
          <Ellipse cx={0.22} cy={0.22} rx={0.07} ry={0.1} fill={INK} />
          <Path d="M-0.34 0.52 Q0 0.68 0.34 0.52" {...line} />
        </G>
      );
    case 'fox':
      return (
        <G>
          <Ellipse cx={0} cy={0.4} rx={0.12} ry={0.08} fill={INK} />
          <Path d="M0 0.48 L0 0.56 M-0.14 0.6 Q-0.07 0.68 0 0.56 Q0.07 0.68 0.14 0.6" {...line} strokeWidth={W * 0.8} />
        </G>
      );
  }
}

/** Where the eyes sit: most faces share one spot; a few need room for snouts and patches. */
function eyePlacement(animal: FaceAnimal): { x: number; y: number } {
  switch (animal) {
    case 'frog':
      return { x: 0.48, y: -0.72 };
    case 'hippo':
      return { x: 0.36, y: -0.36 };
    case 'giraffe':
    case 'zebra':
      return { x: 0.36, y: -0.2 };
    case 'monkey':
      return { x: 0.3, y: -0.14 };
    default:
      return { x: 0.38, y: -0.1 };
  }
}

interface AnimalFaceProps {
  animal: FaceAnimal;
  color: string;
  /** Unit direction of travel: the pointer aims there and the eyes look there. */
  dir: Point;
  mood: FaceMood;
  size: number;
}

/** A round animal face in the arrow's color. Face radius = size / 3, so it fits inside one cell. */
export const AnimalFace = memo(function AnimalFace({ animal, color, dir, mood, size }: AnimalFaceProps) {
  const eye = eyePlacement(animal);
  return (
    <Svg width={size} height={size} viewBox="-1.5 -1.5 3 3">
      {/* Solid ink drop shadow of the head silhouette, matching the bodies. */}
      <G transform="translate(0.1 0.12)">
        <Ears animal={animal} color={INK} />
        <Pointer dir={dir} color={INK} />
        <Circle cx={0} cy={0} r={1} fill={INK} />
      </G>
      <Ears animal={animal} color={color} />
      {/* Over the ears so an upward pointer stays visible between them. */}
      <Pointer dir={dir} color={color} />
      <Circle cx={0} cy={0} r={1} fill={color} stroke={INK} strokeWidth={W} />
      <Ellipse cx={-0.45} cy={-0.52} rx={0.28} ry={0.13} fill={palette.white} opacity={0.5} transform="rotate(-32 -0.45 -0.52)" />
      <Markings animal={animal} color={color} />
      <Eye x={-eye.x} y={eye.y} look={dir} mood={mood} />
      <Eye x={eye.x} y={eye.y} look={dir} mood={mood} />
      {mood === 'happy' ? (
        <G>
          <Ellipse cx={-0.62} cy={0.24} rx={0.16} ry={0.09} fill={PINK} opacity={0.85} />
          <Ellipse cx={0.62} cy={0.24} rx={0.16} ry={0.09} fill={PINK} opacity={0.85} />
        </G>
      ) : null}
      {mood === 'scared' ? (
        <Path d="M0 0 Q-0.13 0.2 0 0.29 Q0.13 0.2 0 0 Z" transform="translate(0.74 -0.62)" fill={palette.blue} stroke={INK} strokeWidth={W * 0.6} />
      ) : null}
      <Mouth animal={animal} mood={mood} />
      <Overlay animal={animal} color={color} />
    </Svg>
  );
}, sameFace);

/**
 * Callers pass `dir` as a fresh object literal ({ x: 1, y: 0 }) on every render; comparing it by
 * value keeps the memo working, so a parent re-render doesn't redraw an unchanged face's SVG.
 */
function sameFace(a: AnimalFaceProps, b: AnimalFaceProps): boolean {
  return (
    a.animal === b.animal &&
    a.color === b.color &&
    a.mood === b.mood &&
    a.size === b.size &&
    a.dir.x === b.dir.x &&
    a.dir.y === b.dir.y
  );
}
