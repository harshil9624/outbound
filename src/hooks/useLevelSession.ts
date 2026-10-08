import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { playSound } from '@/audio/sounds';
import { HAMMER_IMPACT_MS } from '@/constants/animation';
import { BOOST_COSTS } from '@/constants/gameConfig';
import { canAddLife } from '@/game/engine/addLife';
import { findHint } from '@/game/engine/findHint';
import { COACH_TEXT, TUTORIAL_LEVEL, coachPoints, nextCoachStep, type CoachStep } from '@/game/session/coach';
import { nextMainLevel } from '@/game/journey/progress';
import { levelProvider } from '@/game/levels/levelProvider';
import { buildLevelResult } from '@/game/session/buildLevelResult';
import { BOOST_FAILURE_TEXT, buyHeart, buyHint, hammerArrow, toggleHammer, type BoostResult } from '@/store/boostActions';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { vibrateBlocked } from '@/utils/haptics';

/**
 * Orchestrates one level session: stores ↔ engine ↔ progression.
 * Screens stay declarative; navigation is injected via `onWin`.
 * Boosts live in store/boostActions; this hook adds sounds and the "why not" notice.
 */
export function useLevelSession(levelId: number, onWin: () => void) {
  const level = useMemo(() => levelProvider.getLevel(levelId), [levelId]);

  const { game, exitingIds, smashingIds, hintArrowId, bump, hammerArmed } = useGameStore(
    useShallow((s) => ({
      game: s.game,
      exitingIds: s.exitingIds,
      smashingIds: s.smashingIds,
      hintArrowId: s.hintArrowId,
      bump: s.bump,
      hammerArmed: s.hammerArmed,
    })),
  );
  const { startLevel, tapArrow, completeExit, restart, endSession } = useGameStore(
    useShallow((s) => ({
      startLevel: s.startLevel,
      tapArrow: s.tapArrow,
      completeExit: s.completeExit,
      restart: s.restart,
      endSession: s.endSession,
    })),
  );
  const coins = usePlayerStore((s) => s.coins);

  const finalized = useRef(false);

  // The guided first level, until it has been finished once (see game/session/coach).
  const coachOn = useMemo(() => levelId === TUTORIAL_LEVEL && !usePlayerStore.getState().tutorialDone, [levelId]);
  const [coachStep, setCoachStep] = useState<CoachStep>('start');
  const coachExits = useRef(0);
  const resetCoach = useCallback(() => {
    coachExits.current = 0;
    setCoachStep('start');
  }, []);

  useEffect(() => {
    if (!level) return;
    finalized.current = false;
    resetCoach();
    startLevel(level);
    usePlayerStore.getState().setCurrentLevel(level.id);
    return () => endSession();
  }, [level, startLevel, endSession, resetCoach]);

  // Win only after the last exit animation has finished.
  useEffect(() => {
    const s = useGameStore.getState();
    if (finalized.current || !s.game || s.game.levelId !== levelId) return;
    if (s.game.status !== 'won' || s.exitingIds.length > 0) return;
    finalized.current = true;
    const player = usePlayerStore.getState();
    const result = buildLevelResult(s.game, { isFirstClear: !player.completedLevels.includes(levelId) });
    player.applyLevelResult(result, nextMainLevel(levelId, levelProvider.hasLevel));
    s.setLastResult(result);
    if (coachOn) player.markTutorialDone();
    playSound('win');
    onWin();
  }, [game?.status, exitingIds.length, levelId, onWin, coachOn]);

  /** Short message shown when a boost can't be used. Token re-triggers the same text. */
  const [notice, setNotice] = useState<{ text: string; token: number } | null>(null);
  const explain = useCallback((r: BoostResult) => {
    if (!r.ok) setNotice((n) => ({ text: BOOST_FAILURE_TEXT[r.reason], token: (n?.token ?? 0) + 1 }));
    return r.ok;
  }, []);

  const onTapArrow = useCallback(
    (arrowId: string) => {
      if (useGameStore.getState().hammerArmed) {
        if (explain(hammerArrow(arrowId))) {
          // The thud lands when the flying hammer hits (see HammerStrike).
          const delay = useSettingsStore.getState().reducedMotion ? 0 : HAMMER_IMPACT_MS;
          setTimeout(() => playSound('smash'), delay);
        }
        return;
      }
      const result = tapArrow(arrowId);
      if (result?.kind === 'exited') playSound('exit');
      if (result?.kind === 'blocked') {
        playSound('blocked');
        vibrateBlocked(useSettingsStore.getState().vibrationEnabled);
      }
      if (coachOn && (result?.kind === 'exited' || result?.kind === 'blocked')) {
        if (result.kind === 'exited') coachExits.current += 1;
        const kind = result.kind;
        setCoachStep((step) => nextCoachStep(step, kind, coachExits.current));
      }
    },
    [tapArrow, explain, coachOn],
  );

  const onHint = useCallback(() => {
    if (explain(buyHint())) playSound('hint');
  }, [explain]);

  const onHammer = useCallback(() => {
    if (explain(toggleHammer())) playSound('tap');
  }, [explain]);

  const onBuyLife = useCallback(() => {
    if (explain(buyHeart())) playSound('life');
  }, [explain]);

  const onRestart = useCallback(() => {
    finalized.current = false;
    resetCoach();
    restart();
  }, [restart, resetCoach]);

  const playing = !!game && game.status === 'playing';
  const hintVisible = !!game && !!hintArrowId && game.remainingIds.includes(hintArrowId);

  // What the coach says, and the arrow its hand taps: any arrow that can escape right now.
  const coachTarget = useMemo(
    () => (coachOn && playing && coachPoints(coachStep) && game ? findHint(game) : null),
    [coachOn, playing, coachStep, game],
  );
  const coach = useMemo(
    () => (coachOn && playing ? { text: COACH_TEXT[coachStep], targetId: hammerArmed ? null : coachTarget } : null),
    [coachOn, playing, coachStep, coachTarget, hammerArmed],
  );

  return {
    level,
    game,
    coins,
    exitingIds,
    smashingIds,
    hintArrowId,
    bump,
    hammerArmed,
    // Visual only: buttons stay tappable and explain themselves via `notice`.
    canHint: playing && !hintVisible && coins >= BOOST_COSTS.hint,
    canHammer: playing && (hammerArmed || coins >= BOOST_COSTS.hammer),
    canBuyLife: !!game && canAddLife(game) && coins >= BOOST_COSTS.life,
    notice,
    coach,
    interactive: playing,
    onTapArrow,
    onExitComplete: completeExit,
    onHint,
    onHammer,
    onBuyLife,
    onRestart,
  };
}
