import type { CellKey, Direction, Point } from '../../types/geometry';

export const DIRECTION_VECTORS: Readonly<Record<Direction, Point>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function cellKey(p: Point): CellKey {
  return `${p.x},${p.y}`;
}

export function isInsideBoard(p: Point, width: number, height: number): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < width && p.y < height;
}

/** Direction of an orthogonal segment, or null for zero-length / diagonal segments. */
export function getSegmentDirection(from: Point, to: Point): Direction | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if ((dx === 0 && dy === 0) || (dx !== 0 && dy !== 0)) return null;
  if (dx > 0) return 'right';
  if (dx < 0) return 'left';
  return dy > 0 ? 'down' : 'up';
}

export function getHead(points: readonly Point[]): Point {
  return points[points.length - 1];
}

export function getFinalSegmentDirection(points: readonly Point[]): Direction | null {
  if (points.length < 2) return null;
  return getSegmentDirection(points[points.length - 2], points[points.length - 1]);
}

/** Every cell an arrow occupies, tail → head, from its vertex list. Throws on invalid paths. */
export function expandPathToCells(points: readonly Point[]): Point[] {
  if (points.length < 2) throw new Error('An arrow needs at least two points.');
  const cells: Point[] = [{ x: points[0].x, y: points[0].y }];
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    const dir = getSegmentDirection(from, to);
    if (!dir) throw new Error(`Segment ${i} (${cellKey(from)} → ${cellKey(to)}) must be horizontal or vertical.`);
    const v = DIRECTION_VECTORS[dir];
    let x = from.x;
    let y = from.y;
    while (x !== to.x || y !== to.y) {
      x += v.x;
      y += v.y;
      cells.push({ x, y });
    }
  }
  return cells;
}
