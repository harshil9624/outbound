import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';
import { Text } from '@/components/ui/Text';
import { playSound } from '@/audio/sounds';
import {
  STREAK_MILESTONES,
  freezeReady,
  frozenDayKeys,
  getActiveStreak,
  streakStatus,
  weekOf,
  type StreakStatus,
} from '@/game/progression/streak';
import { currentLevelId } from '@/game/journey/progress';
import { levelProvider } from '@/game/levels/levelProvider';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { CoinIcon, FlameIcon, SnowflakeIcon } from '@/components/icons';
import { BrutalistButton, BrutalistCard, CoinDisplay, Screen } from '@/components/ui';
import { Chest, type ChestState } from '@/components/streak/Chest';
import { DevStreakBox } from '@/components/streak/DevStreakBox';
import { FLAME_STAGES, FlameBuddy, flameStage, type FlameMood } from '@/components/streak/FlameBuddy';
import { borderWidths, colors, fontWeights, getThemeMode, palette, radii, spacing, textStyles, themed } from '@/theme';
import { useToday } from '@/hooks/useToday';
import { withAlpha } from '@/utils/color';

/**
 * Built for young players: a flame buddy that grows with the streak, this week as seven bubbles,
 * and treasure chests a day or two apart. Missing one day is forgiven by a weekly freeze, and a
 * lapsed streak is a "sleepy" flame, never a big zero.
 */
export default function StreakRoute() {
  const p = usePlayerStore(
    useShallow((s) => ({
      streak: s.streak,
      coins: s.coins,
      playDays: s.playDays,
      claimed: s.streakRewardsClaimed,
      claim: s.claimStreakReward,
      unlockedLevel: s.unlockedLevel,
      completedLevels: s.completedLevels,
      stars: s.stars,
    })),
  );
  const router = useRouter();
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  // Re-read on focus and on returning to the app: the tab stays mounted overnight.
  const { day: today } = useToday();
  const count = getActiveStreak(p.streak, today);
  const status = streakStatus(p.streak, today);
  const frozen = useMemo(() => frozenDayKeys(p.streak, today), [p.streak, today]);

  // The coin pill celebrates only coins collected here, not ones earned while the tab was hidden.
  const [gain, setGain] = useState<{ amount: number; token: number } | null>(null);
  const claim = p.claim;
  const onClaim = useCallback(
    (days: number) => {
      const paid = claim(days);
      if (paid <= 0) return false;
      playSound('coin');
      setGain((g) => ({ amount: paid, token: (g?.token ?? 0) + 1 }));
      return true;
    },
    [claim],
  );

  // Straight into the next level, like Home's PLAY. One level per tap; re-armed when the tab is back in view.
  const currentId = currentLevelId(p, levelProvider.hasLevel);
  const opening = useRef(false);
  useFocusEffect(
    useCallback(() => {
      opening.current = false;
    }, []),
  );
  const onPlay = useCallback(() => {
    if (currentId === null) {
      router.navigate('/journey');
      return;
    }
    if (opening.current) return;
    opening.current = true;
    router.push({ pathname: '/level/[levelId]', params: { levelId: String(currentId) } });
  }, [router, currentId]);
  const playLabel = currentId === null ? 'OPEN MAP' : status === 'done' ? 'PLAY MORE' : 'PLAY NOW';

  return (
    <Screen edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={textStyles.title}>Streak</Text>
          <CoinDisplay coins={p.coins} gain={gain} />
        </View>

        <Hero
          count={count}
          best={p.streak.best}
          status={status}
          freeze={freezeReady(p.streak, today)}
          reducedMotion={reducedMotion}
          playLabel={playLabel}
          onPlay={onPlay}
        />
        <GrowPath count={count} />
        <WeekStrip playDays={p.playDays} frozen={frozen} today={today} />
        <ChestTrail best={p.streak.best} count={count} claimed={p.claimed} onClaim={onClaim} reducedMotion={reducedMotion} />
        {__DEV__ ? <DevStreakBox today={today} /> : null}
      </ScrollView>
    </Screen>
  );
}

