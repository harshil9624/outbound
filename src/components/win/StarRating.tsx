import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import type { StarCount } from '@/types';
import { StarIcon } from '@/components/icons';
import { colors, spacing } from '@/theme';

function Star({ filled, index, reducedMotion }: { filled: boolean; index: number; reducedMotion: boolean }) {
  const scale = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (!reducedMotion) scale.value = withDelay(150 + index * 160, withSpring(1, { damping: 9, stiffness: 180 }));
  }, [index, reducedMotion, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[index === 1 && styles.middle, style]}>
      <StarIcon size={index === 1 ? 64 : 50} color={filled ? colors.primary : colors.disabled} />
    </Animated.View>
  );
}

export const StarRating = memo(function StarRating({ stars, reducedMotion = false }: { stars: StarCount; reducedMotion?: boolean }) {
  return (
    <View style={styles.row} accessibilityLabel={`${stars} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <Star key={i} index={i} filled={i < stars} reducedMotion={reducedMotion} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  middle: { marginBottom: spacing.md },
});
