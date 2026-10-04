import type { Difficulty, Level } from '../../types/level';
import { cellKey, expandPathToCells, getHead } from '../engine/geometry';
import { getArrowExitPath } from '../engine/getArrowExitPath';
import { analyzeArrowShape, type ArrowShape, type ShapeFamily } from './arrowShape';

/**
 * Measurable puzzle difficulty. See LEVEL_DESIGN_BIBLE.md §4 for what each number means
 * and how to read it.
 *
 * Core fact this relies on: an arrow can leave exactly when every arrow sitting in its exit
 * lane has left. Lanes never change and arrows only ever leave, so "A waits for B" is a
 * fixed relation decided by the starting layout. The whole puzzle is that dependency graph.
 */

export interface ArrowMetrics {
  id: string;
  shape: ArrowShape;
  /** Cells from the head to the board edge. */
  laneLength: number;
  /** Arrows in the exit lane, nearest first. All must leave before this one can. */
  blockers: string[];
  /** Cells from the head to the first blocker (1 = touching), or null if free at start. */
  firstBlockerDistance: number | null;
  /** Arrows whose lane this arrow sits in. */
  blocks: string[];
  /** Removal layer: 0 = free at start, n = waits on a chain n arrows deep. */
  layer: number;
  /** At the start, looks free but isn't: empty cell(s) right ahead, blocker further down the lane. */
  tempting: boolean;
  /**
   * Blockers met far from their own head (≥ 3 cells back along their body): you have to
   * trace the other arrow's whole shape to see who is in the way.
   */
  hiddenBlockers: string[];
  complexity: number;
}

export interface LevelMetrics {
  levelId: number;
  tagged: Difficulty;
  arrows: ArrowMetrics[];
  arrowCount: number;
  /** Occupied cells / board cells. */
  density: number;
  /** Number of removal layers (longest dependency chain + 1). */
  layers: number;
  freeAtStart: number;
  /** log10 of how many removal orders solve the level (null when too many arrows to count). */
  log10Orders: number | null;
  /** 0 = any order works, 1 = exactly one order. */
  forcedness: number | null;
  /** Expected share of arrows that are blocked when the player looks for a move, over random valid play. */
  trapRate: number;
  /**
   * Of the blocked arrows during play, the share that LOOK free: the cell in front of the head is
   * empty and the blocker is further down the lane. The main "you must think" signal.
   */
  deception: number;
  /**
   * Of the free arrows during play, the share free simply because the head touches the edge.
   * Those are readable at a glance, so a high value makes "when to move" obvious.
   */
  edgeTell: number;
  /** Fewest free arrows at any point, averaged over random valid play. */
  narrowestChoice: number;
  tempting: number;
  hiddenDependencies: number;
  meanBends: number;
  shapeMix: Partial<Record<ShapeFamily, number>>;
  /** Same-coloured arrows that touch: makes WHAT an arrow is unclear (always bad). */
  sameColourContacts: [string, string][];
  score: number;
  tier: Tier;
}

export type Tier = 'easy' | 'medium' | 'hard' | 'expert';

/** Upper score bounds per tier (exclusive). Calibrate against playtest mistakes per level. */
export const TIER_BOUNDS: Record<Exclude<Tier, 'expert'>, number> = { easy: 25, medium: 45, hard: 65 };

/**
 * Weights of the 0–100 level score. Path length and board density are deliberately absent:
 * long arrows are not hard, and a packed board makes every blocker obvious (it touches the head).
 */
export const SCORE_WEIGHTS = {
  depth: 22,
  trap: 18,
  deception: 18,
  hidden: 10,
  shape: 10,
  /** Applied to (1 - edgeTell). */
  noEdgeTell: 8,
  forced: 8,
  size: 6,
} as const;

export function tierFor(score: number): Tier {
  if (score < TIER_BOUNDS.easy) return 'easy';
  if (score < TIER_BOUNDS.medium) return 'medium';
  if (score < TIER_BOUNDS.hard) return 'hard';
  return 'expert';
}

