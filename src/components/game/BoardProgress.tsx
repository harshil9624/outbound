import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { HardShadow, cornerStyles } from '@/components/ui/HardShadow';
import { borderWidths, colors, radii, spacing, textStyles, themed } from '@/theme';

interface BoardProgressProps {
  cleared: number;
  total: number;
  reducedMotion: boolean;
}

/** How much of the board is cleared: a bar that fills as arrows escape, and "3/8". */
export const BoardProgress = memo(function BoardProgress({ cleared, total, reducedMotion }: BoardProgressProps) {
  const ratio = total > 0 ? Math.min(1, cleared / total) : 0;
  const fill = useSharedValue(ratio);
  useEffect(() => {
    fill.value = reducedMotion ? ratio : withTiming(ratio, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, [ratio, reducedMotion, fill]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel={`${cleared} of ${total} arrows cleared`}>
      <HardShadow size="sm" corner="pill" style={styles.trackWrap}>
        <View style={[styles.track, cornerStyles.pill]}>
          <Animated.View style={[styles.fill, fillStyle]} />
        </View>
      </HardShadow>
      <Text style={styles.count}>
        {cleared}/{total}
      </Text>
    </View>
  );
});

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  trackWrap: { flex: 1 },
  track: {
    height: 16,
    overflow: 'hidden',
    backgroundColor: colors.disabled,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
  },
  fill: { height: '100%', backgroundColor: colors.success, borderRadius: radii.pill },
  count: { ...textStyles.label, fontVariant: ['tabular-nums'], minWidth: 34, textAlign: 'right' },
}));
