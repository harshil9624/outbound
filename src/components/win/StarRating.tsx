import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import type { StarCount } from '@/types';
import { WIN_STAR_DELAY_MS, WIN_STAR_GAP_MS } from '@/constants/animation';
import { colors, palette, spacing, themed } from '@/theme';
import { withAlpha } from '@/utils/color';

/** A plump five-point star (24-unit box). Round joins on a thick outline soften its points. */
const STAR = 'M12 2.6 L14.8 8.7 L21.4 9.4 L16.4 13.9 L17.9 20.4 L12 17 L6.1 20.4 L7.6 13.9 L2.6 9.4 L9.2 8.7 Z';
const SIZE = 68;

function StarGlyph({ size, filled }: { size: number; filled: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26">
      {filled ? (
        // Hard ink shadow, like the app's buttons and cards.
        <G transform="translate(1.8 1.8)">
          <Path d={STAR} fill={colors.artInk} stroke={colors.artInk} strokeWidth={2.2} strokeLinejoin="round" />
        </G>
      ) : null}
      <G transform="translate(0.4 0.4)">
        <Path
          d={STAR}
          // Unearned: the theme's ink, faint, so the empty slot shows on light and dark screens alike.
          fill={filled ? palette.yellow : withAlpha(colors.ink, 0.1)}
          stroke={filled ? colors.artInk : withAlpha(colors.ink, 0.4)}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

function Star({ index, filled, reducedMotion, size }: { index: number; filled: boolean; reducedMotion: boolean; size: number }) {
  const pop = useSharedValue(reducedMotion || !filled ? 1 : 0);
  useEffect(() => {
    if (!filled || reducedMotion) return;
    // One after another: grow past full size, then settle with a small bounce.
    pop.value = withDelay(
      WIN_STAR_DELAY_MS + index * WIN_STAR_GAP_MS,
      withSequence(withTiming(1.25, { duration: 160 }), withSpring(1, { damping: 7, stiffness: 220 })),
    );
  }, [filled, reducedMotion, index, pop]);

  const popStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, pop.value * 3), transform: [{ scale: pop.value }] }));

  return (
    <View style={{ width: size, height: size }}>
      {/* The empty slot sits underneath; an earned star pops in on top of it. */}
      <StarGlyph size={size} filled={false} />
      {filled ? (
        <Animated.View style={[StyleSheet.absoluteFill, popStyle]}>
          <StarGlyph size={size} filled />
        </Animated.View>
      ) : null}
    </View>
  );
}

/** Three equal stars in a row: earned ones gold with an ink outline and hard shadow, the rest soft grey. */
/** `scale` shrinks the stars on short screens so everything fits without scrolling. */
export const StarRating = memo(function StarRating({
  stars,
  reducedMotion = false,
  scale = 1,
}: {
  stars: StarCount;
  reducedMotion?: boolean;
  scale?: number;
}) {
  const size = Math.round(SIZE * scale);
  return (
    <View style={styles.row} accessibilityLabel={`${stars} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <Star key={i} index={i} filled={i < stars} reducedMotion={reducedMotion} size={size} />
      ))}
    </View>
  );
});

const styles = themed(() =>
  StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  }),
);
