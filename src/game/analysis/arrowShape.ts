import type { Direction, Point } from '../../types/geometry';
import { getSegmentDirection } from '../engine/geometry';

/**
 * Shape families from the Level Design Bible. Classified from the turn sequence alone,
 * so mirrored/rotated versions of a shape land in the same family.
 *
 *   straight  0 bends
 *   L         1 bend
 *   U         2 bends, same way    (head comes back alongside its own tail: a 180° reversal)
 *   S         2 bends, opposite    (a step / Z)
 *   zigzag    3+ bends, alternating (staircase)
 *   spiral    3+ bends, all the same way (coils inward)
 *   winding   3+ bends, mixed      (contains both a reversal and a step)
 */
export type ShapeFamily = 'straight' | 'L' | 'U' | 'S' | 'zigzag' | 'spiral' | 'winding';

export type Turn = 'L' | 'R';

export interface ArrowShape {
  family: ShapeFamily;
  /** Cells occupied (path length). */
  cells: number;
  bends: number;
  turns: Turn[];
  /** Pairs of consecutive same-way turns: each is a 180° reversal (a U inside the path). */
  reversals: number;
  /** Segment lengths read the same forwards and backwards. */
  symmetric: boolean;
}

const VEC: Record<Direction, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

function turnBetween(a: Direction, b: Direction): Turn {
  // Screen coords (y down): positive cross product = clockwise = right turn.
  const cross = VEC[a].x * VEC[b].y - VEC[a].y * VEC[b].x;
  return cross > 0 ? 'R' : 'L';
}

export function analyzeArrowShape(points: readonly Point[]): ArrowShape {
  const dirs: Direction[] = [];
  const lengths: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const d = getSegmentDirection(points[i - 1], points[i]);
    if (!d) continue;
    dirs.push(d);
    lengths.push(Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y));
  }
  const turns: Turn[] = [];
  for (let i = 1; i < dirs.length; i++) if (dirs[i] !== dirs[i - 1]) turns.push(turnBetween(dirs[i - 1], dirs[i]));

  let reversals = 0;
  for (let i = 1; i < turns.length; i++) if (turns[i] === turns[i - 1]) reversals++;

  const bends = turns.length;
  const alternating = turns.every((t, i) => i === 0 || t !== turns[i - 1]);
  const uniform = turns.every((t) => t === turns[0]);
  let family: ShapeFamily;
  if (bends === 0) family = 'straight';
  else if (bends === 1) family = 'L';
  else if (bends === 2) family = uniform ? 'U' : 'S';
  else if (alternating) family = 'zigzag';
  else if (uniform) family = 'spiral';
  else family = 'winding';

  const cells = lengths.reduce((s, n) => s + n, 0) + 1;
  const symmetric = lengths.length > 1 && lengths.every((n, i) => n === lengths[lengths.length - 1 - i]);
  return { family, cells, bends, turns, reversals, symmetric };
}
