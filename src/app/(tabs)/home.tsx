import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { APP_NAME, APP_TAGLINE } from '@/constants/app';
import { getActiveStreak } from '@/game/progression/streak';
import { levelProvider } from '@/game/levels/levelProvider';
import { usePlayerStore } from '@/store/playerStore';
import {
  BrutalistButton,
  BrutalistCard,
  CoinDisplay,
  DailyChallengeWidget,
  Decorations,
  Screen,
  StreakWidget,
} from '@/components/ui';
import { spacing, textStyles } from '@/theme';
import { toDayKey } from '@/utils/date';

export default function HomeRoute() {
  const router = useRouter();
  const { coins, currentLevel, unlockedLevel, streak } = usePlayerStore(
    useShallow((s) => ({ coins: s.coins, currentLevel: s.currentLevel, unlockedLevel: s.unlockedLevel, streak: s.streak })),
  );

  const playLevel = Math.min(Math.max(1, Math.min(currentLevel, unlockedLevel)), levelProvider.count());

  const onPlay = useCallback(() => {
    router.push({ pathname: '/level/[levelId]', params: { levelId: String(playLevel) } });
  }, [router, playLevel]);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Decorations />
      <View style={styles.topBar}>
        <CoinDisplay coins={coins} />
      </View>

      <View style={styles.hero}>
        <BrutalistCard color="primary" shadow="lg" style={styles.logoCard} contentStyle={styles.logoFace}>
          <Text style={textStyles.display}>{APP_NAME}</Text>
        </BrutalistCard>
        <Text style={textStyles.label}>{APP_TAGLINE}</Text>
      </View>

      <View style={styles.play}>
        <BrutalistButton label="PLAY" onPress={onPlay} color="success" size="lg" accessibilityLabel={`Play level ${playLevel}`} />
        <Text style={textStyles.label}>Level {playLevel}</Text>
      </View>

      <View style={styles.widgets}>
        <StreakWidget count={getActiveStreak(streak, toDayKey())} best={streak.best} />
        <DailyChallengeWidget />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: spacing.md },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  logoCard: { transform: [{ rotate: '-3deg' }] },
  logoFace: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  play: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  widgets: { flexDirection: 'row', gap: spacing.lg },
});
