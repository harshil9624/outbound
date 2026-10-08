import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';
import { WIN_ACTIONS_AFTER_COINS_MS, WIN_ACTIONS_DELAY_MS } from '@/constants/animation';
import { chapterOfLevel } from '@/game/journey/progress';
import { winNextStep } from '@/game/session/winNextStep';
import { levelProvider } from '@/game/levels/levelProvider';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { BrutalistButton, Decorations, Screen } from '@/components/ui';
import { NextLevelButton } from '@/components/win/NextLevelButton';
import { RewardDisplay } from '@/components/win/RewardDisplay';
import { StarRating } from '@/components/win/StarRating';
import { Sunburst } from '@/components/win/Sunburst';
import { CONFETTI_TOTAL_MS, Confetti } from '@/components/win/Confetti';
import { WinCard } from '@/components/win/WinCard';
import { WinStats } from '@/components/win/WinStats';
import { RestartIcon, RouteIcon } from '@/components/icons';
import { ReturnTo } from '@/components/nav/ReturnTo';
import { arrowColors, colors, spacing, textStyles, themed } from '@/theme';

/** Below this window height the stars shrink a little so the card and buttons fit on one screen. */
const COMPACT_HEIGHT = 740;

export default function WinRoute() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const result = useGameStore((s) => s.lastResult);
  const player = usePlayerStore(
    useShallow((s) => ({
      coins: s.coins,
      unlockedLevel: s.unlockedLevel,
      completedLevels: s.completedLevels,
      stars: s.stars,
    })),
  );
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const coinsFly = !!result && result.reward.total > 0 && !reducedMotion;

  // One confetti shower: it mounts as the card drops and unmounts once every piece has fallen.
  const [confetti, setConfetti] = useState(!reducedMotion);
  useEffect(() => {
    if (!confetti) return;
    const t = setTimeout(() => setConfetti(false), CONFETTI_TOTAL_MS);
    return () => clearTimeout(t);
  }, [confetti]);

  // Buttons rise in once the celebration has played: after the stars on a replay, after the last
  // coin lands on a first clear (so leaving never cuts the coin animation short). A plain animated
  // style, not a Reanimated `entering` layout animation: on Android's New Architecture, a re-render
  // inside an entering subtree (a button's pressed state) could crash the app with "child already
  // has a parent". They only take taps once visible, so a fast tap can't land on an invisible button.
  const actionsDelay = coinsFly ? WIN_ACTIONS_AFTER_COINS_MS : WIN_ACTIONS_DELAY_MS;
  const rise = useSharedValue(reducedMotion ? 1 : 0);
  const [actionsReady, setActionsReady] = useState(reducedMotion);
  useEffect(() => {
    if (reducedMotion) return;
    rise.value = withDelay(actionsDelay, withSpring(1, { damping: 12, stiffness: 140 }));
    const t = setTimeout(() => setActionsReady(true), actionsDelay);
    return () => clearTimeout(t);
  }, [reducedMotion, rise, actionsDelay]);
  const actionsStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, rise.value * 1.5),
    transform: [{ translateY: (1 - rise.value) * 40 }],
  }));

  // Screen readers: say the result once, since the title is an animated stamp.
  useEffect(() => {
    if (result) AccessibilityInfo.announceForAccessibility(`Level ${result.levelId} cleared. ${result.stars} of 3 stars.`);
  }, [result]);

  // Where "next" goes: on along the route after a first clear, back to the frontier after a replay.
  const next = useMemo(() => (result ? winNextStep(result, player, levelProvider.hasLevel) : null), [result, player]);

  const mascot = useMemo(() => {
    const chapter = result ? chapterOfLevel(result.levelId) : null;
    return chapter ? { animal: chapter.mascot, color: arrowColors[chapter.color] } : { animal: 'lion' as const, color: colors.primary };
  }, [result]);

  // One navigation per visit: a double tap (or two buttons at once) must not fire twice.
  const leaving = useRef(false);
  const leave = useCallback((go: () => void) => {
    if (leaving.current) return;
    leaving.current = true;
    go();
  }, []);

  const target = next?.target ?? null;
  const onNext = useCallback(() => {
    if (target !== null) leave(() => router.replace({ pathname: '/level/[levelId]', params: { levelId: String(target) } }));
  }, [leave, router, target]);
  const onReplay = useCallback(() => {
    if (result) leave(() => router.replace({ pathname: '/level/[levelId]', params: { levelId: String(result.levelId) } }));
  }, [leave, router, result]);
  // The Journey map plays the unlock animation for what was just earned. dismissTo, not replace:
  // the tabs are already under this screen, and replace() would stack a second set of them.
  const onMap = useCallback(() => leave(() => router.dismissTo('/journey')), [leave, router]);

  if (!result) return <ReturnTo href="/home" />;

  const best = player.stars[result.levelId] ?? result.stars;
  const compact = height < COMPACT_HEIGHT;

  return (
    <Screen style={styles.screen}>
      <Sunburst reducedMotion={reducedMotion} />
      <Decorations />
      {/* Scrolls only if it has to (tiny screen, big system font); otherwise centred and still. */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <WinCard levelId={result.levelId} stars={result.stars} mascot={mascot} reducedMotion={reducedMotion}>
          <StarRating stars={result.stars} reducedMotion={reducedMotion} scale={compact ? 0.8 : 1} />
          {best > result.stars ? <Text style={styles.best}>Your best: {'★'.repeat(best)} is kept</Text> : null}
          <WinStats
            moves={result.moves}
            mistakes={result.mistakes}
            hintsUsed={result.hintsUsed}
            hammersUsed={result.hammersUsed}
            reducedMotion={reducedMotion}
          />
          <RewardDisplay reward={result.reward} totalCoins={player.coins} animate={!reducedMotion} />
        </WinCard>
        <Animated.View
          style={[styles.actions, actionsStyle]}
          pointerEvents={actionsReady ? 'auto' : 'none'}
          // Invisible buttons stay out of reach for screen readers too until they've risen in.
          accessibilityElementsHidden={!actionsReady}
          importantForAccessibility={actionsReady ? 'auto' : 'no-hide-descendants'}
        >
          {target !== null ? (
            <NextLevelButton onPress={onNext} label={next?.isNatural ? 'NEXT LEVEL' : `PLAY LEVEL ${target}`} />
          ) : (
            <Text style={styles.endMessage}>{next?.end === 'all-done' ? 'You cleared every level!' : 'New levels coming soon!'}</Text>
          )}
          <View style={styles.secondary}>
            <BrutalistButton label="REPLAY" icon={<RestartIcon size={20} />} onPress={onReplay} color="surface" style={styles.half} />
            <BrutalistButton label="MAP" icon={<RouteIcon size={22} />} onPress={onMap} color="info" style={styles.half} />
          </View>
        </Animated.View>
      </ScrollView>
      {confetti ? <Confetti /> : null}
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: 0 },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    // Room above the card for the mascot and the ribbon that sit on its top edge.
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  contentCompact: { gap: spacing.lg, paddingTop: spacing.xl },
  actions: { alignSelf: 'stretch', gap: spacing.md },
  secondary: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  endMessage: { ...textStyles.subheading, textAlign: 'center' },
  best: { ...textStyles.caption, marginTop: -spacing.sm },
}));
