import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { playSound } from '@/audio/sounds';
import { chapterOfLevel, currentLevelId } from '@/game/journey/progress';
import { levelProvider } from '@/game/levels/levelProvider';
import { monthGrid } from '@/game/progression/calendar';
import { STREAK_MILESTONES, claimableMilestones, getActiveStreak } from '@/game/progression/streak';
import type { StarCount } from '@/types';
import { usePlayerStore } from '@/store/playerStore';
import { CoinIcon, FlameIcon, StarIcon } from '@/components/icons';
import { BrutalistButton, BrutalistCard, CoinDisplay, Screen } from '@/components/ui';
import { borderWidths, colors, fontWeights, palette, spacing, textStyles } from '@/theme';
import { toDayKey } from '@/utils/date';
import { withAlpha } from '@/utils/color';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function StreakRoute() {
  const p = usePlayerStore(
    useShallow((s) => ({
      streak: s.streak,
      coins: s.coins,
      playDays: s.playDays,
      claimed: s.streakRewardsClaimed,
      completedLevels: s.completedLevels,
      stars: s.stars,
      unlockedLevel: s.unlockedLevel,
      claim: s.claimStreakReward,
    })),
  );
  const today = toDayKey();
  const count = getActiveStreak(p.streak, today);
  const playedToday = p.streak.lastPlayedDay === today;
  const claimable = claimableMilestones(p.streak.best, p.claimed);

  const message = playedToday
    ? 'Done for today. Come back tomorrow to keep it going!'
    : count > 0
      ? 'Clear a level today to keep your streak alive.'
      : 'Clear a level to start a new streak.';

  const onClaim = (days: number) => {
    if (p.claim(days) > 0) playSound('coin');
  };

  return (
    <Screen edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={textStyles.title}>Streak</Text>
          <CoinDisplay coins={p.coins} showSpend />
        </View>

        <BrutalistCard color="accent" shadow="lg" contentStyle={styles.hero}>
          <View style={styles.heroTop}>
            <FlameIcon size={64} color={palette.yellow} />
            <View>
              <Text style={styles.heroCount}>{count}</Text>
              <Text style={textStyles.label}>{count === 1 ? 'DAY STREAK' : 'DAYS STREAK'}</Text>
            </View>
            <View style={styles.bestChip}>
              <Text style={styles.bestLabel}>BEST</Text>
              <Text style={styles.bestValue}>{p.streak.best}</Text>
            </View>
          </View>
          <Text style={styles.heroMessage}>{message}</Text>
        </BrutalistCard>

        <Milestones best={p.streak.best} claimed={p.claimed} claimable={claimable} onClaim={onClaim} />
        <Calendar playDays={p.playDays} today={today} />
        <Records
          best={p.streak.best}
          daysPlayed={p.playDays.length}
          completed={p.completedLevels.length}
          stars={p.stars}
          unlockedLevel={p.unlockedLevel}
          completedLevels={p.completedLevels}
        />
      </ScrollView>
    </Screen>
  );
}

function Milestones({
  best,
  claimed,
  claimable,
  onClaim,
}: {
  best: number;
  claimed: readonly number[];
  claimable: number[];
  onClaim: (days: number) => void;
}) {
  const next = STREAK_MILESTONES.find((m) => best < m.days);
  return (
    <BrutalistCard contentStyle={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={textStyles.subheading}>Streak rewards</Text>
        {next ? <Text style={styles.sectionHint}>{next.days - best} more {next.days - best === 1 ? 'day' : 'days'} to the next one</Text> : null}
      </View>
      <View style={styles.milestones}>
        {STREAK_MILESTONES.map((m) => {
          const isClaimed = claimed.includes(m.days);
          const canClaim = claimable.includes(m.days);
          const reached = best >= m.days;
          return (
            <View key={m.days} style={styles.milestoneCell}>
              <View style={[styles.milestone, isClaimed && styles.milestoneClaimed, canClaim && styles.milestoneReady, !reached && styles.milestoneLocked]}>
                <Text style={[styles.milestoneDays, !reached && styles.faint]}>{m.days}</Text>
                <Text style={[styles.milestoneUnit, !reached && styles.faint]}>DAYS</Text>
                <View style={styles.milestoneReward}>
                  <CoinIcon size={12} />
                  <Text style={[styles.milestoneCoins, !reached && styles.faint]}>{m.coins}</Text>
                </View>
              </View>
              {canClaim ? (
                <BrutalistButton label="CLAIM" onPress={() => onClaim(m.days)} color="primary" size="sm" sound={null} />
              ) : (
                <Text style={styles.milestoneState}>{isClaimed ? 'CLAIMED' : reached ? '' : 'LOCKED'}</Text>
              )}
            </View>
          );
        })}
      </View>
    </BrutalistCard>
  );
}

function Calendar({ playDays, today }: { playDays: readonly string[]; today: string }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const weeks = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);
  const played = useMemo(() => new Set(playDays), [playDays]);
  const daysThisMonth = weeks.flat().filter((d) => d && played.has(d)).length;
  const isCurrentMonth = cursor.year === now.getFullYear() && cursor.month === now.getMonth();

  const shift = (delta: number) =>
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  return (
    <BrutalistCard contentStyle={styles.section}>
      <View style={styles.sectionHead}>
        <Pressable onPress={() => shift(-1)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Previous month">
          <Text style={styles.monthArrow}>‹</Text>
        </Pressable>
        <View style={styles.monthTitle}>
          <Text style={textStyles.subheading}>
            {MONTHS[cursor.month]} {cursor.year}
          </Text>
          <Text style={styles.sectionHint}>
            {daysThisMonth} {daysThisMonth === 1 ? 'day' : 'days'} played
          </Text>
        </View>
        <Pressable
          onPress={() => shift(1)}
          disabled={isCurrentMonth}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <Text style={[styles.monthArrow, isCurrentMonth && styles.faint]}>›</Text>
        </Pressable>
      </View>
      <View style={styles.week}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((week, w) => (
        <View key={w} style={styles.week}>
          {week.map((day, i) => {
            if (!day) return <View key={i} style={styles.day} />;
            const isPlayed = played.has(day);
            const isToday = day === today;
            const future = day > today;
            return (
              <View
                key={day}
                style={[styles.day, styles.dayCell, isPlayed && styles.dayPlayed, isToday && styles.dayToday, future && styles.dayFuture]}
                accessibilityLabel={`${day}${isPlayed ? ', played' : ''}${isToday ? ', today' : ''}`}
              >
                {isPlayed ? <FlameIcon size={14} color={palette.yellow} /> : <Text style={[styles.dayNum, future && styles.faint]}>{Number(day.slice(8))}</Text>}
              </View>
            );
          })}
        </View>
      ))}
    </BrutalistCard>
  );
}

