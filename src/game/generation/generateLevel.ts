import type { Direction, Point } from '../../types/geometry';
import type { ArrowColor, ArrowPath, Difficulty, Level } from '../../types/level';
import { analyzeLevel, type LevelMetrics } from '../analysis/levelMetrics';
import type { ShapeFamily } from '../analysis/arrowShape';
import { DIRECTION_VECTORS, cellKey } from '../engine/geometry';
import { validateLevel } from '../validation/validateLevel';

/**
 * Procedural level generator (LEVEL_DESIGN_BIBLE.md §5, §7).
 *
 * 1. Grow arrows as random walks in the requested shape families until the board reaches its density.
 * 2. Make it solvable: while some arrows wait on each other in a loop, remove one of them.
 *    (The gaps this leaves are what create "long shot" deception.)
 * 3. Colour so no two touching arrows share a colour.
 * 4. Score with the analyzer and keep the attempt closest to the target difficulty.
 */

export interface GenerationSpec {
  id: number;
  width: number;
  height: number;
  /** Arrow count range (hard limits). */
  arrows: [number, number];
  /** Arrow count to aim for: levels should visibly grow as the player progresses. */
  targetArrows: number;
  /** Share of cells to fill before stopping. */
  density: number;
  /** Relative weights of shape families for new arrows. */
  shapes: Partial<Record<ShapeFamily, number>>;
  /** Target score (levelMetrics 0–100). */
  targetScore: number;
  /** Lowest acceptable score: keeps the journey from getting easier than the level before. */
  minScore?: number;
  /** Minimum mean bends per arrow: shapes, not length, carry the chapter (Bible §4). */
  minMeanBends: number;
  difficulty: Difficulty;
  attempts?: number;
  /** How much hitting the target score matters versus size and shape (default 1). */
  scoreWeight?: number;
  /** Alternative random stream for the same id (retries). Default 0. */
  seed?: number;
  /** Longest straight run in any arrow (cells). Short runs pack more arrows into a board. Default: board size. */
  maxSegment?: number;
}

export interface GeneratedLevel {
  level: Level;
  metrics: LevelMetrics;
}

