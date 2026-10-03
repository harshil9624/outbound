import type { Point } from '../../types/geometry';
import type { GameState } from '../../types/game';
import { HIT_AMBIGUITY_MARGIN_CELLS, HIT_TOLERANCE_CELLS } from '../../constants/board';
import { cellKey, isInsideBoard } from '../engine/geometry';
import type { OccupancyMap } from '../engine/occupancy';
import { pxToGrid, type BoardLayout } from './boardLayout';

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq));
  const cx = a.x + abx * t;
  const cy = a.y + aby * t;
  return Math.hypot(p.x - cx, p.y - cy);
}

function distanceToPolyline(p: Point, pts: readonly Point[]): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) best = Math.min(best, distanceToSegment(p, pts[i - 1], pts[i]));
  return best;
}

/**
 * Precise arrow picking.
 * 1. The tapped cell belongs to exactly one arrow (cells are exclusive) → that arrow.
 * 2. Empty cell / board padding → nearest arrow centerline, but only if it is within
 *    tolerance AND clearly closer than the runner-up. Ambiguous taps select nothing.
 */
export function hitTestArrow(
  state: Pick<GameState, 'arrows' | 'remainingIds' | 'boardWidth' | 'boardHeight'>,
  occupancy: OccupancyMap,
  layout: BoardLayout,
  px: number,
  py: number,
): string | null {
  const g = pxToGrid(layout, px, py);
  const cell = { x: Math.round(g.x), y: Math.round(g.y) };
  if (isInsideBoard(cell, state.boardWidth, state.boardHeight)) {
    const direct = occupancy.get(cellKey(cell));
    if (direct !== undefined) return direct;
  }

  let bestId: string | null = null;
  let best = Infinity;
  let second = Infinity;
  for (const id of state.remainingIds) {
    const d = distanceToPolyline(g, state.arrows[id].points);
    if (d < best) {
      second = best;
      best = d;
      bestId = id;
    } else if (d < second) {
      second = d;
    }
  }
  if (best > HIT_TOLERANCE_CELLS) return null;
  if (second - best < HIT_AMBIGUITY_MARGIN_CELLS) return null;
  return bestId;
}
