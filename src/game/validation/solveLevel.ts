import type { Level } from '../../types/level';
import { createGameState } from '../engine/createGameState';
import { findHint } from '../engine/findHint';
import { processArrowTap } from '../engine/processArrowTap';

/**
 * Because removals only ever unblock, greedy removal is a complete solver:
 * a level is solvable iff repeatedly removing any free arrow clears the board.
 * Linear-ish time — cheap enough to validate procedurally generated levels later.
 */
export function solveLevel(level: Level): { solvable: boolean; order: string[]; stuckIds: string[] } {
  let state = createGameState(level, { maxLives: 1, blockedTapCostsLife: false });
  const order: string[] = [];
  let next = findHint(state);
  while (next) {
    state = processArrowTap(state, next).state;
    order.push(next);
    next = findHint(state);
  }
  return { solvable: state.remainingIds.length === 0, order, stuckIds: state.remainingIds };
}
