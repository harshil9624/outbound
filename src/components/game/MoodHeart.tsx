import { memo, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, palette } from '@/theme';

export type HeartMood = 'happy' | 'worried' | 'scared' | 'broken';

const HEART = 'M12 20.5 C5 15 2.5 11.5 2.5 8.5 A4.6 4.6 0 0 1 12 6.4 A4.6 4.6 0 0 1 21.5 8.5 C21.5 11.5 19 15 12 20.5 Z';
const CRACK = 'M12 6.4 L10.7 9.3 L13.1 11.4 L10.9 14.2 L12.7 16.8 L12 20.5';
const TEAR = 'M0 0 Q-1.3 2 0 2.9 Q1.3 2 0 0 Z';

const RED = { light: '#FF9A9A', mid: palette.red, dark: '#C9213A' };
const GREY = { light: '#EFE7D6', mid: palette.sand, dark: palette.stone };
const BLUSH = '#FF8FB8';

const STROKE = { stroke: colors.ink, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;

function Eye({ x, wide }: { x: number; wide?: boolean }) {
  if (wide) {
    return (
      <G>
        <Circle cx={x} cy={11} r={1.7} fill={palette.white} stroke={colors.ink} strokeWidth={0.8} />
        <Circle cx={x} cy={11.3} r={0.8} fill={colors.ink} />
      </G>
    );
  }
  return (
    <G>
      <Ellipse cx={x} cy={11} rx={1.05} ry={1.4} fill={colors.ink} />
      <Circle cx={x + 0.35} cy={10.5} r={0.4} fill={palette.white} />
    </G>
  );
}

function Face({ mood }: { mood: HeartMood }) {
  switch (mood) {
    case 'happy':
      return (
        <G>
          <Eye x={9} />
          <Eye x={15} />
          <Path d="M9.7 13.4 Q12 16.6 14.3 13.4 Z" fill={colors.ink} />
          <Path d="M10.9 14.7 Q12 15.6 13.1 14.7 Q12 14.2 10.9 14.7 Z" fill={BLUSH} />
          <Ellipse cx={6.9} cy={13.4} rx={1.3} ry={0.7} fill={BLUSH} />
          <Ellipse cx={17.1} cy={13.4} rx={1.3} ry={0.7} fill={BLUSH} />
        </G>
      );
    case 'worried':
      return (
        <G>
          <Path d="M7.6 9 L10.1 8.2" {...STROKE} strokeWidth={0.9} />
          <Path d="M13.9 8.2 L16.4 9" {...STROKE} strokeWidth={0.9} />
          <Eye x={9} />
          <Eye x={15} />
          <Path d="M9.8 14.8 Q10.9 13.9 12 14.8 Q13.1 15.7 14.2 14.8" {...STROKE} strokeWidth={1.1} />
        </G>
      );
    case 'scared':
      return (
        <G>
          <Path d="M7.4 8.6 L10.2 7.7" {...STROKE} strokeWidth={0.9} />
          <Path d="M13.8 7.7 L16.6 8.6" {...STROKE} strokeWidth={0.9} />
          <Eye x={9} wide />
          <Eye x={15} wide />
          <Ellipse cx={12} cy={15} rx={1} ry={1.25} fill={colors.ink} />
          <Path d={TEAR} transform="translate(18.9 5.6)" fill={palette.blue} stroke={colors.ink} strokeWidth={0.6} />
        </G>
      );
    case 'broken':
      return (
        <G>
          <Path d={CRACK} {...STROKE} strokeWidth={1.3} />
          <Path d="M7.9 10.6 Q9 11.6 10.1 10.6" {...STROKE} strokeWidth={1} />
          <Path d="M13.9 10.6 Q15 11.6 16.1 10.6" {...STROKE} strokeWidth={1} />
          <Path d="M9.9 15.3 Q11 14 12 14.9" {...STROKE} strokeWidth={1} />
          <Path d={TEAR} transform="translate(8.3 12.2)" fill={palette.blue} stroke={colors.ink} strokeWidth={0.5} />
        </G>
      );
  }
}

/** Glossy heart: hard ink shadow, radial-shaded body, gloss highlight, and an expressive face. */
export const HeartGlyph = memo(function HeartGlyph({ size, mood }: { size: number; mood: HeartMood }) {
  const tone = mood === 'broken' ? GREY : RED;
  const id = mood === 'broken' ? 'heartGrey' : 'heartRed';
  return (
    <Svg width={size} height={size} viewBox="0 0 25 25">
      <Defs>
        <RadialGradient id={id} cx="38%" cy="32%" r="72%">
          <Stop offset="0" stopColor={tone.light} />
          <Stop offset="0.45" stopColor={tone.mid} />
          <Stop offset="1" stopColor={tone.dark} />
        </RadialGradient>
      </Defs>
      <Path d={HEART} transform="translate(1.6 1.6)" fill={colors.ink} />
      <G transform="translate(0.3 0.3)">
        <Path d={HEART} fill={`url(#${id})`} stroke={colors.ink} strokeWidth={1.5} strokeLinejoin="round" />
        <Ellipse cx={6.6} cy={7.6} rx={1.9} ry={1.1} fill={palette.white} opacity={0.85} transform="rotate(-40 6.6 7.6)" />
        <Circle cx={8.6} cy={6.3} r={0.5} fill={palette.white} opacity={0.85} />
        <Face mood={mood} />
      </G>
    </Svg>
  );
});

interface MoodHeartProps {
  size: number;
  mood: HeartMood;
  /** One heartbeat cycle; 0 = still. */
  beatMs: number;
  /** Offsets the beat so a row of hearts doesn't pulse in lockstep. */
  beatDelayMs?: number;
  reducedMotion: boolean;
}

/** A heart that beats while alive, and shakes, pops and sheds a tear the moment it breaks. */
export const MoodHeart = memo(function MoodHeart({ size, mood, beatMs, beatDelayMs = 0, reducedMotion }: MoodHeartProps) {
  const alive = mood !== 'broken';
  const beat = useSharedValue(1);
  const pop = useSharedValue(1);
  const shake = useSharedValue(0);
  const tear = useSharedValue(0);
  const wasAlive = useRef(alive);

  // Lub-dub heartbeat.
  useEffect(() => {
    if (reducedMotion || !alive || beatMs <= 0) {
      cancelAnimation(beat);
      beat.value = withTiming(1, { duration: 120 });
      return;
    }
    beat.value = withDelay(
      beatDelayMs,
      withRepeat(
        withSequence(
          withTiming(1.14, { duration: beatMs * 0.12 }),
          withTiming(1, { duration: beatMs * 0.12 }),
          withTiming(1.08, { duration: beatMs * 0.1 }),
          withTiming(1, { duration: beatMs * 0.66 }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(beat);
  }, [alive, beatMs, beatDelayMs, reducedMotion, beat]);

  // Break (alive → broken) or refill (broken → alive, e.g. on restart).
  useEffect(() => {
    const was = wasAlive.current;
    wasAlive.current = alive;
    if (reducedMotion || was === alive) return;
    if (!alive) {
      pop.value = withSequence(withTiming(1.4, { duration: 90 }), withSpring(1, { damping: 6, stiffness: 220 }));
      shake.value = withSequence(
        withTiming(-1, { duration: 45 }),
        withRepeat(withTiming(1, { duration: 70 }), 5, true),
        withTiming(0, { duration: 45 }),
      );
      tear.value = 0;
      tear.value = withDelay(180, withTiming(1, { duration: 750 }));
    } else {
      pop.value = 0.3;
      pop.value = withSpring(1, { damping: 7, stiffness: 200 });
    }
  }, [alive, reducedMotion, pop, shake, tear]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value * 3 },
      { rotate: `${shake.value * 12}deg` },
      { scale: beat.value * pop.value },
    ],
  }));

  const tearStyle = useAnimatedStyle(() => ({
    opacity: tear.value > 0 && tear.value < 1 ? 1 - tear.value : 0,
    // Rounded square with one sharp corner, turned so the point faces up: a drop.
    transform: [{ translateY: tear.value * size * 0.7 }, { scale: 1 - tear.value * 0.4 }, { rotate: '45deg' }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={heartStyle}>
        <HeartGlyph size={size} mood={mood} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.tear, { left: size * 0.3, top: size * 0.5, width: size * 0.18, height: size * 0.24 }, tearStyle]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  tear: {
    position: 'absolute',
    backgroundColor: palette.blue,
    borderWidth: 1,
    borderColor: colors.ink,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 99,
    borderBottomLeftRadius: 99,
    borderBottomRightRadius: 99,
  },
});