/** Deterministic PRNG so the analysis prints the same numbers every run. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAX_EXACT_ORDERS = 20;
const PLAYOUTS = 300;

export function analyzeLevel(level: Level): LevelMetrics {
  const { boardWidth: w, boardHeight: h } = level;
  const ids = level.arrows.map((a) => a.id);
  const n = ids.length;

  // Cell ownership, and each cell's distance back from its arrow's head.
  const owner = new Map<string, { id: string; fromHead: number }>();
  let occupied = 0;
  for (const a of level.arrows) {
    const cells = expandPathToCells(a.points);
    occupied += cells.length;
    cells.forEach((c, i) => owner.set(cellKey(c), { id: a.id, fromHead: cells.length - 1 - i }));
  }

  // Direct dependencies from exit lanes.
  const partial = level.arrows.map((a) => {
    const lane = getArrowExitPath({ head: getHead(a.points), direction: a.direction }, w, h);
    const blockers: string[] = [];
    const hidden: string[] = [];
    const laneOwners = lane.map((c) => owner.get(cellKey(c))?.id ?? null);
    let first: number | null = null;
    lane.forEach((c, i) => {
      const o = owner.get(cellKey(c));
      if (!o || o.id === a.id || blockers.includes(o.id)) return;
      if (first === null) first = i + 1;
      blockers.push(o.id);
      if (o.fromHead >= 3) hidden.push(o.id);
    });
    return { arrow: a, lane, laneOwners, blockers, hidden, first: first as number | null };
  });
  const byId = new Map(partial.map((p) => [p.arrow.id, p]));

  // Layers (longest chain). Cycles mean unsolvable; those arrows get layer = n.
  const layer = new Map<string, number>();
  const visiting = new Set<string>();
  const layerOf = (id: string): number => {
    const known = layer.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) return n;
    visiting.add(id);
    const deps = byId.get(id)!.blockers;
    const l = deps.length === 0 ? 0 : 1 + Math.max(...deps.map(layerOf));
    visiting.delete(id);
    layer.set(id, Math.min(l, n));
    return Math.min(l, n);
  };
  ids.forEach(layerOf);

  const arrows: ArrowMetrics[] = partial.map(({ arrow: a, lane, blockers, hidden, first }) => {
    const shape = analyzeArrowShape(a.points);
    const blocks = partial.filter((p) => p.blockers.includes(a.id)).map((p) => p.arrow.id);
    const tempting = (first ?? 0) >= 2;
    const l = layer.get(a.id)!;
    // Shape and relationships dominate; length only nudges (0.15 per cell).
    const complexity =
      shape.bends * 1.0 +
      shape.reversals * 0.5 +
      shape.cells * 0.15 +
      blockers.length * 1.0 +
      blocks.length * 0.6 +
      hidden.length * 0.8 +
      (tempting ? 0.7 : 0) +
      l * 0.5;
    return {
      id: a.id,
      shape,
      laneLength: lane.length,
      blockers,
      firstBlockerDistance: first,
      blocks,
      layer: l,
      tempting,
      hiddenBlockers: hidden,
      complexity: Math.round(complexity * 10) / 10,
    };
  });

  // Number of valid removal orders (linear extensions of the dependency order).
  let log10Orders: number | null = null;
  let forcedness: number | null = null;
  if (n <= MAX_EXACT_ORDERS) {
    const index = new Map(ids.map((id, i) => [id, i]));
    const need = ids.map((id) => byId.get(id)!.blockers.reduce((m, b) => m | (1 << index.get(b)!), 0));
    const ways = new Float64Array(1 << n);
    ways[0] = 1;
    for (let mask = 0; mask < 1 << n; mask++) {
      if (ways[mask] === 0) continue;
      for (let i = 0; i < n; i++) {
        const bit = 1 << i;
        if (mask & bit || (need[i] & mask) !== need[i]) continue;
        ways[mask | bit] += ways[mask];
      }
    }
    const total = ways[(1 << n) - 1];
    if (total > 0) {
      log10Orders = Math.log10(total);
      let log10Fact = 0;
      for (let k = 2; k <= n; k++) log10Fact += Math.log10(k);
      forcedness = log10Fact === 0 ? 1 : 1 - log10Orders / log10Fact;
    }
  }

  // Random valid playouts: how often is a looked-at arrow blocked, and how narrow does it get?
  const rand = mulberry32(level.id * 7919 + n);
  let trapSum = 0;
  let trapSteps = 0;
  let narrowSum = 0;
  let blockedSeen = 0;
  let blockedLookingFree = 0;
  let freeSeen = 0;
  let freeAtEdge = 0;
  for (let run = 0; run < PLAYOUTS; run++) {
    const gone = new Set<string>();
    let narrowest = n;
    while (gone.size < n) {
      const remaining = ids.filter((id) => !gone.has(id));
      const free = remaining.filter((id) => byId.get(id)!.blockers.every((b) => gone.has(b)));
      if (free.length === 0) break; // unsolvable
      trapSum += 1 - free.length / remaining.length;
      for (const id of remaining) {
        const p = byId.get(id)!;
        const ahead = p.laneOwners[0];
        const aheadEmpty = ahead === undefined || ahead === null || gone.has(ahead);
        if (free.includes(id)) {
          freeSeen++;
          if (p.lane.length === 0) freeAtEdge++;
        } else {
          blockedSeen++;
          if (aheadEmpty) blockedLookingFree++;
        }
      }
      trapSteps++;
      narrowest = Math.min(narrowest, free.length);
      gone.add(free[Math.floor(rand() * free.length)]);
    }
    narrowSum += narrowest;
  }

  const shapeMix: Partial<Record<ShapeFamily, number>> = {};
  for (const a of arrows) shapeMix[a.shape.family] = (shapeMix[a.shape.family] ?? 0) + 1;

  const sameColourContacts: [string, string][] = [];
  const colourOf = new Map(level.arrows.map((a) => [a.id, a.color]));
  for (const [key, o] of owner) {
    const [x, y] = key.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const other = owner.get(`${x + dx},${y + dy}`);
      if (!other || other.id === o.id || colourOf.get(other.id) !== colourOf.get(o.id)) continue;
      const pair = [o.id, other.id].sort() as [string, string];
      if (!sameColourContacts.some(([p, q]) => p === pair[0] && q === pair[1])) sameColourContacts.push(pair);
    }
  }

  const layers = Math.max(...arrows.map((a) => a.layer)) + 1;
  const freeAtStart = arrows.filter((a) => a.layer === 0).length;
  const trapRate = trapSteps ? trapSum / trapSteps : 0;
  const tempting = arrows.filter((a) => a.tempting).length;
  const deception = blockedSeen ? blockedLookingFree / blockedSeen : 0;
  const edgeTell = freeSeen ? freeAtEdge / freeSeen : 0;
  const totalDeps = arrows.reduce((s, a) => s + a.blockers.length, 0);
  const hiddenDependencies = arrows.reduce((s, a) => s + a.hiddenBlockers.length, 0);
  const meanBends = arrows.reduce((s, a) => s + a.shape.bends, 0) / n;
  const density = occupied / (w * h);

  const W = SCORE_WEIGHTS;
  const score =
    W.depth * Math.min(1, (layers - 1) / 8) +
    W.trap * trapRate +
    W.deception * deception +
    W.hidden * (totalDeps ? hiddenDependencies / totalDeps : 0) +
    W.shape * Math.min(1, meanBends / 4) +
    W.noEdgeTell * (1 - edgeTell) +
    W.forced * (forcedness ?? 0.5) +
    W.size * Math.min(1, n / 30);

  return {
    levelId: level.id,
    tagged: level.difficulty,
    arrows,
    arrowCount: n,
    density,
    layers,
    freeAtStart,
    log10Orders,
    forcedness,
    trapRate,
    deception,
    edgeTell,
    narrowestChoice: narrowSum / PLAYOUTS,
    tempting,
    hiddenDependencies,
    meanBends,
    shapeMix,
    sameColourContacts,
    score: Math.round(score),
    tier: tierFor(score),
  };
}
