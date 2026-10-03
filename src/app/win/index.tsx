import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { levelProvider } from '@/game/levels/levelProvider';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { BrutalistButton, Decorations, Screen } from '@/components/ui';
import { NextLevelButton } from '@/components/win/NextLevelButton';
import { RewardDisplay } from '@/components/win/RewardDisplay';
import { StarRating } from '@/components/win/StarRating';
import { WinCard } from '@/components/win/WinCard';
import { spacing, textStyles } from '@/theme';

export default function WinRoute() {
  const router = useRouter();
  const result = useGameStore((s) => s.lastResult);
  const coins = usePlayerStore((s) => s.coins);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  const nextId = result ? result.levelId + 1 : 0;
  const hasNext = levelProvider.hasLevel(nextId);

  const onNext = useCallback(() => {
    router.replace({ pathname: '/level/[levelId]', params: { levelId: String(nextId) } });
  }, [router, nextId]);
  const onHome = useCallback(() => router.replace('/home'), [router]);

  if (!result) return <Redirect href="/home" />;

  return (
    <Screen style={styles.screen}>
      <Decorations />
      <WinCard levelId={result.levelId}>
        <StarRating stars={result.stars} reducedMotion={reducedMotion} />
        <RewardDisplay reward={result.reward} totalCoins={coins} />
      </WinCard>
      <View style={styles.actions}>
        {hasNext ? <NextLevelButton onPress={onNext} /> : <Text style={textStyles.subheading}>All levels cleared</Text>}
        <BrutalistButton label="HOME" onPress={onHome} color="surface" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center', gap: spacing.xxl },
  actions: { alignItems: 'center', gap: spacing.lg },
});
