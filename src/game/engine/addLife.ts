import type { GameState } from '../../types/game';

/** A heart can be bought while playing below full health, or to continue after running out. */
export function canAddLife(state: GameState): boolean {
  return (state.status === 'playing' || state.status === 'lost') && state.lives < state.maxLives;
}

/** +1 heart. Revives a lost game back to 'playing'. Pure; no-op when not allowed. */
export function addLife(state: GameState): GameState {
  if (!canAddLife(state)) return state;
  return { ...state, lives: state.lives + 1, status: 'playing' };
}
