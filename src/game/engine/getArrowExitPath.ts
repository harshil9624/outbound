import type { Point } from '../../types/geometry';
import type { BoardArrow } from '../../types/game';
import { DIRECTION_VECTORS, isInsideBoard } from './geometry';

/** Cells between the arrowhead and the board edge, nearest first. */
export function getArrowExitPath(
  arrow: Pick<BoardArrow, 'head' | 'direction'>,
  boardWidth: number,
  boardHeight: number,
): Point[] {
  const v = DIRECTION_VECTORS[arrow.direction];
  const path: Point[] = [];
  let x = arrow.head.x + v.x;
  let y = arrow.head.y + v.y;
  while (isInsideBoard({ x, y }, boardWidth, boardHeight)) {
    path.push({ x, y });
    x += v.x;
    y += v.y;
  }
  return path;
}
