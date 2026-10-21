import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';
import type { StarCount } from '@/types';
import { WIN_ACTIONS_DELAY_MS, WIN_STAR_DELAY_MS, WIN_STAR_GAP_MS } from '@/constants/animation';
import { winNextStep } from '@/game/session/winNextStep';
import { levelProvider } from '@/game/levels/levelProvider';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { BrutalistButton, Screen } from '@/components/ui';
import { CoinReward } from '@/components/win/CoinReward';
import { MilestoneCard } from '@/components/win/MilestoneCard';
import { WinInfo } from '@/components/win/WinInfo';
import { NextLevelButton } from '@/components/win/NextLevelButton';
import { StarRating } from '@/components/win/StarRating';
import { CONFETTI_TOTAL_MS, Confetti } from '@/components/win/Confetti';
import { RestartIcon, RouteIcon } from '@/components/icons';
import { ReturnTo } from '@/components/nav/ReturnTo';
import { colors, palette, spacing, textStyles, themed } from '@/theme';

const PRAISE: Record<StarCount, string> = { 3: 'PERFECT!', 2: 'GREAT!', 1: 'NICE!' };
/** Below this window height the stars shrink a little so everything fits on one screen. */
const COMPACT_HEIGHT = 700;
/** The praise word stamps in once the last star has landed. */
const PRAISE_DELAY_MS = WIN_STAR_DELAY_MS + 3 * WIN_STAR_GAP_MS;

/**
 * Clean and focused: stars, one praise word, the coins earned, and one big NEXT button.
 * Replay and Map sit underneath as small buttons. Confetti falls once behind it all.
 */
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

  // One confetti shower: it mounts with the screen and unmounts once every piece has fallen.
  const [confetti, setConfetti] = useState(!reducedMotion);
  useEffect(() => {
    if (!confetti) return;
    const t = setTimeout(() => setConfetti(false), CONFETTI_TOTAL_MS);
    return () => clearTimeout(t);
  }, [confetti]);

  // The praise word stamps down after the stars.
  const stamp = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    stamp.value = withDelay(PRAISE_DELAY_MS, withSpring(1, { damping: 10, stiffness: 220 }));
  }, [reducedMotion, stamp]);
  const praiseStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, stamp.value * 2),
    transform: [{ scale: 2.2 - 1.2 * stamp.value }, { rotate: `${(1 - stamp.value) * -8 - 2}deg` }],
  }));

  // Buttons rise in once the celebration has played. A plain animated style, not a Reanimated
  // `entering` layout animation: on Android's New Architecture, a re-render inside an entering
  // subtree (a button's pressed state) could crash the app with "child already has a parent".
  // They only take taps once visible, so a fast tap can't land on an invisible button.
  const rise = useSharedValue(reducedMotion ? 1 : 0);
  const [actionsReady, setActionsReady] = useState(reducedMotion);
  useEffect(() => {
    if (reducedMotion) return;
    rise.value = withDelay(WIN_ACTIONS_DELAY_MS, withSpring(1, { damping: 12, stiffness: 140 }));
    const t = setTimeout(() => setActionsReady(true), WIN_ACTIONS_DELAY_MS);
    return () => clearTimeout(t);
  }, [reducedMotion, rise]);
  const actionsStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, rise.value * 1.5),
    transform: [{ translateY: (1 - rise.value) * 40 }],
  }));

  // Screen readers: say the result once, since the praise is an animated stamp.
  useEffect(() => {
    if (result) AccessibilityInfo.announceForAccessibility(`Level ${result.levelId} cleared. ${result.stars} of 3 stars.`);
  }, [result]);

  // Where "next" goes: on along the route after a first clear, back to the frontier after a replay.
  const next = useMemo(() => (result ? winNextStep(result, player, levelProvider.hasLevel) : null), [result, player]);

  // One navigation per visit: a double tap (or two buttons at once) must not fire twice.
  const leaving = useRef(false);
  // Leaving happens in two steps. First the tapped button releases and the confetti stops (a small
  // update); two frames later the next screen loads. Doing it all in one update (button release +
  // tearing down this screen + building a 40-arrow level) is the frame that crashed on Android.
  const leave = useCallback((go: () => void) => {
    if (leaving.current) return;
    leaving.current = true;
    setConfetti(false);
    requestAnimationFrame(() => requestAnimationFrame(go));
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
      {/* Scrolls only if it has to (tiny screen, big system font); otherwise centred and still. */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>LEVEL {result.levelId} CLEARED</Text>
          <StarRating stars={result.stars} reducedMotion={reducedMotion} scale={compact ? 0.9 : 1.1} />
          <Animated.Text style={[styles.praise, praiseStyle]} maxFontSizeMultiplier={1.2}>
            {PRAISE[result.stars]}
          </Animated.Text>
          {best > result.stars ? <Text style={styles.best}>Your best: {'★'.repeat(best)} is kept</Text> : null}
          {/* Level coins plus today's streak bonus; a chest shows its own coins below. */}
          <CoinReward amount={result.reward.total + result.dailyBonus} animate={!reducedMotion} />
          {/* Master levels open a chapter chest; challenge levels give a perk (first clears only). */}
          {result.milestone ? (
            <MilestoneCard milestone={result.milestone} delayMs={PRAISE_DELAY_MS + 400} reducedMotion={reducedMotion} />
          ) : null}
          <WinInfo
            levelId={result.levelId}
            moves={result.moves}
            mistakes={result.mistakes}
            help={result.hintsUsed + result.hammersUsed}
            completedLevels={player.completedLevels}
          />
        </View>

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
            <BrutalistButton label="REPLAY" icon={<RestartIcon size={22} />} onPress={onReplay} color="surface" size="md" style={styles.half} />
            <BrutalistButton label="MAP" icon={<RouteIcon size={24} />} onPress={onMap} color="info" size="md" style={styles.half} />
          </View>
        </Animated.View>
      </ScrollView>
      {confetti ? <Confetti /> : null}
    </Screen>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    screen: { paddingHorizontal: 0, paddingBottom: 0 },
    scroll: { flex: 1 },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      gap: spacing.xxl * 1.5,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    contentCompact: { gap: spacing.xl },
    hero: { alignItems: 'center', gap: spacing.lg },
    eyebrow: { ...textStyles.label, letterSpacing: 2, color: colors.inkMuted },
    praise: {
      ...textStyles.display,
      fontSize: 52,
      color: palette.yellow,
      textShadowColor: palette.black,
      textShadowOffset: { width: 4, height: 4 },
      // Android drops the shadow entirely at radius 0.
      textShadowRadius: 1,
    },
    best: { ...textStyles.caption, marginTop: -spacing.sm },
    actions: { alignSelf: 'stretch', gap: spacing.lg },
    // Two equal halves, edge to edge with NEXT LEVEL above.
    secondary: { flexDirection: 'row', gap: spacing.md },
    half: { flex: 1 },
    endMessage: { ...textStyles.subheading, textAlign: 'center' },
  }),
);
