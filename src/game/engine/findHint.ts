import type { GameState } from '../../types/game';
import { canArrowExit } from './canArrowExit';
import { buildOccupancy } from './occupancy';

/**
 * Removing an arrow can only ever unblock others, never block them.
 * So ANY currently-free arrow is a safe move — no search required.
 */
export function findHint(state: GameState): string | null {
  if (state.status !== 'playing') return null;
  const occupancy = buildOccupancy(state);
  return state.remainingIds.find((id) => canArrowExit(state, id, occupancy)) ?? null;
}

export function applyHint(state: GameState): { state: GameState; arrowId: string | null } {
  const arrowId = findHint(state);
  if (!arrowId) return { state, arrowId: null };
  return { state: { ...state, hintsUsed: state.hintsUsed + 1 }, arrowId };
}
