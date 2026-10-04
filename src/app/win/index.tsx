import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { WIN_ACTIONS_DELAY_MS, WIN_FX_DELAY_MS } from '@/constants/animation';
import { nextMainLevel } from '@/game/journey/progress';
import { levelProvider } from '@/game/levels/levelProvider';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { BrutalistButton, Decorations, Screen } from '@/components/ui';
import { Confetti } from '@/components/win/Confetti';
import { Fireworks } from '@/components/win/Fireworks';
import { NextLevelButton } from '@/components/win/NextLevelButton';
import { RewardDisplay } from '@/components/win/RewardDisplay';
import { StarRating } from '@/components/win/StarRating';
import { Sunburst } from '@/components/win/Sunburst';
import { WinCard } from '@/components/win/WinCard';
import { spacing, textStyles } from '@/theme';

export default function WinRoute() {
  const router = useRouter();
  const result = useGameStore((s) => s.lastResult);
  const coins = usePlayerStore((s) => s.coins);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  // Let the screen open and the card start dropping before the particle effects mount.
  const [fxReady, setFxReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFxReady(true), WIN_FX_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const nextId = result ? nextMainLevel(result.levelId, levelProvider.hasLevel) : null;
  const hasNext = nextId !== null;

  const onNext = useCallback(() => {
    router.replace({ pathname: '/level/[levelId]', params: { levelId: String(nextId) } });
  }, [router, nextId]);
  // The Journey map plays the unlock animation for what was just earned.
  const onMap = useCallback(() => router.replace('/journey'), [router]);

  if (!result) return <Redirect href="/home" />;

  return (
    <Screen style={styles.screen}>
      <Sunburst reducedMotion={reducedMotion} />
      <Decorations />
      <WinCard levelId={result.levelId} stars={result.stars} reducedMotion={reducedMotion}>
        <StarRating stars={result.stars} reducedMotion={reducedMotion} />
        <RewardDisplay reward={result.reward} totalCoins={coins} animate={!reducedMotion} />
      </WinCard>
      <Animated.View
        style={styles.actions}
        entering={reducedMotion ? undefined : FadeInDown.delay(WIN_ACTIONS_DELAY_MS).springify().damping(12)}
      >
        {hasNext ? <NextLevelButton onPress={onNext} /> : <Text style={textStyles.subheading}>All levels cleared</Text>}
        <BrutalistButton label="MAP" onPress={onMap} color="surface" />
      </Animated.View>
      {reducedMotion || !fxReady ? null : (
        <>
          <Fireworks />
          <Confetti />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center', gap: spacing.xxl },
  actions: { alignItems: 'center', gap: spacing.lg },
});