function Records({
  best,
  daysPlayed,
  completed,
  stars,
  unlockedLevel,
  completedLevels,
}: {
  best: number;
  daysPlayed: number;
  completed: number;
  stars: Record<number, StarCount>;
  unlockedLevel: number;
  completedLevels: number[];
}) {
  const totalStars = Object.values(stars).reduce((s, n) => s + n, 0);
  const perfect = Object.values(stars).filter((n) => n === 3).length;
  const current = currentLevelId({ unlockedLevel, completedLevels, stars }, levelProvider.hasLevel);
  const chapter = current !== null ? chapterOfLevel(current) : null;
  const tiles: { label: string; value: string; icon?: 'flame' | 'star' }[] = [
    { label: 'Best streak', value: String(best), icon: 'flame' },
    { label: 'Days played', value: String(daysPlayed) },
    { label: 'Levels cleared', value: `${completed}/${levelProvider.count()}` },
    { label: 'Stars', value: String(totalStars), icon: 'star' },
    { label: 'Perfect levels', value: String(perfect) },
    { label: 'Chapter', value: chapter ? chapter.title : 'All done' },
  ];
  return (
    <BrutalistCard contentStyle={styles.section}>
      <Text style={textStyles.subheading}>Your records</Text>
      <View style={styles.records}>
        {tiles.map((t) => (
          <View key={t.label} style={styles.record}>
            <View style={styles.recordValueRow}>
              {t.icon === 'flame' ? <FlameIcon size={18} color={palette.yellow} /> : null}
              {t.icon === 'star' ? <StarIcon size={18} /> : null}
              <Text style={styles.recordValue} numberOfLines={1} adjustsFontSizeToFit>
                {t.value}
              </Text>
            </View>
            <Text style={styles.recordLabel}>{t.label}</Text>
          </View>
        ))}
      </View>
    </BrutalistCard>
  );
}

const CELL = 38;

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  content: { gap: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero: { gap: spacing.md },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroCount: { fontSize: 56, lineHeight: 60, fontWeight: fontWeights.heavy, color: colors.ink, fontVariant: ['tabular-nums'] },
  bestChip: {
    marginLeft: 'auto',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
  },
  bestLabel: { ...textStyles.caption, color: colors.ink, letterSpacing: 1 },
  bestValue: { fontSize: 22, fontWeight: fontWeights.heavy, color: colors.ink },
  heroMessage: { ...textStyles.body, fontWeight: fontWeights.bold },
  section: { gap: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  sectionHint: { ...textStyles.caption },
  milestones: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  milestoneCell: { width: '31%', alignItems: 'center', gap: spacing.xs },
  milestone: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  milestoneClaimed: { backgroundColor: colors.success },
  milestoneReady: { backgroundColor: colors.primary },
  milestoneLocked: { borderStyle: 'dashed', borderColor: withAlpha(colors.ink, 0.35), backgroundColor: palette.cream },
  milestoneDays: { fontSize: 24, fontWeight: fontWeights.heavy, color: colors.ink },
  milestoneUnit: { ...textStyles.caption, color: colors.ink, letterSpacing: 1 },
  milestoneReward: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  milestoneCoins: { ...textStyles.caption, color: colors.ink, fontWeight: fontWeights.heavy },
  milestoneState: { ...textStyles.caption, letterSpacing: 1, minHeight: 18 },
  faint: { color: withAlpha(colors.ink, 0.35) },
  monthTitle: { alignItems: 'center' },
  monthArrow: { fontSize: 30, fontWeight: fontWeights.heavy, color: colors.ink, paddingHorizontal: spacing.sm },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  weekday: { width: CELL, textAlign: 'center', ...textStyles.caption, fontWeight: fontWeights.heavy },
  day: { width: CELL, height: CELL },
  dayCell: { alignItems: 'center', justifyContent: 'center', borderWidth: borderWidths.thin, borderColor: palette.sand },
  dayPlayed: { backgroundColor: colors.accent, borderColor: colors.ink },
  dayToday: { borderWidth: borderWidths.thick, borderColor: colors.ink },
  dayFuture: { borderStyle: 'dashed' },
  dayNum: { ...textStyles.caption, color: colors.ink },
  records: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  record: {
    width: '48%',
    flexGrow: 1,
    padding: spacing.md,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
    backgroundColor: palette.cream,
    gap: 2,
  },
  recordValueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  recordValue: { fontSize: 22, fontWeight: fontWeights.heavy, color: colors.ink, flexShrink: 1 },
  recordLabel: { ...textStyles.caption },
});
