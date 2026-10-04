import { memo, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { HAMMER_IMPACT_MS, HAMMER_STRIKE_MS } from '@/constants/animation';
import { HammerIcon } from '@/components/icons';
import { colors, fontWeights, palette } from '@/theme';

/** Fractions of HAMMER_STRIKE_MS. */
const FLY_END = 0.38;
const WINDUP_END = 0.46;
const IMPACT = HAMMER_IMPACT_MS / HAMMER_STRIKE_MS;
const BOUNCE_END = 0.7;
/** Rotation (deg, about the handle's end) for each pose. -90 = head lying flat to the left. */
export const RAISED = 25;
const WOUND = 42;
const HIT = -96;
const REST = -86;
/** Head centre sits this far (× hammer size) from the bottom of the handle. */
const HEAD_REACH = 0.73;
const SPARKS = 10;

export const hammerSize = (cellSize: number) => Math.max(64, cellSize * 1.5);

/**
 * Transform that draws the hammer with the end of its handle at (px, py), turned `angle`
 * degrees about that point. Done by hand (centre offset + rotate) rather than transformOrigin,
 * which isn't reliable for animated styles on every Android build.
 */
export function hammerTransform(px: number, py: number, angle: number, size: number, scale = 1) {
  'worklet';
  const rad = (angle * Math.PI) / 180;
  const cx = px + Math.sin(rad) * (size / 2) * scale;
  const cy = py - Math.cos(rad) * (size / 2) * scale;
  return [
    { translateX: cx - size / 2 },
    { translateY: cy - size / 2 },
    { rotate: `${angle}deg` },
    { scale },
  ];
}

interface HammerStrikeProps {
  /** Arrow head to hit, in the overlay's pixels. */
  targetX: number;
  targetY: number;
  /** Handle end's starting point: the hover spot, or below the board. */
  fromX: number;
  fromY: number;
  /** Spin on the way in (when coming from below rather than from the hover spot). */
  spin: boolean;
  cellSize: number;
  onImpact: () => void;
  onDone: () => void;
}

/**
 * A big hammer flies in from below the board, spins, winds up, slams down on the arrow
 * (BAM! + spark burst; the board shakes via onImpact), bounces and fades.
 * Rotation pivots on the end of the handle (hammerTransform) so the swing arcs like a real hammer.
 */
export const HammerStrike = memo(function HammerStrike({
  targetX,
  targetY,
  fromX,
  fromY,
  spin,
  cellSize,
  onImpact,
  onDone,
}: HammerStrikeProps) {
  const size = hammerSize(cellSize);
  // Pivot (handle end) placed so that at the HIT angle the head lands on the target.
  const pivotX = targetX + size * HEAD_REACH;
  const pivotY = targetY;

  const t = useSharedValue(0);
  const impact = useSharedValue(0);
  // Latest callbacks without restarting the strike when the parent re-renders.
  const callbacks = useRef({ onImpact, onDone });
  callbacks.current = { onImpact, onDone };

  useEffect(() => {
    t.value = withTiming(1, { duration: HAMMER_STRIKE_MS, easing: Easing.linear });
    impact.value = withDelay(HAMMER_IMPACT_MS, withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }));
    const hit = setTimeout(() => callbacks.current.onImpact(), HAMMER_IMPACT_MS);
    const done = setTimeout(() => callbacks.current.onDone(), HAMMER_STRIKE_MS + 50);
    return () => {
      clearTimeout(hit);
      clearTimeout(done);
    };
  }, [t, impact]);

  const hammerStyle = useAnimatedStyle(() => {
    const v = t.value;
    let x = pivotX;
    let y = pivotY;
    let angle = REST;
    let scale = 1;
    let opacity = 1;
    if (v < FLY_END) {
      const p = 1 - Math.pow(1 - v / FLY_END, 3);
      x = fromX + (pivotX - fromX) * p;
      y = fromY + (pivotY - fromY) * p - Math.sin(Math.PI * p) * size * 1.2;
      angle = RAISED - (spin ? 360 : 0) * (1 - p); // one full spin when flying in from below
      scale = spin ? 0.55 + 0.45 * p : 1;
    } else if (v < WINDUP_END) {
      angle = RAISED + (WOUND - RAISED) * ((v - FLY_END) / (WINDUP_END - FLY_END));
    } else if (v < IMPACT) {
      const p = (v - WINDUP_END) / (IMPACT - WINDUP_END);
      angle = WOUND + (HIT - WOUND) * p * p; // accelerates into the hit
    } else if (v < BOUNCE_END) {
      angle = HIT + (REST - HIT) * Math.sin(((v - IMPACT) / (BOUNCE_END - IMPACT)) * Math.PI * 0.5);
    } else {
      const p = (v - BOUNCE_END) / (1 - BOUNCE_END);
      y = pivotY - p * size * 0.35;
      opacity = 1 - p;
    }
    return { opacity, transform: hammerTransform(x, y, angle, size, scale) };
  });

  const bamStyle = useAnimatedStyle(() => {
    const p = impact.value;
    const pop = p < 0.25 ? (p / 0.25) * 1.3 : 1.3 - 0.3 * Math.min(1, (p - 0.25) / 0.2);
    return {
      opacity: p <= 0 ? 0 : p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1,
      transform: [{ translateY: -p * cellSize * 0.4 }, { scale: pop }, { rotate: '-12deg' }],
    };
  });

  const ringStyle = useAnimatedStyle(() => ({
    opacity: impact.value > 0 ? 1 - impact.value : 0,
    transform: [{ scale: 0.3 + impact.value * 2.2 }],
  }));

  const ring = cellSize * 0.9;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.ring,
          { left: targetX - ring / 2, top: targetY - ring / 2, width: ring, height: ring, borderRadius: ring / 2 },
          ringStyle,
        ]}
      />
      {Array.from({ length: SPARKS }, (_, i) => (
        <Spark key={i} index={i} impact={impact} x={targetX} y={targetY} reach={cellSize * 1.1} />
      ))}
      <Animated.View style={[styles.hammer, { width: size, height: size }, hammerStyle]}>
        <HammerIcon size={size} />
      </Animated.View>
      <Animated.Text
        style={[styles.bam, { left: targetX - 60, top: targetY - cellSize * 1.15, fontSize: Math.max(26, cellSize * 0.6) }, bamStyle]}
      >
        BAM!
      </Animated.Text>
    </View>
  );
});

function Spark({ index, impact, x, y, reach }: { index: number; impact: SharedValue<number>; x: number; y: number; reach: number }) {
  const angle = (index / SPARKS) * Math.PI * 2 + 0.3;
  const dist = reach * (index % 2 ? 0.7 : 1);
  const style = useAnimatedStyle(() => {
    const p = impact.value;
    return {
      opacity: p > 0 && p < 1 ? 1 - p : 0,
      transform: [
        { translateX: Math.cos(angle) * dist * p },
        { translateY: Math.sin(angle) * dist * p },
        { rotate: '45deg' },
        { scale: 1.3 - p },
      ],
    };
  });
  return <Animated.View style={[styles.spark, { left: x - 6, top: y - 6 }, index % 3 === 0 && styles.sparkWhite, style]} />;
}

const styles = StyleSheet.create({
  hammer: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  ring: { position: 'absolute', borderWidth: 4, borderColor: palette.yellow },
  spark: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: palette.yellow,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  sparkWhite: { backgroundColor: palette.white },
  bam: {
    position: 'absolute',
    width: 120,
    textAlign: 'center',
    fontWeight: fontWeights.heavy,
    color: palette.yellow,
    textShadowColor: colors.ink,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 1,
  },
});
