import type { GameState } from '../../types/game';

export function canUndo(state: GameState): boolean {
  return state.status === 'playing' && state.history.length > 0;
}

/** Puts the last removed arrow back. Lives/mistakes are not refunded. */
export function undoMove(state: GameState): GameState {
  if (!canUndo(state)) return state;
  const last = state.history[state.history.length - 1];
  const restored = new Set(state.remainingIds);
  restored.add(last.arrowId);
  return {
    ...state,
    remainingIds: state.arrowOrder.filter((id) => restored.has(id)),
    removedIds: state.removedIds.filter((id) => id !== last.arrowId),
    history: state.history.slice(0, -1),
    undosUsed: state.undosUsed + 1,
  };
}
