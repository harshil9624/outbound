import { memo, type ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { Point } from '@/types';
import { colors, palette } from '@/theme';

export { ANIMALS, type Animal } from '@/constants/animals';
import type { Animal } from '@/constants/animals';

/** happy = idle, scared = hammer armed, ouch = just bumped into a blocker. */
export type FaceMood = 'happy' | 'scared' | 'ouch';

const INK = colors.ink;
const PINK = '#FF9EC4';
const W = 0.09; // outline width in face units (face radius = 1)

const line = { stroke: INK, strokeWidth: W, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;

/** Direction pointer behind the face: the arrow's "nose" showing which way it will travel. */
function Pointer({ dir, color }: { dir: Point; color: string }) {
  const tip = { x: dir.x * 1.42, y: dir.y * 1.42 };
  const base = { x: dir.x * 0.72, y: dir.y * 0.72 };
  const half = { x: -dir.y * 0.46, y: dir.x * 0.46 };
  const d = `M${tip.x} ${tip.y} L${base.x + half.x} ${base.y + half.y} L${base.x - half.x} ${base.y - half.y} Z`;
  return <Path d={d} fill={color} stroke={INK} strokeWidth={W} strokeLinejoin="round" />;
}

function Ears({ animal, color }: { animal: Animal; color: string }): ReactNode {
  const outline = { stroke: INK, strokeWidth: W, strokeLinejoin: 'round' } as const;
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
  }
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

function Mouth({ animal, mood }: { animal: Animal; mood: FaceMood }): ReactNode {
  if (mood === 'scared') return <Ellipse cx={0} cy={0.44} rx={0.12} ry={0.16} fill={INK} />;
  if (mood === 'ouch') return <Path d="M-0.24 0.44 L-0.12 0.36 L0 0.44 L0.12 0.36 L0.24 0.44" {...line} />;
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
  }
}

interface AnimalFaceProps {
  animal: Animal;
  color: string;
  /** Unit direction of travel: the pointer aims there and the eyes look there. */
  dir: Point;
  mood: FaceMood;
  size: number;
}

/** A round animal face in the arrow's color. Face radius = size / 3, so it fits inside one cell. */
export const AnimalFace = memo(function AnimalFace({ animal, color, dir, mood, size }: AnimalFaceProps) {
  const eyeY = animal === 'frog' ? -0.72 : -0.1;
  const eyeX = animal === 'frog' ? 0.48 : 0.38;
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
      {animal === 'panda' ? (
        <G>
          <Ellipse cx={-0.38} cy={-0.06} rx={0.3} ry={0.25} fill={INK} transform="rotate(-20 -0.38 -0.06)" />
          <Ellipse cx={0.38} cy={-0.06} rx={0.3} ry={0.25} fill={INK} transform="rotate(20 0.38 -0.06)" />
        </G>
      ) : null}
      <Eye x={-eyeX} y={eyeY} look={dir} mood={mood} />
      <Eye x={eyeX} y={eyeY} look={dir} mood={mood} />
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
    </Svg>
  );
});
