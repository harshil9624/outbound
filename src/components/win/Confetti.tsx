import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors, palette, themed } from '@/theme';

const PIECE_COLORS = [palette.yellow, palette.pink, palette.blue, palette.green, palette.orange, palette.purple];
const PIECES = 16;
/** Every piece starts within this window, so it reads as one burst. */
const CONFETTI_SPREAD_MS = 900;
const CONFETTI_FALL_MAX_MS = 4400;
/** By now every piece has left the screen; the win screen unmounts the confetti. */
export const CONFETTI_TOTAL_MS = CONFETTI_SPREAD_MS + CONFETTI_FALL_MAX_MS;

interface PieceSpec {
  x: number;
  w: number;
  h: number;
  color: string;
  round: boolean;
  delay: number;
  duration: number;
  spins: number;
  flips: number;
  sway: number;
}

const between = (min: number, max: number) => min + Math.random() * (max - min);

/** Ink-outlined paper confetti: one shower when the win screen opens, then it's gone. */
export const Confetti = memo(function Confetti() {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo<PieceSpec[]>(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        x: between(0, width - 14),
        w: between(9, 14),
        h: between(6, 11),
        color: PIECE_COLORS[i % PIECE_COLORS.length],
        round: i % 4 === 0,
        delay: between(0, CONFETTI_SPREAD_MS),
        duration: between(2800, CONFETTI_FALL_MAX_MS),
        spins: between(1, 3) * (i % 2 ? 1 : -1),
        flips: Math.round(between(2, 5)),
        sway: between(10, 30),
      })),
    [width],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Piece key={i} spec={p} fall={height + 60} />
      ))}
    </View>
  );
});

function Piece({ spec, fall }: { spec: PieceSpec; fall: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    // A single fall: the piece ends below the screen.
    v.value = withDelay(spec.delay, withTiming(1, { duration: spec.duration, easing: Easing.linear }));
  }, [spec.delay, spec.duration, v]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -30 + v.value * fall },
      { translateX: Math.sin(v.value * Math.PI * 4) * spec.sway },
      { rotate: `${v.value * 360 * spec.spins}deg` },
      // Paper flutter: the piece flips edge-on and back as it falls.
      { scaleY: Math.cos(v.value * Math.PI * spec.flips) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: spec.x,
          width: spec.w,
          height: spec.h,
          backgroundColor: spec.color,
          borderRadius: spec.round ? spec.w / 2 : 1,
        },
        style,
      ]}
    />
  );
}

const styles = themed(() => StyleSheet.create({
  piece: { position: 'absolute', top: 0, borderWidth: 1.5, borderColor: colors.artInk },
}));
