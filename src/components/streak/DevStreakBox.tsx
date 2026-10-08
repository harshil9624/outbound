import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { BrutalistButton, BrutalistCard } from '@/components/ui';
import { usePlayerStore } from '@/store/playerStore';
import { spacing, textStyles, themed } from '@/theme';
import { addDays } from '@/utils/date';

/**
 * Development builds only: jump the streak into any state to check the screen (flame stages,
 * sleepy, frozen, chests) without waiting real days. Never shipped in release builds.
 */
export function DevStreakBox({ today }: { today: string }) {
  /** A streak of \`count\` days whose last play was \`agoDays\` days before today. */
  const setStreak = (count: number, agoDays: number) => {
    const last = addDays(today, -agoDays);
    const days = Array.from({ length: count }, (_, i) => addDays(last, -i));
    usePlayerStore.setState((s) => ({
      streak: { count, best: Math.max(s.streak.best, count), lastPlayedDay: count > 0 ? last : null, frozenDays: [] },
      playDays: [...new Set([...s.playDays, ...days])].sort(),
    }));
  };
  const scenarios: { label: string; run: () => void }[] = [
    { label: '1 day', run: () => setStreak(1, 0) },
    { label: '3 days', run: () => setStreak(3, 0) },
    { label: '7 days', run: () => setStreak(7, 0) },
    { label: '14 days', run: () => setStreak(14, 0) },
    { label: 'Not played today', run: () => setStreak(4, 1) },
    { label: 'Missed a day', run: () => setStreak(4, 2) },
    { label: 'Sleepy', run: () => setStreak(4, 5) },
  ];
  return (
    <BrutalistCard color="background" contentStyle={styles.card}>
      <Text style={textStyles.subheading}>Test streak</Text>
      <Text style={textStyles.caption}>Developer build only</Text>
      <View style={styles.buttons}>
        {scenarios.map((s) => (
          <BrutalistButton key={s.label} label={s.label} onPress={s.run} color="surface" size="sm" />
        ))}
        <BrutalistButton
          label="Reset chests"
          onPress={() => usePlayerStore.setState({ streakRewardsClaimed: [] })}
          color="primary"
          size="sm"
        />
        <BrutalistButton
          label="Clear streak"
          onPress={() => usePlayerStore.setState({ streak: { count: 0, best: 0, lastPlayedDay: null, frozenDays: [] }, playDays: [], streakRewardsClaimed: [] })}
          color="danger"
          size="sm"
        />
      </View>
    </BrutalistCard>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { gap: spacing.sm },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
}));
