import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, G, Polygon } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { StarCount } from '@/types';
import { WIN_STAR_DELAY_MS, WIN_STAR_GAP_MS, WIN_STAR_LAND_MS } from '@/constants/animation';
import { colors, palette, radii, spacing } from '@/theme';

const STAR = '12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6';
/** Left half of the star, drawn lighter for a bevelled look. */
const STAR_LIGHT_HALF = '12,2 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6';
const SOCKET = '#5C574F';
/** Arc layout: side stars tilt outward, the middle one is bigger and raised. */
const SLOTS = [
  { size: 66, tilt: -14, lift: 0 },
  { size: 90, tilt: 0, lift: 22 },
  { size: 66, tilt: 14, lift: 0 },
];
const SPARKLES = 8;
const SPARKLE_SIZE = 9;

function StarGlyph({ size, filled }: { size: number; filled: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26">
      <G transform="translate(2.4 2.4)">
        <Polygon points={STAR} fill={colors.ink} />
      </G>
      <G transform="translate(0.8 0.8)">
        <Polygon points={STAR} fill={filled ? palette.yellow : colors.inkMuted} />
        <Polygon points={STAR_LIGHT_HALF} fill={filled ? palette.lemon : SOCKET} />
        <Polygon points={STAR} fill="none" stroke={colors.ink} strokeWidth={1.6} strokeLinejoin="round" />
        {filled ? <Ellipse cx={8.4} cy={9.4} rx={1.6} ry={0.9} fill={palette.white} transform="rotate(-35 8.4 9.4)" /> : null}
      </G>
    </Svg>
  );
}

function Sparkle({ burst, index, reach }: { burst: SharedValue<number>; index: number; reach: number }) {
  const angle = (index / SPARKLES) * Math.PI * 2;
  const dist = reach * (index % 2 ? 0.75 : 1);
  const style = useAnimatedStyle(() => {
    const p = burst.value;
    return {
      opacity: p > 0 && p < 1 ? 1 - p * p : 0,
      transform: [
        { translateX: Math.cos(angle) * dist * p },
        { translateY: Math.sin(angle) * dist * p },
        { rotate: '45deg' },
        { scale: 1.2 - 0.8 * p },
      ],
    };
  });
  return <Animated.View style={[styles.sparkle, index % 2 ? styles.sparkleWhite : styles.sparkleGold, style]} />;
}

function Star({ index, filled, reducedMotion }: { index: number; filled: boolean; reducedMotion: boolean }) {
  const { size, tilt, lift } = SLOTS[index];
  const drop = useSharedValue(reducedMotion ? 1 : 0);
  const burst = useSharedValue(0);

  useEffect(() => {
    if (!filled || reducedMotion) return;
    const delay = WIN_STAR_DELAY_MS + index * WIN_STAR_GAP_MS;
    drop.value = withDelay(delay, withSpring(1, { damping: 9, stiffness: 190 }));
    burst.value = withDelay(delay + WIN_STAR_LAND_MS, withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) }));
  }, [filled, reducedMotion, index, drop, burst]);

  // Slams down from big and spun; the spring's overshoot reads as a squash on impact.
  const dropStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, drop.value * 2.5),
    transform: [{ scale: 2.6 - 1.6 * drop.value }, { rotate: `${(1 - drop.value) * -120}deg` }],
  }));

  return (
    <View style={[{ width: size, height: size, marginBottom: lift, transform: [{ rotate: `${tilt}deg` }] }]}>
      <StarGlyph size={size} filled={false} />
      {filled ? (
        <>
          <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
            {Array.from({ length: SPARKLES }, (_, i) => (
              <Sparkle key={i} burst={burst} index={i} reach={size * 0.85} />
            ))}
          </View>
          <Animated.View style={[StyleSheet.absoluteFill, dropStyle]}>
            <StarGlyph size={size} filled />
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

/** Three bevelled stars that slam into dark sockets on a black tray, each with a sparkle burst. */
export const StarRating = memo(function StarRating({ stars, reducedMotion = false }: { stars: StarCount; reducedMotion?: boolean }) {
  return (
    <View style={styles.root} accessibilityLabel={`${stars} of 3 stars`}>
      <View style={styles.tray} />
      <View style={styles.row}>
        {SLOTS.map((_, i) => (
          <Star key={i} index={i} filled={i < stars} reducedMotion={reducedMotion} />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch', alignItems: 'center', paddingTop: spacing.xs },
  tray: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.xs,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  center: { alignItems: 'center', justifyContent: 'center' },
  sparkle: {
    position: 'absolute',
    width: SPARKLE_SIZE,
    height: SPARKLE_SIZE,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  sparkleGold: { backgroundColor: palette.yellow },
  sparkleWhite: { backgroundColor: palette.white },
});
