import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { borderWidths, colors, radii, spacing, textStyles, themed } from '@/theme';

const VISIBLE_MS = 1500;

/** Pops up above the boost buttons to say why a boost couldn't be used. */
export const BoostNotice = memo(function BoostNotice({ notice }: { notice: { text: string; token: number } | null }) {
  const show = useSharedValue(0);

  useEffect(() => {
    if (!notice) return;
    show.value = 0;
    show.value = withSequence(
      withSpring(1, { damping: 12, stiffness: 260 }),
      withDelay(VISIBLE_MS, withTiming(0, { duration: 200 })),
    );
  }, [notice, show]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, show.value * 1.5),
    transform: [{ translateY: (1 - show.value) * 12 }, { scale: 0.9 + show.value * 0.1 }],
  }));

  if (!notice) return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, style]} accessibilityLiveRegion="polite">
      <Text style={styles.text}>{notice.text}</Text>
    </Animated.View>
  );
});

const styles = themed(() => StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '100%',
    bottom: '100%',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  text: { ...textStyles.label, color: colors.surface, textAlign: 'center' },
}));