const MOOD: Record<StreakStatus, FlameMood> = { done: 'happy', waiting: 'happy', frozen: 'cold', none: 'sleepy' };

/** What the flame says when it's tapped: short, cheerful words for early readers. */
const CHEERS: Record<FlameMood, readonly string[]> = {
  happy: ['You’re on fire!', 'High five!', 'Let’s solve puzzles!', 'Woohoo!', 'You’re a star!', 'That tickles!'],
  cold: ['Brrr! Warm me up!', 'So chilly! Play a level?', 'Brrr… one level please!'],
  sleepy: ['Zzz… play to wake me!', 'Yawn… one level please?', 'Zzz… I dream of puzzles!'],
};
const CHEER_MS = 2200;

const Hero = memo(function Hero({
  count,
  best,
  status,
  freeze,
  reducedMotion,
  playLabel,
  onPlay,
}: {
  count: number;
  best: number;
  status: StreakStatus;
  freeze: boolean;
  reducedMotion: boolean;
  playLabel: string;
  onPlay: () => void;
}) {
  const mood = MOOD[status];
  // Tapping the flame: it hops and says something. The "Tap me!" tag goes once it's been tapped.
  const [cheer, setCheer] = useState<{ text: string; token: number } | null>(null);
  const [petted, setPetted] = useState(false);
  const taps = useRef(0);
  useEffect(() => {
    if (!cheer) return;
    const t = setTimeout(() => setCheer(null), CHEER_MS);
    return () => clearTimeout(t);
  }, [cheer]);
  const hop = useSharedValue(0);
  const onPet = useCallback(() => {
    const list = CHEERS[mood];
    const text = list[taps.current++ % list.length];
    setCheer((c) => ({ text, token: (c?.token ?? 0) + 1 }));
    setPetted(true);
    playSound('tap');
    if (!reducedMotion) {
      hop.value = withSequence(withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 6, stiffness: 240 }));
    }
  }, [mood, reducedMotion, hop]);
  const hopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hop.value * -18 }, { rotate: `${hop.value * -6}deg` }],
  }));

  // Short words for early readers.
  const title =
    status === 'none' ? (best > 0 ? 'Your flame is sleepy' : 'Light your flame!') : `${count} ${count === 1 ? 'day' : 'days'} in a row!`;
  const message =
    status === 'done'
      ? 'Done today! See you tomorrow.'
      : status === 'waiting'
        ? 'Play today to grow your flame!'
        : status === 'frozen'
          ? 'A freeze saved your flame! Play today.'
          : best > 0
            ? 'Clear a level to wake it up!'
            : 'Clear a level to start your streak.';
  return (
    <BrutalistCard color="surface" shadow="lg" contentStyle={styles.hero}>
      <Pressable
        onPress={onPet}
        style={styles.flameStage}
        accessibilityRole="button"
        accessibilityLabel="Your flame buddy"
        accessibilityHint="Tap to say hi"
      >
        {/* A soft disc behind the flame gives the hero a focal point (light card: cream; dark: lighter navy). */}
        <View style={styles.flameGlow} />
        <Animated.View style={hopStyle} collapsable={false}>
          <FlameBuddy count={count} mood={mood} size={124} reducedMotion={reducedMotion} />
        </Animated.View>
        {!petted ? (
          <View style={styles.tapTag} pointerEvents="none">
            <Text style={styles.tapTagText} maxFontSizeMultiplier={1.25}>
              Tap me!
            </Text>
          </View>
        ) : null}
      </Pressable>
      <Text style={styles.heroTitle} accessibilityRole="header">
        {title}
      </Text>
      {/* The cheer takes the message's place for a moment, so the card never changes height. */}
      <Text style={[styles.heroMessage, cheer && styles.heroCheer]} accessibilityLiveRegion="polite">
        {cheer ? `“${cheer.text}”` : message}
      </Text>
      <View style={styles.pills}>
        <View
          style={[styles.pill, styles.pillFreeze, !freeze && styles.pillOff]}
          accessibilityLabel={freeze ? 'Freeze ready: if you miss a day, it saves your streak' : 'Freeze used this week'}
        >
          <SnowflakeIcon size={16} />
          <Text style={styles.pillText}>{freeze ? 'Freeze ready' : 'Freeze used'}</Text>
        </View>
        {best > 0 ? (
          <View style={styles.pill} accessibilityLabel={`Best streak ${best} days`}>
            <FlameIcon size={16} color={palette.orange} />
            <Text style={styles.pillText}>Best {best}</Text>
          </View>
        ) : null}
      </View>
      <BrutalistButton label={playLabel} onPress={onPlay} color="success" size="md" style={styles.playButton} />
    </BrutalistCard>
  );
});

