import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, G, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '@/theme';

interface CoachHandProps {
  /** The spot to tap, in the board overlay's pixels. */
  x: number;
  y: number;
  cellSize: number;
  reducedMotion: boolean;
}

/** Drawn in a 40 × 50 box; the fingertip is at TIP. */
const VIEW_W = 40;
const VIEW_H = 50;
const TIP = { x: 15, y: 2 };
const INK = palette.black;
const STROKE = 2.6;

/**
 * The guided first level's pointing hand. It taps the target over and over, with a ripple where
 * the fingertip lands. Still (no taps, no ripple) with reduced motion.
 */
export const CoachHand = memo(function CoachHand({ x, y, cellSize, reducedMotion }: CoachHandProps) {
  const width = Math.max(40, Math.min(64, cellSize * 0.85));
  const scale = width / VIEW_W;
  const height = VIEW_H * scale;
  // The fingertip rests just below the target's centre, so the hand doesn't hide the arrow's face.
  const left = x - TIP.x * scale;
  const top = y - TIP.y * scale + cellSize * 0.18;

  const tap = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) {
      tap.value = 0;
      return;
    }
    tap.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: 420 }),
      ),
      -1,
    );
    return () => cancelAnimation(tap);
  }, [reducedMotion, tap]);

  // Down and slightly in on the tap, as if pressing the screen.
  const handStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - tap.value) * 10 * scale }, { scale: 1 - tap.value * 0.06 }],
  }));
  const ring = width * 0.9;
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: tap.value > 0.6 ? (tap.value - 0.6) * 2 : 0,
    transform: [{ scale: 0.5 + tap.value * 0.6 }],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {reducedMotion ? null : (
        <Animated.View
          style={[
            styles.ripple,
            { left: x - ring / 2, top: y + cellSize * 0.18 - ring / 2, width: ring, height: ring, borderRadius: ring / 2 },
            rippleStyle,
          ]}
        />
      )}
      <Animated.View style={[{ position: 'absolute', left, top, width, height }, handStyle]}>
        <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
          {/* Solid ink offset, like every other piece in the game. */}
          <G transform="translate(2 2)">
            <HandShape fill={INK} />
          </G>
          <HandShape fill={palette.white} />
          {/* Sleeve cuff. */}
          <Rect x={9} y={41} width={23} height={8} rx={2} fill={palette.blue} stroke={INK} strokeWidth={STROKE} />
        </Svg>
      </Animated.View>
    </View>
  );
});

function HandShape({ fill }: { fill: string }) {
  return (
    <G stroke={INK} strokeWidth={STROKE} strokeLinejoin="round">
      {/* Thumb, palm, three curled fingers, then the pointing finger in front. */}
      <Ellipse cx={8.5} cy={29} rx={4.5} ry={7.5} fill={fill} transform="rotate(-28 8.5 29)" />
      <Rect x={8} y={18} width={25} height={25} rx={8} fill={fill} />
      <Rect x={18} y={16} width={7.5} height={10} rx={3.75} fill={fill} />
      <Rect x={24.5} y={18} width={7.5} height={10} rx={3.75} fill={fill} />
      <Rect x={10} y={1} width={10} height={27} rx={5} fill={fill} />
    </G>
  );
}

const styles = StyleSheet.create({
  ripple: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: palette.white,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
