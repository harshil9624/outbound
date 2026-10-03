import type { GameState } from '../../types/game';

export function checkWin(state: Pick<GameState, 'remainingIds'>): boolean {
  return state.remainingIds.length === 0;
}