const DIRS: Direction[] = ['up', 'down', 'left', 'right'];
const COLORS: ArrowColor[] = ['yellow', 'blue', 'pink', 'green', 'orange', 'purple', 'red'];
const LEFT_OF: Record<Direction, Direction> = { up: 'left', left: 'down', down: 'right', right: 'up' };
const RIGHT_OF: Record<Direction, Direction> = { up: 'right', right: 'down', down: 'left', left: 'up' };

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;
const int = (r: Rand, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const pick = <T,>(r: Rand, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];

function pickFamily(r: Rand, weights: Partial<Record<ShapeFamily, number>>): ShapeFamily {
  const entries = Object.entries(weights) as [ShapeFamily, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [f, w] of entries) {
    if ((x -= w) <= 0) return f;
  }
  return entries[0][0];
}

/** Turn sequence and segment lengths for one arrow of a family. */
function plan(r: Rand, family: ShapeFamily, maxSeg: number): { turns: ('L' | 'R')[]; segs: number[] } {
  const seg = () => int(r, 1, Math.max(1, Math.min(maxSeg, 3)));
  const first = r() < 0.5 ? 'L' : 'R';
  const other = first === 'L' ? 'R' : 'L';
  switch (family) {
    case 'straight':
      return { turns: [], segs: [int(r, 1, Math.max(1, Math.min(maxSeg, 4)))] };
    case 'L':
      return { turns: [first], segs: [seg(), seg()] };
    case 'U':
      // Compact legs: tight hairpins leave room for more arrows on the board.
      return { turns: [first, first], segs: [int(r, 1, 2), int(r, 1, 2), int(r, 1, 2)] };
    case 'S':
      return { turns: [first, other], segs: [seg(), seg(), seg()] };
    case 'zigzag': {
      const n = int(r, 3, 4);
      return { turns: Array.from({ length: n }, (_, i) => (i % 2 ? other : first)), segs: Array.from({ length: n + 1 }, () => int(r, 1, 2)) };
    }
    case 'spiral':
      return { turns: [first, first, first], segs: [int(r, 2, 3), int(r, 2, 3), int(r, 2, 3), 1] };
    default: {
      // winding: a reversal and a step
      return { turns: [first, first, other, other], segs: [seg(), 1, seg(), 1, seg()] };
    }
  }
}

/** Grows one arrow as a walk from a free cell. Returns its cells (tail → head) and direction, or null. */
function growArrow(r: Rand, w: number, h: number, taken: Set<string>, family: ShapeFamily, maxSegment?: number): { cells: Point[]; dir: Direction } | null {
  const free: Point[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!taken.has(`${x},${y}`)) free.push({ x, y });
  if (free.length < 2) return null;
  const start = pick(r, free);
  const { turns, segs } = plan(r, family, Math.min(maxSegment ?? Infinity, Math.max(w, h) - 1));
  let dir = pick(r, DIRS);
  const cells: Point[] = [start];
  const own = new Set([cellKey(start)]);
  for (let s = 0; s < segs.length; s++) {
    if (s > 0) dir = turns[s - 1] === 'L' ? LEFT_OF[dir] : RIGHT_OF[dir];
    const v = DIRECTION_VECTORS[dir];
    for (let k = 0; k < segs[s]; k++) {
      const last = cells[cells.length - 1];
      const next = { x: last.x + v.x, y: last.y + v.y };
      const key = cellKey(next);
      if (next.x < 0 || next.y < 0 || next.x >= w || next.y >= h || taken.has(key) || own.has(key)) return null;
      cells.push(next);
      own.add(key);
    }
  }
  // The exit lane must not run back into this arrow's own body.
  const v = DIRECTION_VECTORS[dir];
  const head = cells[cells.length - 1];
  for (let x = head.x + v.x, y = head.y + v.y; x >= 0 && y >= 0 && x < w && y < h; x += v.x, y += v.y) {
    if (own.has(`${x},${y}`)) return null;
  }
  return { cells, dir };
}

function toVertices(cells: Point[]): Point[] {
  const out = [cells[0]];
  for (let i = 1; i < cells.length - 1; i++) {
    const a = cells[i - 1];
    const b = cells[i];
    const c = cells[i + 1];
    if (b.x - a.x !== c.x - b.x || b.y - a.y !== c.y - b.y) out.push(b);
  }
  out.push(cells[cells.length - 1]);
  return out;
}

interface Placed {
  cells: Point[];
  dir: Direction;
}

/** Arrows sitting in each arrow's exit lane. */
function blockersOf(arrows: Placed[], w: number, h: number): number[][] {
  const owner = new Map<string, number>();
  arrows.forEach((a, i) => a.cells.forEach((c) => owner.set(cellKey(c), i)));
  return arrows.map((a, i) => {
    const v = DIRECTION_VECTORS[a.dir];
    const head = a.cells[a.cells.length - 1];
    const out: number[] = [];
    for (let x = head.x + v.x, y = head.y + v.y; x >= 0 && y >= 0 && x < w && y < h; x += v.x, y += v.y) {
      const o = owner.get(`${x},${y}`);
      if (o !== undefined && o !== i && !out.includes(o)) out.push(o);
    }
    return out;
  });
}

/** Removes arrows caught in waiting loops until greedy removal clears the board. */
function makeSolvable(r: Rand, arrows: Placed[], w: number, h: number): Placed[] {
  let list = arrows;
  for (;;) {
    const deps = blockersOf(list, w, h);
    const gone = new Set<number>();
    let progressed = true;
    while (progressed) {
      progressed = false;
      deps.forEach((d, i) => {
        if (!gone.has(i) && d.every((b) => gone.has(b))) {
          gone.add(i);
          progressed = true;
        }
      });
    }
    const stuck = list.map((_, i) => i).filter((i) => !gone.has(i));
    if (stuck.length === 0) return list;
    const drop = pick(r, stuck);
    list = list.filter((_, i) => i !== drop);
  }
}

/** True when greedy removal clears the board (removing an arrow never blocks another). */
function isSolvable(arrows: Placed[], w: number, h: number): boolean {
  const deps = blockersOf(arrows, w, h);
  const gone = new Set<number>();
  let progressed = true;
  while (progressed) {
    progressed = false;
    deps.forEach((d, i) => {
      if (!gone.has(i) && d.every((b) => gone.has(b))) {
        gone.add(i);
        progressed = true;
      }
    });
  }
  return gone.size === arrows.length;
}

const NEIGHBOURS: [number, number, Direction][] = [
  [1, 0, 'right'],
  [-1, 0, 'left'],
  [0, 1, 'down'],
  [0, -1, 'up'],
];

/** An arrow's exit lane must not run back over its own body. */
function laneClearOfSelf(a: Placed, w: number, h: number): boolean {
  const own = new Set(a.cells.map(cellKey));
  const v = DIRECTION_VECTORS[a.dir];
  const head = a.cells[a.cells.length - 1];
  for (let x = head.x + v.x, y = head.y + v.y; x >= 0 && y >= 0 && x < w && y < h; x += v.x, y += v.y) {
    if (own.has(`${x},${y}`)) return false;
  }
  return true;
}

/**
 * Fills the empty cells the random walks and the solvability pass left behind, keeping the level
 * solvable at every step:
 *  1. two free neighbouring cells become a new short arrow (either way round), while under maxArrows;
 *  2. a free cell next to an arrow's tail lengthens that arrow (its head and exit lane don't change).
 * A cell stays empty only if every way of using it would make the level unsolvable.
 */
function fillGaps(r: Rand, arrows: Placed[], w: number, h: number, maxArrows: number): Placed[] {
  const list = arrows.map((a) => ({ cells: [...a.cells], dir: a.dir }));
  const taken = new Set<string>();
  list.forEach((a) => a.cells.forEach((c) => taken.add(cellKey(c))));
  const free = () => {
    const out: Point[] = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!taken.has(`${x},${y}`)) out.push({ x, y });
    return out;
  };
  // 1. New two-cell arrows.
  for (const c of free().sort(() => r() - 0.5)) {
    if (list.length >= maxArrows) break;
    if (taken.has(cellKey(c))) continue;
    for (const [dx, dy, dir] of [...NEIGHBOURS].sort(() => r() - 0.5)) {
      const n = { x: c.x + dx, y: c.y + dy };
      if (n.x < 0 || n.y < 0 || n.x >= w || n.y >= h || taken.has(cellKey(n))) continue;
      const cand: Placed = { cells: [c, n], dir };
      list.push(cand);
      if (isSolvable(list, w, h)) {
        taken.add(cellKey(c));
        taken.add(cellKey(n));
        break;
      }
      list.pop();
    }
  }
  // 2. Lengthen a neighbouring arrow's tail into each remaining free cell.
  for (const c of free()) {
    for (const [dx, dy] of NEIGHBOURS) {
      const owner = list.find((a) => a.cells[0].x === c.x + dx && a.cells[0].y === c.y + dy && a.cells.length < 8);
      if (!owner) continue;
      const before = owner.cells;
      owner.cells = [c, ...before];
      if (laneClearOfSelf(owner, w, h) && isSolvable(list, w, h)) {
        taken.add(cellKey(c));
        break;
      }
      owner.cells = before;
    }
  }
  return list;
}

