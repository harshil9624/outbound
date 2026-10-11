import { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { playSound } from '@/audio/sounds';
import { CoinIcon } from '@/components/icons';
import { HardShadow, cornerStyles } from '@/components/ui/HardShadow';
import { WIN_COUNT_UP_DELAY_MS, WIN_COUNT_UP_MS } from '@/constants/animation';
import { borderWidths, colors, fontSizes, fontWeights, spacing, textStyles, themed } from '@/theme';

/** About 15 updates a second instead of one per frame, so counting doesn't load the JS thread. */
const STEP_MS = 66;

/** Eases from 0 to `target` once the stars have landed; jumps straight there when disabled. */
function useCountUp(target: number, enabled: boolean): number {
  const [value, setValue] = useState(enabled ? 0 : target);
  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    let frame = 0;
    let start = 0;
    let shownAt = 0;
    const tick = (now: number) => {
      start ||= now;
      const p = Math.min(1, (now - start) / WIN_COUNT_UP_MS);
      if (p === 1 || now - shownAt >= STEP_MS) {
        shownAt = now;
        setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      }
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    const timer = setTimeout(() => (frame = requestAnimationFrame(tick)), WIN_COUNT_UP_DELAY_MS);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [target, enabled]);
  return value;
}

/** One line: the coins this win paid, counting up with a "ching" when it lands. Replays say so. */
export const CoinReward = memo(function CoinReward({ amount, animate }: { amount: number; animate: boolean }) {
  const counting = animate && amount > 0;
  const value = useCountUp(amount, counting);
  useEffect(() => {
    if (!counting) return;
    const t = setTimeout(() => playSound('coin'), WIN_COUNT_UP_DELAY_MS + WIN_COUNT_UP_MS);
    return () => clearTimeout(t);
  }, [counting]);

  if (amount <= 0) {
    return <Text style={styles.replay}>Replay · no coins this time</Text>;
  }
  return (
    <HardShadow size="sm" corner="pill">
      <View style={[styles.pill, cornerStyles.pill]} accessibilityLabel={`${amount} coins earned`}>
        <CoinIcon size={30} />
        <Text style={styles.amount}>+{value}</Text>
      </View>
    </HardShadow>
  );
});

const styles = themed(() =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      paddingLeft: spacing.sm,
      paddingRight: spacing.lg,
      backgroundColor: colors.surface,
      borderWidth: borderWidths.regular,
      borderColor: colors.ink,
    },
    amount: { fontSize: fontSizes.xl, fontWeight: fontWeights.heavy, color: colors.ink, fontVariant: ['tabular-nums'] },
    replay: { ...textStyles.caption, color: colors.inkMuted },
  }),
);
