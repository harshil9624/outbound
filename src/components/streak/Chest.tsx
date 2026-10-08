import { memo } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors, palette } from '@/theme';

export type ChestState = 'locked' | 'ready' | 'open';

const INK = colors.artInk;
const STROKE = 3;

const WOOD: Record<ChestState, { body: string; dark: string; band: string }> = {
  locked: { body: '#C9B79C', dark: '#A8977C', band: '#D8CDB8' },
  ready: { body: '#C8742F', dark: '#9C5420', band: palette.gold },
  open: { body: '#C8742F', dark: '#9C5420', band: palette.gold },
};

/** A treasure chest: dusty and padlocked until reached, gold-banded when ready, open with coins once collected. */
export const Chest = memo(function Chest({ state, size }: { state: ChestState; size: number }) {
  const wood = WOOD[state];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Ink offset shadow of the whole chest. */}
      <G transform="translate(4 4)">
        <Rect x={10} y={44} width={80} height={46} rx={6} fill={INK} />
        {state === 'open' ? null : <Path d={LID_CLOSED} fill={INK} />}
      </G>

      {state === 'open' ? (
        <G>
          {/* Lid flipped back, inside showing. */}
          <Path d="M14 44 L22 14 Q50 4 78 14 L86 44 Z" fill={wood.dark} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
          <Path d="M24 40 L30 20 Q50 13 70 20 L76 40 Z" fill="#5A2E10" />
          {/* Coins heaped above the rim. */}
          <Circle cx={36} cy={44} r={9} fill={palette.yellow} stroke={INK} strokeWidth={2.4} />
          <Circle cx={52} cy={40} r={10} fill={palette.yellow} stroke={INK} strokeWidth={2.4} />
          <Circle cx={66} cy={45} r={8.5} fill={palette.yellow} stroke={INK} strokeWidth={2.4} />
          <Circle cx={49} cy={37} r={3} fill={palette.white} opacity={0.7} />
        </G>
      ) : null}

      {/* Body. */}
      <Rect x={10} y={44} width={80} height={46} rx={6} fill={wood.body} stroke={INK} strokeWidth={STROKE} />
      <Rect x={10} y={56} width={80} height={8} fill={wood.band} stroke={INK} strokeWidth={2} />
      <Rect x={22} y={44} width={8} height={46} fill={wood.band} stroke={INK} strokeWidth={2} />
      <Rect x={70} y={44} width={8} height={46} fill={wood.band} stroke={INK} strokeWidth={2} />

      {state === 'open' ? null : (
        <G>
          <Path d={LID_CLOSED} fill={wood.body} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
          <Rect x={22} y={24} width={8} height={22} fill={wood.band} stroke={INK} strokeWidth={2} />
          <Rect x={70} y={24} width={8} height={22} fill={wood.band} stroke={INK} strokeWidth={2} />
        </G>
      )}

      {state === 'locked' ? (
        // Padlock on the front.
        <G>
          <Path d="M43 58 L43 52 Q50 44 57 52 L57 58" fill="none" stroke={INK} strokeWidth={3.2} />
          <Rect x={39} y={57} width={22} height={18} rx={3} fill="#8E8B86" stroke={INK} strokeWidth={STROKE} />
          <Circle cx={50} cy={65} r={2.6} fill={INK} />
        </G>
      ) : (
        // Gold clasp.
        <Rect x={43} y={52} width={14} height={16} rx={3} fill={palette.yellow} stroke={INK} strokeWidth={STROKE} />
      )}

      {state === 'ready' ? (
        // Sparkles: something good is inside.
        <G fill={palette.white} stroke={INK} strokeWidth={1.6} strokeLinejoin="round">
          <Path d={sparkle(88, 18, 8)} />
          <Path d={sparkle(12, 26, 6)} />
        </G>
      ) : null}
    </Svg>
  );
});

const LID_CLOSED = 'M10 46 L10 34 Q10 20 26 20 L74 20 Q90 20 90 34 L90 46 Z';

function sparkle(cx: number, cy: number, r: number): string {
  const k = r * 0.3;
  return `M${cx} ${cy - r} L${cx + k} ${cy - k} L${cx + r} ${cy} L${cx + k} ${cy + k} L${cx} ${cy + r} L${cx - k} ${cy + k} L${cx - r} ${cy} L${cx - k} ${cy - k} Z`;
}
