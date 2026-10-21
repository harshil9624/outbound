import { memo, useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import type { BoostKind, MilestoneReward } from '@/types';
import { Text } from '@/components/ui/Text';
import { playSound } from '@/audio/sounds';
import { BulbIcon, CoinIcon, HammerIcon, HeartIcon } from '@/components/icons';
import { HardShadow } from '@/components/ui/HardShadow';
import { Chest } from '@/components/streak/Chest';
import { boostList } from '@/game/progression/milestones';
import { borderWidths, colors, palette, spacing, textStyles, themed } from '@/theme';

const LABELS: Record<BoostKind, [string, string]> = { hint: ['Hint', 'Hints'], hammer: ['Hammer', 'Hammers'], life: ['Heart', 'Hearts'] };
const ICONS: Record<BoostKind, ReactNode> = {
  hint: <BulbIcon size={18} />,
  hammer: <HammerIcon size={18} color={palette.blue} />,
  life: <HeartIcon size={18} />,
};

/**
 * The bonus chest on every 10th level (economy/config LEVEL_CHEST): the chest pops
 * in after the stars, with a chip per reward. One plain animated style (no layout animation).
 */
export const MilestoneCard = memo(function MilestoneCard({
  milestone,
  delayMs,
  reducedMotion,
}: {
  milestone: MilestoneReward;
  delayMs: number;
  reducedMotion: boolean;
}) {
  const pop = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    pop.value = withDelay(delayMs, withSequence(withTiming(1.12, { duration: 200 }), withSpring(1, { damping: 8, stiffness: 200 })));
    const t = setTimeout(() => playSound('coin'), delayMs + 120);
    return () => clearTimeout(t);
  }, [delayMs, reducedMotion, pop]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, pop.value * 2), transform: [{ scale: pop.value }] }));

  const items = boostList(milestone.boosts);
  return (
    <Animated.View style={[styles.wrap, style]} accessible accessibilityLabel={describe(milestone)}>
      <HardShadow size="md">
        <View style={styles.card}>
          <Chest state="open" size={64} />
          <View style={styles.text}>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              Bonus chest!
            </Text>
            <View style={styles.chips}>
              {milestone.coins > 0 ? (
                <View style={styles.chip}>
                  <CoinIcon size={18} />
                  <Text style={styles.chipText}>+{milestone.coins}</Text>
                </View>
              ) : null}
              {items.map(({ kind, count }) => (
                <View key={kind} style={styles.chip}>
                  {ICONS[kind]}
                  <Text style={styles.chipText}>
                    {count} {LABELS[kind][count === 1 ? 0 : 1]}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.note}>Free boosts are used before coins.</Text>
          </View>
        </View>
      </HardShadow>
    </Animated.View>
  );
});

function describe(m: MilestoneReward): string {
  const parts = [m.coins > 0 ? `${m.coins} coins` : null, ...boostList(m.boosts).map(({ kind, count }) => `${count} free ${LABELS[kind][count === 1 ? 0 : 1].toLowerCase()}`)];
  return `Bonus chest: ${parts.filter(Boolean).join(', ')}`;
}

const styles = themed(() =>
  StyleSheet.create({
    wrap: { alignSelf: 'stretch' },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: borderWidths.thick,
      borderColor: colors.ink,
    },
    text: { flex: 1, minWidth: 0, gap: spacing.xs },
    title: { ...textStyles.subheading },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 2,
      paddingHorizontal: spacing.sm,
      borderWidth: borderWidths.thin,
      borderColor: colors.ink,
      backgroundColor: colors.paper,
    },
    chipText: { ...textStyles.caption, color: colors.ink, fontWeight: '900' },
    note: { ...textStyles.caption },
  }),
);