/** Greedy colouring: touching arrows never share a colour. */
function colour(r: Rand, arrows: Placed[]): ArrowColor[] {
  const owner = new Map<string, number>();
  arrows.forEach((a, i) => a.cells.forEach((c) => owner.set(cellKey(c), i)));
  const result: ArrowColor[] = [];
  arrows.forEach((a, i) => {
    const near = new Set<ArrowColor>();
    for (const c of a.cells) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const o = owner.get(`${c.x + dx},${c.y + dy}`);
        if (o !== undefined && o !== i && o < i) near.add(result[o]);
      }
    }
    const options = COLORS.filter((col) => !near.has(col));
    result.push(options.length ? pick(r, options) : pick(r, COLORS));
  });
  return result;
}

function attempt(spec: GenerationSpec, r: Rand): Level | null {
  const { width: w, height: h } = spec;
  const taken = new Set<string>();
  const placed: Placed[] = [];
  const goal = Math.round(w * h * spec.density);
  const place = (family: ShapeFamily) => {
    const a = growArrow(r, w, h, taken, family, spec.maxSegment);
    if (!a) return false;
    placed.push(a);
    a.cells.forEach((c) => taken.add(cellKey(c)));
    return true;
  };
  // Phase 1: the chapter's shaped arrows first, while there is room for them.
  const shaped = Object.fromEntries(Object.entries(spec.shapes).filter(([f]) => f !== 'straight'));
  const shapedTarget = Math.round(spec.arrows[1] * 0.55);
  const budget = Math.max(800, w * h * 8);
  for (let tries = 0; tries < budget && placed.length < shapedTarget && Object.keys(shaped).length; tries++) {
    place(pickFamily(r, shaped));
  }
  // Phase 2: fill the gaps with any family the chapter allows.
  for (let tries = 0; tries < budget && placed.length < spec.arrows[1] && taken.size < goal; tries++) {
    place(pickFamily(r, spec.shapes));
  }
  // The solvability pass removes arrows caught in waiting loops; fill what they and the walks left empty.
  const solvable = fillGaps(r, makeSolvable(r, placed, w, h), w, h, spec.arrows[1]);
  if (solvable.length < spec.arrows[0]) return null;
  const colors = colour(r, solvable);
  const arrows: ArrowPath[] = solvable.map((a, i) => ({
    id: String.fromCharCode(97 + (i % 26)) + (i >= 26 ? String(Math.floor(i / 26)) : ''),
    color: colors[i],
    direction: a.dir,
    points: toVertices(a.cells),
  }));
  return { id: spec.id, boardWidth: w, boardHeight: h, difficulty: spec.difficulty, arrows };
}

/** Deterministic for a given spec: the same id always produces the same level. */
export function generateLevel(spec: GenerationSpec): GeneratedLevel | null {
  const r = mulberry32(spec.id * 2654435761 + (spec.seed ?? 0) * 97);
  let best: GeneratedLevel | null = null;
  let bestCost = Infinity;
  const cost = (m: LevelMetrics) =>
    (spec.scoreWeight ?? 1) * Math.abs(m.score - spec.targetScore) +
    12 * Math.max(0, spec.minMeanBends - m.meanBends) +
    6 * Math.abs(m.arrowCount - spec.targetArrows) +
    40 * Math.max(0, (spec.minScore ?? 0) - m.score);
  for (let i = 0; i < (spec.attempts ?? 40); i++) {
    const level = attempt(spec, r);
    if (!level) continue;
    const v = validateLevel(level);
    if (!v.valid || v.warnings.length) continue;
    const metrics = analyzeLevel(level);
    if (metrics.freeAtStart < 1 || metrics.sameColourContacts.length) continue;
    const c = cost(metrics);
    if (c < bestCost) {
      best = { level, metrics };
      bestCost = c;
    }
  }
  return best;
}