/**
 * The flame's growth path: Spark, Flame, Blaze, King. The stage the flame is at now is ringed,
 * stages still ahead are dim and sleepy, and one line says how many days to the next.
 * The little flames are still (no flicker), so this card costs nothing while the tab is open.
 */
const GrowPath = memo(function GrowPath({ count }: { count: number }) {
  const now = flameStage(count);
  const next = FLAME_STAGES.find((st) => count < st.days);
  const toGo = next ? next.days - count : 0;
  const hint = !next
    ? 'Your flame is the King! Keep it burning.'
    : count <= 0
      ? `Play today to light a ${next.name}!`
      : `${toGo} more ${toGo === 1 ? 'day' : 'days'} to grow into a ${next.name}!`;
  return (
    <BrutalistCard contentStyle={styles.section}>
      <Text style={textStyles.subheading}>Grow your flame</Text>
      <View style={styles.grow}>
        <View style={styles.growLine} />
        {FLAME_STAGES.map((st) => {
          const reached = count >= st.days;
          return (
            <View
              key={st.stage}
              style={styles.growStep}
              accessible
              accessibilityLabel={`${st.name}, day ${st.days}${now === st.stage ? ', your flame now' : reached ? ', reached' : ''}`}
            >
              <View style={[styles.growDisc, now === st.stage && styles.growDiscNow, !reached && styles.growLocked]}>
                <FlameBuddy count={st.days} mood={reached ? 'happy' : 'sleepy'} size={40} reducedMotion />
              </View>
              <Text style={[styles.growName, !reached && styles.faint]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {st.name}
              </Text>
              <Text style={[styles.growDays, !reached && styles.faint]} numberOfLines={1}>
                Day {st.days}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.growHint}>{hint}</Text>
    </BrutalistCard>
  );
});

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** This week as seven bubbles: a flame for each day played, ice where a freeze saved the day. */
const WeekStrip = memo(function WeekStrip({ playDays, frozen, today }: { playDays: readonly string[]; frozen: readonly string[]; today: string }) {
  const days = useMemo(() => weekOf(today), [today]);
  const played = useMemo(() => new Set(playDays), [playDays]);
  const iced = useMemo(() => new Set(frozen), [frozen]);
  return (
    <BrutalistCard contentStyle={styles.section}>
      <Text style={textStyles.subheading}>This week</Text>
      <View style={styles.week}>
        {days.map((day, i) => {
          const isToday = day === today;
          const isPlayed = played.has(day);
          const isIced = !isPlayed && iced.has(day);
          const future = day > today;
          return (
            <View key={day} style={styles.dayCol}>
              <Text style={[styles.weekday, isToday && styles.weekdayToday]}>{WEEKDAYS[i]}</Text>
              <View
                style={[
                  styles.bubble,
                  isPlayed && styles.bubblePlayed,
                  isIced && styles.bubbleIced,
                  isToday && !isPlayed && styles.bubbleToday,
                  future && styles.bubbleFuture,
                ]}
                accessibilityLabel={`${isToday ? 'Today' : day}${isPlayed ? ', played' : isIced ? ', saved by a freeze' : ''}`}
              >
                {isPlayed ? <FlameIcon size={18} color={palette.yellow} /> : isIced ? <SnowflakeIcon size={16} /> : null}
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.freezeNote}>
        <SnowflakeIcon size={14} />
        <Text style={styles.freezeNoteText}>Miss a day? A freeze saves your flame once a week.</Text>
      </View>
    </BrutalistCard>
  );
});

/**
 * Treasure chests along a short trail. The next one is big: it wiggles when it's ready, and a tap
 * bursts it open with coins. The trail below shows all of them, so the next goal is always in view.
 */
const ChestTrail = memo(function ChestTrail({
  best,
  count,
  claimed,
  onClaim,
  reducedMotion,
}: {
  best: number;
  count: number;
  claimed: readonly number[];
  onClaim: (days: number) => boolean;
  reducedMotion: boolean;
}) {
  const stateOf = useCallback(
    (days: number): ChestState => (claimed.includes(days) ? 'open' : best >= days ? 'ready' : 'locked'),
    [claimed, best],
  );
  // A chest just opened stays in the big spot for a moment, so its burst plays where it was tapped.
  const [opened, setOpened] = useState<{ days: number; token: number } | null>(null);
  useEffect(() => {
    if (!opened) return;
    const t = setTimeout(() => setOpened(null), 1700);
    return () => clearTimeout(t);
  }, [opened]);
  const open = useCallback(
    (days: number) => {
      if (onClaim(days)) setOpened((o) => ({ days, token: (o?.token ?? 0) + 1 }));
    },
    [onClaim],
  );

  const nextUnclaimed = STREAK_MILESTONES.find((m) => !claimed.includes(m.days));
  const featured = opened ? STREAK_MILESTONES.find((m) => m.days === opened.days) : nextUnclaimed;
  const featuredState = featured ? stateOf(featured.days) : 'open';
  const toGo = featured ? Math.max(1, featured.days - count) : 0;

  return (
    <BrutalistCard contentStyle={styles.section}>
      <Text style={textStyles.subheading}>Treasure chests</Text>
      {featured ? (
        <View style={styles.featured}>
          <ChestButton
            days={featured.days}
            state={featuredState}
            size={96}
            burstToken={opened?.days === featured.days ? opened.token : 0}
            reducedMotion={reducedMotion}
            onOpen={open}
          />
          <View style={styles.featuredText}>
            {featuredState === 'open' ? (
              <Text style={styles.featuredTitle}>Hooray!</Text>
            ) : featuredState === 'ready' ? (
              <>
                <Text style={styles.featuredTitle}>Chest ready!</Text>
                <Text style={styles.featuredHint}>Tap it to open</Text>
              </>
            ) : (
              <>
                <Text style={styles.featuredTitle}>
                  {toGo} more {toGo === 1 ? 'day' : 'days'}!
                </Text>
                <Text style={styles.featuredHint}>to open this chest</Text>
              </>
            )}
            <View style={styles.inside}>
              <CoinIcon size={16} />
              <Text style={styles.insideText}>{featured.coins} inside</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.featured}>
          <Chest state="open" size={96} />
          <View style={styles.featuredText}>
            <Text style={styles.featuredTitle}>All chests open!</Text>
            <Text style={styles.featuredHint}>You’re a streak star.</Text>
          </View>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trail}>
        <View style={styles.trailLine} />
        {STREAK_MILESTONES.map((m) => {
          const state = stateOf(m.days);
          const isNext = m.days === nextUnclaimed?.days;
          return (
            <Pressable
              key={m.days}
              onPress={state === 'ready' ? () => open(m.days) : undefined}
              disabled={state !== 'ready'}
              style={styles.stop}
              accessibilityRole={state === 'ready' ? 'button' : undefined}
              accessibilityLabel={`${m.days} days chest, ${m.coins} coins, ${state === 'open' ? 'opened' : state === 'ready' ? 'ready to open' : 'locked'}`}
            >
              <View style={[styles.stopChest, isNext && styles.stopNext]}>
                <Chest state={state} size={40} />
              </View>
              <Text style={[styles.stopLabel, state === 'locked' && styles.faint]}>{m.days}d</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </BrutalistCard>
  );
});

const BURST = 7;

/** The big chest: wiggles while ready (only while the tab is in view), pops and sprays coins when opened. */
const ChestButton = memo(function ChestButton({
  days,
  state,
  size,
  burstToken,
  reducedMotion,
  onOpen,
}: {
  days: number;
  state: ChestState;
  size: number;
  burstToken: number;
  reducedMotion: boolean;
  onOpen: (days: number) => void;
}) {
  const wiggle = useSharedValue(0);
  useFocusEffect(
    useCallback(() => {
      if (state !== 'ready' || reducedMotion) return;
      wiggle.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 90 }),
          withTiming(-1, { duration: 120 }),
          withTiming(0.6, { duration: 100 }),
          withTiming(0, { duration: 90 }),
          withTiming(0, { duration: 1100 }),
        ),
        -1,
      );
      return () => {
        cancelAnimation(wiggle);
        wiggle.value = 0;
      };
    }, [state, reducedMotion, wiggle]),
  );

  const pop = useSharedValue(1);
  const burst = useSharedValue(1);
  const lastBurst = useRef(burstToken);
  useEffect(() => {
    if (burstToken === lastBurst.current) return;
    lastBurst.current = burstToken;
    if (!burstToken || reducedMotion) return;
    pop.value = withSequence(withTiming(1.22, { duration: 120 }), withSpring(1, { damping: 7, stiffness: 220 }));
    burst.value = 0;
    burst.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [burstToken, reducedMotion, pop, burst]);

  const chestStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wiggle.value * 7}deg` }, { scale: pop.value }],
  }));

  return (
    <Pressable
      onPress={state === 'ready' ? () => onOpen(days) : undefined}
      disabled={state !== 'ready'}
      accessibilityRole={state === 'ready' ? 'button' : undefined}
      accessibilityLabel={state === 'ready' ? 'Open the chest' : undefined}
      style={{ width: size, height: size }}
      hitSlop={8}
    >
      <Animated.View style={chestStyle}>
        <Chest state={state} size={size} />
      </Animated.View>
      {burstToken && !reducedMotion
        ? Array.from({ length: BURST }, (_, i) => <BurstCoin key={`${burstToken}-${i}`} index={i} progress={burst} size={size} />)
        : null}
    </Pressable>
  );
});

function BurstCoin({ index, progress, size }: { index: number; progress: SharedValue<number>; size: number }) {
  // Fanned out upward, each at its own angle and distance.
  const angle = -Math.PI / 2 + ((index - (BURST - 1) / 2) / (BURST - 1)) * Math.PI * 0.9;
  const dist = size * (0.55 + (index % 3) * 0.12);
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: t < 1 ? 1 - t * t : 0,
      transform: [
        { translateX: Math.cos(angle) * dist * t },
        { translateY: Math.sin(angle) * dist * t + t * t * size * 0.25 },
        { scale: 0.6 + t * 0.4 },
      ],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.burstCoin, { left: size / 2 - 11, top: size * 0.35 }, style]}>
      <CoinIcon size={22} />
    </Animated.View>
  );
}

const BUBBLE = 36;

const styles = themed(() => StyleSheet.create({
  screen: { paddingBottom: 0 },
  content: { gap: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  hero: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.lg },
  // Fixed room for a full-grown flame, so the card doesn't change height as the flame grows.
  flameStage: { width: 156, height: 124 * 1.2, justifyContent: 'flex-end', alignItems: 'center' },
  // A little sign leaning on the flame, so kids know it can be tapped.
  tapTag: {
    position: 'absolute',
    top: 2,
    right: -30,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: borderWidths.thin,
    borderColor: colors.artInk,
    backgroundColor: palette.yellow,
    transform: [{ rotate: '8deg' }],
  },
  tapTagText: { ...textStyles.caption, color: colors.artInk, fontWeight: fontWeights.heavy },
  flameGlow: { position: 'absolute', bottom: -10, width: 156, height: 156, borderRadius: 78, backgroundColor: colors.paper },
  heroTitle: { ...textStyles.heading, textAlign: 'center', marginTop: spacing.sm },
  heroMessage: { ...textStyles.body, fontWeight: fontWeights.bold, textAlign: 'center' },
  heroCheer: { color: colors.ink, fontWeight: fontWeights.heavy },
  playButton: { alignSelf: 'stretch', marginTop: spacing.md },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xxs + 1,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: borderWidths.thin,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
  },
  pillFreeze: { backgroundColor: withAlpha('#5BB8FF', 0.18) },
  pillOff: { opacity: 0.55 },
  pillText: { ...textStyles.caption, color: colors.ink, fontWeight: fontWeights.heavy },

  section: { gap: spacing.md },

  grow: { flexDirection: 'row', justifyContent: 'space-between' },
  // Joins the four discs through their centres (discs are 60 tall).
  growLine: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: 30,
    borderTopWidth: borderWidths.regular,
    borderStyle: 'dashed',
    borderColor: withAlpha(colors.ink, 0.3),
  },
  growStep: { flex: 1, minWidth: 0, alignItems: 'center', gap: 2 },
  growDisc: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidths.regular,
    borderColor: withAlpha(colors.ink, 0.25),
    backgroundColor: colors.paper,
  },
  growDiscNow:
    getThemeMode() === 'dark'
      ? { borderColor: palette.yellow, backgroundColor: withAlpha(palette.yellow, 0.12) }
      : { borderColor: colors.ink, backgroundColor: withAlpha(palette.yellow, 0.35) },
  growLocked: { opacity: 0.45 },
  growName: { ...textStyles.label, color: colors.ink, marginTop: spacing.xxs },
  growDays: { ...textStyles.caption, fontWeight: fontWeights.heavy },
  growHint: { ...textStyles.body, fontWeight: fontWeights.bold, textAlign: 'center' },
  week: { flexDirection: 'row', justifyContent: 'space-between', gap: 2 },
  dayCol: { flex: 1, maxWidth: BUBBLE + 6, alignItems: 'center', gap: spacing.xs },
  weekday: { ...textStyles.caption, fontWeight: fontWeights.heavy },
  weekdayToday: { color: colors.ink },
  bubble: {
    width: '100%',
    maxWidth: BUBBLE,
    aspectRatio: 1,
    borderRadius: BUBBLE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidths.regular,
    borderColor: withAlpha(colors.ink, 0.25),
    backgroundColor: colors.paper,
  },
  bubblePlayed: { backgroundColor: palette.orange, borderColor: colors.ink },
  bubbleIced: { backgroundColor: '#CFEBFF', borderColor: colors.ink },
  // A 35% yellow wash is soft on cream but olive on navy: dark mode outlines in yellow over a faint wash.
  bubbleToday:
    getThemeMode() === 'dark'
      ? { borderColor: palette.yellow, borderStyle: 'dashed', backgroundColor: withAlpha(palette.yellow, 0.12) }
      : { borderColor: colors.ink, borderStyle: 'dashed', backgroundColor: withAlpha(palette.yellow, 0.35) },
  bubbleFuture: { borderStyle: 'dashed', opacity: 0.6 },
  freezeNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  freezeNoteText: { ...textStyles.caption, flexShrink: 1 },

  featured: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featuredText: { flex: 1, minWidth: 0, gap: 2 },
  featuredTitle: { ...textStyles.subheading, fontSize: 22 },
  featuredHint: { ...textStyles.body, color: colors.inkMuted },
  inside: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  insideText: { ...textStyles.label },
  burstCoin: { position: 'absolute' },

  trail: { alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.xs },
  trailLine: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: spacing.xs + 26,
    borderTopWidth: borderWidths.regular,
    borderStyle: 'dashed',
    borderColor: withAlpha(colors.ink, 0.3),
  },
  stop: { alignItems: 'center', gap: 2, width: 52 },
  stopChest: { padding: 4, borderRadius: 30, borderWidth: borderWidths.regular, borderColor: 'transparent' },
  stopNext:
    getThemeMode() === 'dark'
      ? { borderColor: palette.yellow, backgroundColor: withAlpha(palette.yellow, 0.12) }
      : { borderColor: colors.ink, backgroundColor: withAlpha(palette.yellow, 0.35) },
  stopLabel: { ...textStyles.caption, color: colors.ink, fontWeight: fontWeights.heavy },
  faint: { color: withAlpha(colors.ink, 0.4) },
}));
