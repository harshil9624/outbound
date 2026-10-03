import { StyleSheet, Text, View } from 'react-native';
import { getActiveStreak, getStreakDays } from '@/game/progression/streak';
import { usePlayerStore } from '@/store/playerStore';
import { FlameIcon } from '@/components/icons';
import { BrutalistCard, Decorations, Screen } from '@/components/ui';
import { borderWidths, colors, spacing, textStyles } from '@/theme';
import { toDayKey, weekdayOf } from '@/utils/date';

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function StreakRoute() {
  const streak = usePlayerStore((s) => s.streak);
  const today = toDayKey();
  const count = getActiveStreak(streak, today);
  const days = getStreakDays(streak, today);
  const playedToday = streak.lastPlayedDay === today;

  const message = playedToday
    ? 'Done for today. Come back tomorrow!'
    : count > 0
      ? 'Clear a level today to keep it alive!'
      : 'Clear a level to start a streak.';

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Decorations />
      <View style={styles.content}>
        <Text style={textStyles.title}>Daily Streak</Text>

        <BrutalistCard color="accent" shadow="lg" style={styles.hero} contentStyle={styles.heroFace}>
          <FlameIcon size={72} color={colors.primary} />
          <Text style={styles.count}>{count}</Text>
          <Text style={textStyles.label}>{count === 1 ? 'DAY STREAK' : 'DAYS STREAK'}</Text>
          <Text style={styles.best}>Best: {streak.best}</Text>
        </BrutalistCard>

        <BrutalistCard contentStyle={styles.weekFace}>
          <Text style={textStyles.label}>LAST 7 DAYS</Text>
          <View style={styles.week}>
            {days.map(({ day, played }) => (
              <View key={day} style={styles.day}>
                <View style={[styles.dot, played && styles.dotPlayed, day === today && styles.dotToday]}>
                  {played ? <FlameIcon size={18} color={colors.primary} /> : null}
                </View>
                <Text style={textStyles.caption}>{WEEKDAY_LETTERS[weekdayOf(day)]}</Text>
              </View>
            ))}
          </View>
          <Text style={textStyles.body}>{message}</Text>
        </BrutalistCard>
      </View>
    </Screen>
  );
}

const DOT = 34;

const styles = StyleSheet.create({
  content: { flex: 1, gap: spacing.xl, paddingTop: spacing.md },
  hero: { alignSelf: 'center', transform: [{ rotate: '-2deg' }] },
  heroFace: { alignItems: 'center', paddingHorizontal: spacing.xxl, gap: spacing.xs },
  count: { ...textStyles.display, fontSize: 72 },
  best: { ...textStyles.caption, color: colors.ink },
  weekFace: { gap: spacing.md },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: spacing.xs },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidths.thin,
    borderColor: colors.ink,
    backgroundColor: colors.background,
  },
  dotPlayed: { backgroundColor: colors.accent },
  dotToday: { borderWidth: borderWidths.thick },
});
