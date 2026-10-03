import type { GameRules, GameState, TapOutcome } from '../../types/game';
import { DEFAULT_GAME_RULES } from '../../constants/gameConfig';
import { checkArrowExit } from './canArrowExit';
import { checkWin } from './checkWin';

/** The single entry point for player taps. Pure: returns a new state, never mutates. */
export function processArrowTap(
  state: GameState,
  arrowId: string,
  rules: GameRules = DEFAULT_GAME_RULES,
): TapOutcome {
  if (state.status !== 'playing') {
    return { state, result: { kind: 'ignored', arrowId, reason: 'not-playing' } };
  }
  if (!state.arrows[arrowId]) {
    return { state, result: { kind: 'ignored', arrowId, reason: 'unknown-arrow' } };
  }
  if (!state.remainingIds.includes(arrowId)) {
    return { state, result: { kind: 'ignored', arrowId, reason: 'already-removed' } };
  }

  const check = checkArrowExit(state, arrowId);

  if (check.canExit) {
    const remainingIds = state.remainingIds.filter((id) => id !== arrowId);
    const next: GameState = {
      ...state,
      remainingIds,
      removedIds: [...state.removedIds, arrowId],
      moves: state.moves + 1,
      history: [...state.history, { arrowId }],
    };
    next.status = checkWin(next) ? 'won' : 'playing';
    return { state: next, result: { kind: 'exited', arrowId, exitPath: check.exitPath } };
  }

  const lifeLost = rules.blockedTapCostsLife;
  const lives = lifeLost ? Math.max(0, state.lives - 1) : state.lives;
  const next: GameState = {
    ...state,
    lives,
    mistakes: state.mistakes + 1,
    status: lives <= 0 ? 'lost' : 'playing',
  };
  return {
    state: next,
    result: {
      kind: 'blocked',
      arrowId,
      blockerId: check.blockerId as string,
      blockedAt: check.blockedAt as NonNullable<typeof check.blockedAt>,
      lifeLost,
    },
  };
}
