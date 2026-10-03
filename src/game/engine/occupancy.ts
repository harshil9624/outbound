import type { CellKey } from '../../types/geometry';
import type { GameState } from '../../types/game';
import { cellKey } from './geometry';

export type OccupancyMap = ReadonlyMap<CellKey, string>;

/** Cell → arrowId for every arrow still on the board. Cells are exclusive per arrow. */
export function buildOccupancy(state: Pick<GameState, 'arrows' | 'remainingIds'>): OccupancyMap {
  const map = new Map<CellKey, string>();
  for (const id of state.remainingIds) {
    for (const cell of state.arrows[id].cells) map.set(cellKey(cell), id);
  }
  return map;
}
