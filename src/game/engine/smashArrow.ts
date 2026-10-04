import type { GameState } from '../../types/game';
import { checkWin } from './checkWin';

/**
 * Hammer boost: removes an arrow even if it is blocked. Pure.
 * Returns null when the smash isn't allowed (not playing, or arrow already gone).
 */
export function smashArrow(state: GameState, arrowId: string): GameState | null {
  if (state.status !== 'playing' || !state.remainingIds.includes(arrowId)) return null;
  const next: GameState = {
    ...state,
    remainingIds: state.remainingIds.filter((id) => id !== arrowId),
    removedIds: [...state.removedIds, arrowId],
    moves: state.moves + 1,
    hammersUsed: state.hammersUsed + 1,
    history: [...state.history, { arrowId }],
  };
  next.status = checkWin(next) ? 'won' : 'playing';
  return next;
}
