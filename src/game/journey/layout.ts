import type { ChapterDef, ChapterLayout, GridPoint, LayoutNode, RouteStyle } from './types';

/** Route columns across the screen. Nodes sit on columns 0–4. */
export const MAP_COLUMNS = 5;
const MAX_X = MAP_COLUMNS - 1;

/**
 * One move of a route pattern: `h` columns sideways (relative to the current sweep direction)
 * or `u` rows up. `node` places a level at the end of the move; otherwise it's just a bend.
 */
interface Move {
  h?: number;
  u?: number;
  node: boolean;
}

const H = (h: number, node = true): Move => ({ h, node });
const U = (u: number, node = true): Move => ({ u, node });

/**
 * Each pattern is one sweep across the map: it starts at one edge column and ends on the
 * opposite one. A sweep must begin or end with an upward move, so the next (mirrored) sweep
 * never runs back along the row it just used.
 * The route therefore never crosses itself and always climbs.
 */
const PATTERNS: Record<RouteStyle, Move[]> = {
  // First Exit: long straight runs with single turns.
  runs: [H(2), H(2), U(1)],
  // The Queue: arrows stacked in a column, waiting their turn.
  queue: [U(1), U(1), H(4)],
  // Crosswalk: S-steps two columns wide.
  cross: [H(2), U(1), H(2), U(1)],
  // Hairpin: long legs joined by tight U-turns.
  hairpin: [H(4), U(1)],
  // Switchback: a one-column staircase.
  stairs: [H(1, false), U(1), H(1, false), U(1), H(1, false), U(1), H(1, false), U(1)],
  // Long Shot: tall straight climbs, then one long crossing.
  longshot: [U(1), U(1), U(1), H(4, false)],
  // The Tangle: doubling back inside each sweep.
  tangle: [H(2), U(1), H(-1, false), U(1), H(3), U(1)],
  // Gridlock: tight turns then a long run.
  gridlock: [U(1), H(1, false), U(1), H(3)],
};

/** Rows between the last regular level and the master gate. */
const MASTER_LIFT = 1.3;
/** The route enters and leaves each zone along column 0, beside the chapter card. */
const ENTRY_COLUMN = 0;

/**
 * Pure and deterministic: the same chapter always produces the same map, and adding levels
 * to a chapter later never moves the ones already placed.
 * Only `existing` levels are placed; the route stops at the last one that exists.
 */
export function layoutChapter(chapter: ChapterDef, exists: (levelId: number) => boolean): ChapterLayout {
  const ids = chapter.levelIds;
  const masterId = ids[ids.length - 1];
  const regular = ids.slice(0, -1);
  const challenge = new Set(chapter.challengeIds ?? []);
  const pattern = PATTERNS[chapter.routeStyle];

  // Walk the pattern, mirroring each sweep, until every regular level has a spot.
  const spots: GridPoint[] = [{ x: 0, y: 0 }];
  const path: GridPoint[] = [{ x: ENTRY_COLUMN, y: -0.9 }, { x: 0, y: 0 }];
  let x = 0;
  let y = 0;
  let dir = 1;
  while (spots.length < regular.length) {
    for (const m of pattern) {
      if (m.h) x += m.h * dir;
      if (m.u) y += m.u;
      path.push({ x, y });
      if (m.node) spots.push({ x, y });
      if (spots.length >= regular.length) break;
    }
    dir = -dir;
  }

  const nodes: LayoutNode[] = [];
  const route: GridPoint[] = [path[0]];
  // Copy the path up to each placed level; stop at the last level that exists.
  let spotIndex = 0;
  let lastPlaced = -1;
  for (let p = 1; p < path.length && spotIndex < regular.length; p++) {
    const pt = path[p];
    route.push(pt);
    const isSpot = spots[spotIndex] && spots[spotIndex].x === pt.x && spots[spotIndex].y === pt.y;
    if (!isSpot) continue;
    const levelId = regular[spotIndex];
    if (!exists(levelId)) break;
    nodes.push({ ...pt, levelId, kind: challenge.has(levelId) ? 'challenge' : 'level', index: spotIndex });
    lastPlaced = route.length;
    spotIndex++;
  }
  route.length = Math.max(lastPlaced, 1);

  let spur: GridPoint[] | null = null;
  const top = nodes.length ? Math.max(...nodes.map((n) => n.y)) : 0;
  // Room above the last tile for the "more levels on the way" note.
  let rows = top + 1.4;
  const allRegularPlaced = spotIndex === regular.length;

  if (allRegularPlaced && exists(masterId)) {
    const last = nodes[nodes.length - 1] ?? { x: 0, y: 0 };
    const my = top + MASTER_LIFT;
    route.push({ x: last.x, y: last.y + 0.65 }, { x: 2, y: last.y + 0.65 }, { x: 2, y: my });
    nodes.push({ x: 2, y: my, levelId: masterId, kind: 'master', index: regular.length });
    // Leave the zone: up, then across to the entry column the next chapter starts on.
    route.push({ x: 2, y: my + 0.6 }, { x: ENTRY_COLUMN, y: my + 0.6 }, { x: ENTRY_COLUMN, y: my + 1.2 });
    rows = my + 1.2;
    if (chapter.bonus && exists(chapter.bonus.levelId)) {
      spur = [{ x: 2.9, y: my }, { x: MAX_X, y: my }];
      nodes.push({ x: MAX_X, y: my, levelId: chapter.bonus.levelId, kind: 'bonus', index: -1 });
    }
  }

  return { chapter, nodes, route: dedupe(route), spur, rows };
}

/** Drop repeated points and collinear middle points so the route renders with clean corners. */
function dedupe(points: GridPoint[]): GridPoint[] {
  const out: GridPoint[] = [];
  for (const p of points) {
    const prev = out[out.length - 1];
    if (prev && prev.x === p.x && prev.y === p.y) continue;
    const before = out[out.length - 2];
    if (prev && before && ((before.x === prev.x && prev.x === p.x) || (before.y === prev.y && prev.y === p.y))) {
      out[out.length - 1] = p;
      continue;
    }
    out.push(p);
  }
  return out;
}
