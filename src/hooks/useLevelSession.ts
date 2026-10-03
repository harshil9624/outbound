import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { playSound } from '@/audio/sounds';
import { HINT_COIN_COST } from '@/constants/gameConfig';
import { canUndo as engineCanUndo } from '@/game/engine/undoMove';
import { levelProvider } from '@/game/levels/levelProvider';
import { buildLevelResult } from '@/game/session/buildLevelResult';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { vibrateBlocked } from '@/utils/haptics';

/**
 * Orchestrates one level session: stores ↔ engine ↔ progression.
 * Screens stay declarative; navigation is injected via `onWin`.
 */
export function useLevelSession(levelId: number, onWin: () => void) {
  const level = useMemo(() => levelProvider.getLevel(levelId), [levelId]);

  const { game, exitingIds, hintArrowId, bump } = useGameStore(
    useShallow((s) => ({ game: s.game, exitingIds: s.exitingIds, hintArrowId: s.hintArrowId, bump: s.bump })),
  );
  const { startLevel, tapArrow, completeExit, undo, showHint, restart, endSession } = useGameStore(
    useShallow((s) => ({
      startLevel: s.startLevel,
      tapArrow: s.tapArrow,
      completeExit: s.completeExit,
      undo: s.undo,
      showHint: s.showHint,
      restart: s.restart,
      endSession: s.endSession,
    })),
  );

  const finalized = useRef(false);

  useEffect(() => {
    if (!level) return;
    finalized.current = false;
    startLevel(level);
    usePlayerStore.getState().setCurrentLevel(level.id);
    return () => endSession();
  }, [level, startLevel, endSession]);

  // Win only after the last exit animation has finished.
  useEffect(() => {
    const s = useGameStore.getState();
    if (finalized.current || !s.game || s.game.levelId !== levelId) return;
    if (s.game.status !== 'won' || s.exitingIds.length > 0) return;
    finalized.current = true;
    const player = usePlayerStore.getState();
    const result = buildLevelResult(s.game, { isFirstClear: !player.completedLevels.includes(levelId) });
    player.applyLevelResult(result, levelProvider.count());
    s.setLastResult(result);
    playSound('win');
    onWin();
  }, [game?.status, exitingIds.length, levelId, onWin]);

  const onTapArrow = useCallback(
    (arrowId: string) => {
      const result = tapArrow(arrowId);
      if (result?.kind === 'exited') playSound('exit');
      if (result?.kind === 'blocked') {
        playSound('blocked');
        vibrateBlocked(useSettingsStore.getState().vibrationEnabled);
      }
    },
    [tapArrow],
  );

  const onHint = useCallback(() => {
    if (HINT_COIN_COST > 0 && !usePlayerStore.getState().spendCoins(HINT_COIN_COST)) return;
    if (showHint()) playSound('hint');
  }, [showHint]);

  const onRestart = useCallback(() => {
    finalized.current = false;
    restart();
  }, [restart]);

  return {
    level,
    game,
    exitingIds,
    hintArrowId,
    bump,
    canUndo: !!game && exitingIds.length === 0 && engineCanUndo(game),
    canHint: !!game && game.status === 'playing',
    interactive: !!game && game.status === 'playing',
    onTapArrow,
    onExitComplete: completeExit,
    onUndo: undo,
    onHint,
    onRestart,
  };
}
