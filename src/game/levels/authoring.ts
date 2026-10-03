import type { Direction } from '../../types/geometry';
import type { ArrowColor, ArrowPath } from '../../types/level';

type Coord = readonly [x: number, y: number];

/** Compact authoring helper: arrow('a', 'yellow', 'right', [[0, 0], [2, 0]]). */
export function arrow(id: string, color: ArrowColor, direction: Direction, coords: readonly Coord[]): ArrowPath {
  return { id, color, direction, points: coords.map(([x, y]) => ({ x, y })) };
}
