import type { Point } from '../../types/geometry';
import type { GameState } from '../../types/game';
import { getArrowExitPath } from './getArrowExitPath';
import { buildOccupancy, type OccupancyMap } from './occupancy';
import { cellKey } from './geometry';

export interface ExitCheck {
  canExit: boolean;
  exitPath: Point[];
  blockerId: string | null;
  blockedAt: Point | null;
}

/**
 * Detailed exit check. An arrow's own body counts as blocking —
 * validateLevel rejects levels where that can happen.
 */
export function checkArrowExit(
  state: Pick<GameState, 'arrows' | 'remainingIds' | 'boardWidth' | 'boardHeight'>,
  arrowId: string,
  occupancy: OccupancyMap = buildOccupancy(state),
): ExitCheck {
  const arrow = state.arrows[arrowId];
  const exitPath = getArrowExitPath(arrow, state.boardWidth, state.boardHeight);
  for (const cell of exitPath) {
    const occupant = occupancy.get(cellKey(cell));
    if (occupant !== undefined) {
      return { canExit: false, exitPath, blockerId: occupant, blockedAt: cell };
    }
  }
  return { canExit: true, exitPath, blockerId: null, blockedAt: null };
}

export function canArrowExit(
  state: Pick<GameState, 'arrows' | 'remainingIds' | 'boardWidth' | 'boardHeight'>,
  arrowId: string,
  occupancy?: OccupancyMap,
): boolean {
  return checkArrowExit(state, arrowId, occupancy).canExit;
}
