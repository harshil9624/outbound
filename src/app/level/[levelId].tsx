import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useLevelSession } from '@/hooks/useLevelSession';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { GameBoard } from '@/components/game/GameBoard';
import { GameControls } from '@/components/game/GameControls';
import { GameOverOverlay } from '@/components/game/GameOverOverlay';
import { LevelHeader } from '@/components/game/LevelHeader';
import { Screen } from '@/components/ui';
import { spacing } from '@/theme';

export default function LevelRoute() {
  const { levelId: rawId } = useLocalSearchParams<{ levelId: string }>();
  const levelId = Number(rawId);
  const router = useRouter();

  const onWin = useCallback(() => router.replace('/win'), [router]);
  const session = useLevelSession(levelId, onWin);

  const coins = usePlayerStore((s) => s.coins);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const goHome = useCallback(() => router.replace('/home'), [router]);

  if (!session.level) return <Redirect href="/home" />;
  const { game } = session;
  if (!game || game.levelId !== levelId) return <Screen />;

  return (
    <Screen>
      <LevelHeader
        levelId={game.levelId}
        difficulty={game.difficulty}
        coins={coins}
        lives={game.lives}
        maxLives={game.maxLives}
        onBack={goHome}
      />
      <View style={styles.board}>
        <GameBoard
          game={game}
          exitingIds={session.exitingIds}
          hintArrowId={session.hintArrowId}
          bump={session.bump}
          reducedMotion={reducedMotion}
          interactive={session.interactive}
          onTapArrow={session.onTapArrow}
          onExitComplete={session.onExitComplete}
        />
      </View>
      <GameControls
        canUndo={session.canUndo}
        canHint={session.canHint}
        onUndo={session.onUndo}
        onHint={session.onHint}
        onRestart={session.onRestart}
      />
      {game.status === 'lost' ? <GameOverOverlay onRetry={session.onRestart} onHome={goHome} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  board: { flex: 1, paddingVertical: spacing.lg },
});
