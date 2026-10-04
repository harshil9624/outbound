import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, palette } from '@/theme';

const PIECE_COLORS = [palette.yellow, palette.pink, palette.blue, palette.green, palette.orange, palette.purple];
const PIECES = 20;

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

/** Ink-outlined paper confetti that keeps drifting down while the win screen is open. */
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
        delay: between(0, 2200),
        duration: between(2800, 4400),
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
    v.value = withDelay(spec.delay, withRepeat(withTiming(1, { duration: spec.duration, easing: Easing.linear }), -1));
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

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, borderWidth: 1.5, borderColor: colors.ink },
});
