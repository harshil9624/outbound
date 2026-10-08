import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLevelSession } from '@/hooks/useLevelSession';
import { useSettingsStore } from '@/store/settingsStore';
import { GameBoard } from '@/components/game/GameBoard';
import { GameControls } from '@/components/game/GameControls';
import { GameOverOverlay } from '@/components/game/GameOverOverlay';
import { LeaveOverlay } from '@/components/game/LeaveOverlay';
import { useGameStore } from '@/store/gameStore';
import { LevelHeader } from '@/components/game/LevelHeader';
import { Screen } from '@/components/ui';
import { ReturnTo } from '@/components/nav/ReturnTo';
import { spacing, themed } from '@/theme';

export default function LevelRoute() {
  const { levelId: rawId } = useLocalSearchParams<{ levelId: string }>();
  const levelId = Number(rawId);
  const router = useRouter();

  const onWin = useCallback(() => router.replace('/win'), [router]);
  const session = useLevelSession(levelId, onWin);

  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  // Back to the tabs already under this screen; replace() would stack a second set of tabs.
  const goHome = useCallback(() => router.dismissTo('/home'), [router]);

  // "Leave this level?" before any way out (back arrow, Android back, Home) throws away a board
  // with progress on it. Winning, losing, and an untouched board leave without asking.
  const navigation = useNavigation();
  const [askLeave, setAskLeave] = useState(false);
  const asking = useRef(false);
  const leaving = useRef(false);
  const pending = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        const g = useGameStore.getState().game;
        if (leaving.current || !g || g.status !== 'playing' || g.removedIds.length === 0) return;
        e.preventDefault();
        if (asking.current) {
          // Back again while asking: the same as "Keep playing".
          asking.current = false;
          setAskLeave(false);
          return;
        }
        pending.current = e.data.action;
        asking.current = true;
        setAskLeave(true);
      }),
    [navigation],
  );
  const stay = useCallback(() => {
    asking.current = false;
    pending.current = null;
    setAskLeave(false);
  }, []);
  const leave = useCallback(() => {
    const action = pending.current;
    asking.current = false;
    pending.current = null;
    setAskLeave(false);
    if (!action) return;
    leaving.current = true;
    navigation.dispatch(action);
  }, [navigation]);

  if (!session.level) return <ReturnTo href="/home" />;
  const { game } = session;
  if (!game || game.levelId !== levelId) return <Screen />;

  return (
    <Screen>
      <LevelHeader
        levelId={game.levelId}
        difficulty={game.difficulty}
        coins={session.coins}
        lives={game.lives}
        maxLives={game.maxLives}
        cleared={game.removedIds.length}
        total={game.arrowOrder.length}
        reducedMotion={reducedMotion}
        onBack={goHome}
      />
      <View style={styles.board}>
        <GameBoard
          game={game}
          exitingIds={session.exitingIds}
          smashingIds={session.smashingIds}
          hintArrowId={session.hintArrowId}
          bump={session.bump}
          hammerArmed={session.hammerArmed}
          coach={session.coach}
          reducedMotion={reducedMotion}
          interactive={session.interactive}
          onTapArrow={session.onTapArrow}
          onExitComplete={session.onExitComplete}
        />
      </View>
      <GameControls
        canHint={session.canHint}
        canHammer={session.canHammer}
        canBuyLife={session.canBuyLife}
        hammerArmed={session.hammerArmed}
        notice={session.notice}
        onHint={session.onHint}
        onHammer={session.onHammer}
        onBuyLife={session.onBuyLife}
        onRestart={session.onRestart}
      />
      {game.status === 'lost' ? (
        <GameOverOverlay
          coins={session.coins}
          reducedMotion={reducedMotion}
          canBuyLife={session.canBuyLife}
          onBuyLife={session.onBuyLife}
          onRetry={session.onRestart}
          onHome={goHome}
        />
      ) : null}
      {askLeave && game.status === 'playing' ? <LeaveOverlay onStay={stay} onLeave={leave} /> : null}
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  board: { flex: 1, paddingVertical: spacing.lg },
}));
