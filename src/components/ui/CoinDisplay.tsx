import { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { CoinIcon } from '@/components/icons';
import { borderWidths, colors, fontSizes, fontWeights, spacing, textStyles } from '@/theme';
import { HardShadow, cornerStyles } from './HardShadow';

interface CoinDisplayProps {
  coins: number;
  /** When the balance drops, bump the pill and float a red "-N" off it. */
  showSpend?: boolean;
}

export const CoinDisplay = memo(function CoinDisplay({ coins, showSpend = false }: CoinDisplayProps) {
  const prev = useRef(coins);
  const [spent, setSpent] = useState<{ amount: number; token: number } | null>(null);
  const bump = useSharedValue(1);
  const float = useSharedValue(1);

  useEffect(() => {
    const drop = prev.current - coins;
    prev.current = coins;
    if (!showSpend || drop <= 0) return;
    setSpent((s) => ({ amount: drop, token: (s?.token ?? 0) + 1 }));
    bump.value = withSequence(withTiming(1.18, { duration: 80 }), withSpring(1, { damping: 7, stiffness: 260 }));
    float.value = 0;
    float.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [coins, showSpend, bump, float]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  const spendStyle = useAnimatedStyle(() => ({
    opacity: float.value < 1 ? 1 - float.value * float.value : 0,
    transform: [{ translateY: float.value * 34 }],
  }));

  return (
    <View>
      <Animated.View style={pillStyle}>
        <HardShadow size="sm" corner="sm">
          <View style={[styles.pill, cornerStyles.sm]} accessibilityLabel={`${coins} coins`}>
            <CoinIcon size={22} />
            <Text style={textStyles.number}>{coins}</Text>
          </View>
        </HardShadow>
      </Animated.View>
      {spent ? (
        <Animated.Text key={spent.token} pointerEvents="none" style={[styles.spent, spendStyle]}>
          -{spent.amount}
        </Animated.Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
  },
  spent: {
    position: 'absolute',
    top: '100%',
    right: spacing.sm,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.heavy,
    color: colors.danger,
    textShadowColor: colors.ink,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
});
