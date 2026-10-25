import { memo, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import Svg, { Circle, Ellipse, G, Path, Polygon } from 'react-native-svg';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, palette } from '@/theme';

export type FlameStage = 'ember' | 'small' | 'medium' | 'big' | 'crown';
export type FlameMood = 'happy' | 'sleepy' | 'cold';

/** The growth path after the ember: the streak length each stage starts at, and its name for kids. */
export const FLAME_STAGES: readonly { stage: Exclude<FlameStage, 'ember'>; days: number; name: string }[] = [
  { stage: 'small', days: 1, name: 'Spark' },
  { stage: 'medium', days: 3, name: 'Flame' },
  { stage: 'big', days: 7, name: 'Blaze' },
  { stage: 'crown', days: 14, name: 'King' },
];

/** How big the flame has grown: it gets bigger the longer the streak, and wears a crown at two weeks. */
export function flameStage(count: number): FlameStage {
  let stage: FlameStage = 'ember';
  for (const s of FLAME_STAGES) if (count >= s.days) stage = s.stage;
  return stage;
}

const STAGE_SCALE: Record<FlameStage, number> = { ember: 0.62, small: 0.76, medium: 0.88, big: 1, crown: 1 };

const TONES: Record<FlameMood, { outer: string; inner: string }> = {
  happy: { outer: '#FF6A2B', inner: palette.yellow },
  // A freeze is holding the streak: an icy blue flame, still smiling.
  cold: { outer: '#5BB8FF', inner: '#D9F1FF' },
  // No streak right now: a dim, sleepy ember (never a sad or broken one).
  sleepy: { outer: '#E0A87A', inner: '#FFE7B8' },
};

const INK = colors.artInk;
const STROKE = 3.5;

interface FlameBuddyProps {
  count: number;
  mood: FlameMood;
  /** The size of a full-grown flame; younger stages draw smaller inside it. */
  size: number;
  reducedMotion: boolean;
}

/**
 * The streak as a little character: a flame with a face that grows with the streak. It flickers
 * gently while the Streak tab is in view (stopped when hidden, and with reduced motion).
 */
export const FlameBuddy = memo(function FlameBuddy({ count, mood, size, reducedMotion }: FlameBuddyProps) {
  const stage = flameStage(count);
  const tone = TONES[mood];
  const w = size * STAGE_SCALE[stage];
  const h = w * 1.2;

  const flicker = useSharedValue(0);
  useFocusEffect(
    useCallback(() => {
      if (reducedMotion || mood === 'sleepy') return;
      flicker.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true);
      return () => {
        cancelAnimation(flicker);
        flicker.value = 0;
      };
    }, [reducedMotion, mood, flicker]),
  );
  // Stretches up and narrows a touch, pinned at the base like a real flame.
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: (h / 2) * (1 - (1 + flicker.value * 0.06)) },
      { scaleY: 1 + flicker.value * 0.06 },
      { scaleX: 1 - flicker.value * 0.03 },
    ],
  }));

  return (
    <Animated.View style={[{ width: w, height: h }, style]}>
      <Svg width={w} height={h} viewBox="0 0 100 120">
        {/* Solid ink offset shadow, like the rest of the game. */}
        <G transform="translate(4 4)">
          <Path d={OUTER} fill={INK} />
        </G>
        <Path d={OUTER} fill={tone.outer} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
        <Path d={INNER} fill={tone.inner} />
        <Face mood={mood} />
        {stage === 'crown' ? (
          <Polygon
            points="30,20 38,2 50,14 62,2 70,20"
            fill={palette.gold}
            stroke={INK}
            strokeWidth={STROKE * 0.8}
            strokeLinejoin="round"
            transform="translate(0 -4)"
          />
        ) : null}
      </Svg>
    </Animated.View>
  );
});

const OUTER = 'M50 6 C62 28 88 42 88 76 C88 102 70 117 50 117 C30 117 12 102 12 76 C12 54 27 45 33 29 C38 43 44 47 48 47 C46 33 44 19 50 6 Z';
const INNER = 'M50 52 C61 64 72 73 72 89 C72 104 62 111 50 111 C38 111 28 104 28 89 C28 76 39 68 50 52 Z';

function Face({ mood }: { mood: FlameMood }) {
  if (mood === 'sleepy') {
    return (
      <G stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none">
        <Path d="M37 87 Q42 91 47 87" />
        <Path d="M53 87 Q58 91 63 87" />
        <Path d="M46 99 Q50 101 54 99" />
      </G>
    );
  }
  return (
    <G>
      <Ellipse cx={42} cy={86} rx={4.2} ry={5.2} fill={INK} />
      <Ellipse cx={58} cy={86} rx={4.2} ry={5.2} fill={INK} />
      <Circle cx={43.4} cy={84.2} r={1.5} fill={palette.white} />
      <Circle cx={59.4} cy={84.2} r={1.5} fill={palette.white} />
      <Ellipse cx={34} cy={95} rx={4.5} ry={2.6} fill="#FF9EC4" opacity={0.9} />
      <Ellipse cx={66} cy={95} rx={4.5} ry={2.6} fill="#FF9EC4" opacity={0.9} />
      <Path d="M43 96 Q50 104 57 96" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
    </G>
  );
}
