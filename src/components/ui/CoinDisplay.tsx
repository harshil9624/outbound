import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { CoinIcon } from '@/components/icons';
import { MAX_FONT_SCALE, borderWidths, colors, fonts, fontSizes, spacing, textStyles, themed } from '@/theme';
import { HardShadow, cornerStyles } from './HardShadow';

interface CoinDisplayProps {
  coins: number;
  /** When the balance drops, bump the pill and float a red "-N" off it. */
  showSpend?: boolean;
  /**
   * Coins just earned on this screen: bump the pill and float a green "+N". Passed explicitly
   * (a new token per gain), not read from the balance, so coins earned elsewhere while the screen
   * was hidden don't celebrate when it comes back into view.
   */
  gain?: { amount: number; token: number } | null;
}

export const CoinDisplay = memo(function CoinDisplay({ coins, showSpend = false, gain = null }: CoinDisplayProps) {
  const prev = useRef(coins);
  const [change, setChange] = useState<{ text: string; up: boolean; token: number } | null>(null);
  const bump = useSharedValue(1);
  const float = useSharedValue(1);

  const pop = useCallback(
    (text: string, up: boolean) => {
      setChange((c) => ({ text, up, token: (c?.token ?? 0) + 1 }));
      bump.value = withSequence(withTiming(1.18, { duration: 80 }), withSpring(1, { damping: 7, stiffness: 260 }));
      float.value = 0;
      float.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
    },
    [bump, float],
  );

  useEffect(() => {
    const drop = prev.current - coins;
    prev.current = coins;
    if (showSpend && drop > 0) pop(`-${drop}`, false);
  }, [coins, showSpend, pop]);

  useEffect(() => {
    if (gain && gain.amount > 0) pop(`+${gain.amount}`, true);
  }, [gain, pop]);

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
      {change ? (
        <Animated.Text
          key={change.token}
          pointerEvents="none"
          style={[styles.spent, change.up && styles.gained, spendStyle]}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
        >
          {change.text}
        </Animated.Text>
      ) : null}
    </View>
  );
});

const styles = themed(() => StyleSheet.create({
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
    fontFamily: fonts.display,
    color: colors.danger,
    textShadowColor: colors.artInk,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  gained: { color: colors.success },
}));
