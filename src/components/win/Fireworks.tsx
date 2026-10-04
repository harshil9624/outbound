import { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { FIREWORK_DELAYS_MS, FIREWORK_LAUNCH, FIREWORK_MS } from '@/constants/animation';
import { colors, palette } from '@/theme';

const SPARK_COLORS = [palette.yellow, palette.pink, palette.blue, palette.green, palette.orange, palette.purple, palette.red];
const SPARKS_PER_BURST = 10;
const SPARK_THICKNESS = 6;
const RING_SIZE = 40;
/** Downward pull on sparks, in px at the end of the burst. */
const GRAVITY = 70;

interface SparkSpec {
  angle: number;
  dist: number;
  len: number;
  color: string;
}

interface BurstSpec {
  x: number;
  y: number;
  /** Where the rocket starts, below the screen. */
  fromY: number;
  delay: number;
  radius: number;
  ringColor: string;
  sparks: SparkSpec[];
}

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
const between = (min: number, max: number) => min + Math.random() * (max - min);

function makeBursts(width: number, height: number): BurstSpec[] {
  return FIREWORK_DELAYS_MS.map((delay) => {
    const [a, b] = [pick(SPARK_COLORS), pick(SPARK_COLORS)];
    const radius = between(70, 115);
    const offset = Math.random() * Math.PI;
    return {
      x: between(0.15, 0.85) * width,
      y: between(0.1, 0.45) * height,
      fromY: height + 30,
      delay,
      radius,
      ringColor: a,
      sparks: Array.from({ length: SPARKS_PER_BURST }, (_, i) => ({
        angle: offset + (i / SPARKS_PER_BURST) * Math.PI * 2 + between(-0.12, 0.12),
        dist: radius * between(0.75, 1.1),
        len: between(12, 20),
        color: i % 2 ? a : b,
      })),
    };
  });
}

/**
 * Firecracker show: each rocket rises from below the screen, then bursts into
 * ink-outlined spark streaks with a shockwave ring. Silent: the win jingle is enough.
 * One shared value per burst drives its rocket, ring and every spark.
 *
 * Each burst is mounted only for its own lifetime, so at most two or three exist at once
 * instead of creating every spark view up front (which made the screen stutter on open).
 */
export const Fireworks = memo(function Fireworks() {
  const { width, height } = useWindowDimensions();
  const bursts = useMemo(() => makeBursts(width, height), [width, height]);
  const [live, setLive] = useState<number[]>([]);

  useEffect(() => {
    const timers = bursts.flatMap((b, i) => [
      setTimeout(() => setLive((l) => [...l, i]), b.delay),
      setTimeout(() => setLive((l) => l.filter((k) => k !== i)), b.delay + FIREWORK_MS + 50),
    ]);
    return () => timers.forEach(clearTimeout);
  }, [bursts]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {live.map((i) => (
        <Burst key={i} spec={bursts[i]} />
      ))}
    </View>
  );
});

function Burst({ spec }: { spec: BurstSpec }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: FIREWORK_MS, easing: Easing.linear });
  }, [t]);

  const rocketStyle = useAnimatedStyle(() => {
    const p = Math.min(1, t.value / FIREWORK_LAUNCH);
    const e = 1 - (1 - p) * (1 - p);
    return {
      opacity: t.value > 0 && t.value < FIREWORK_LAUNCH ? 1 : 0,
      transform: [{ translateY: (spec.fromY - spec.y) * (1 - e) }],
    };
  });

  const ringStyle = useAnimatedStyle(() => {
    const p = Math.max(0, (t.value - FIREWORK_LAUNCH) / (1 - FIREWORK_LAUNCH));
    const grow = Math.min(1, p / 0.35);
    return {
      opacity: p <= 0 ? 0 : 1 - grow,
      transform: [{ scale: 0.2 + grow * ((spec.radius * 1.6) / RING_SIZE) }],
    };
  });

  return (
    <>
      <Animated.View style={[styles.rocket, { left: spec.x - 3, top: spec.y - 9 }, rocketStyle]} />
      <Animated.View
        style={[
          styles.ring,
          { left: spec.x - RING_SIZE / 2, top: spec.y - RING_SIZE / 2, borderColor: spec.ringColor },
          ringStyle,
        ]}
      />
      {spec.sparks.map((s, i) => (
        <Spark key={i} t={t} x={spec.x} y={spec.y} spec={s} />
      ))}
    </>
  );
}

function Spark({ t, x, y, spec }: { t: SharedValue<number>; x: number; y: number; spec: SparkSpec }) {
  const { angle, dist, len } = spec;
  const style = useAnimatedStyle(() => {
    const p = Math.max(0, (t.value - FIREWORK_LAUNCH) / (1 - FIREWORK_LAUNCH));
    const e = 1 - Math.pow(1 - p, 3);
    return {
      opacity: p <= 0 ? 0 : p < 0.6 ? 1 : (1 - p) / 0.4,
      transform: [
        { translateX: Math.cos(angle) * dist * e },
        { translateY: Math.sin(angle) * dist * e + GRAVITY * p * p },
        { rotate: `${angle}rad` },
        { scaleX: 1 - 0.55 * p },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.spark,
        { left: x - len / 2, top: y - SPARK_THICKNESS / 2, width: len, backgroundColor: spec.color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  rocket: {
    position: 'absolute',
    width: 6,
    height: 18,
    borderRadius: 3,
    backgroundColor: palette.yellow,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 4,
  },
  spark: {
    position: 'absolute',
    height: SPARK_THICKNESS,
    borderRadius: SPARK_THICKNESS / 2,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
});
