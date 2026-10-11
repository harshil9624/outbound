/* Dev tool: bun run generate-levels   Writes src/game/levels/generated.ts (levels 9–70, chapters 1–5). */
import { CHAPTERS } from '../src/game/journey/chapters';
import { generateLevel, type GenerationSpec } from '../src/game/generation/generateLevel';
import type { ShapeFamily } from '../src/game/analysis/arrowShape';
import { isSpecialLevel, tierOf, type Tier } from '../src/game/levels/progression';
import type { Difficulty, Level } from '../src/types/level';

const FIRST_GENERATED = 9;
const LAST_GENERATED = 70; // completes chapter 5 (Switchback), master gate included

/** What makes each chapter feel different: its shapes. Size and difficulty come from its tier. */
const SHAPES: Record<string, { shapes: Partial<Record<ShapeFamily, number>>; minMeanBends: number }> = {
  'first-exit': { shapes: { straight: 4, L: 3 }, minMeanBends: 0.5 },
  'the-queue': { shapes: { straight: 3, L: 4 }, minMeanBends: 0.8 },
  crosswalk: { shapes: { straight: 2, L: 3, S: 4 }, minMeanBends: 1.1 },
  hairpin: { shapes: { straight: 1, L: 3, S: 2, U: 3 }, minMeanBends: 1.3 },
  switchback: { shapes: { straight: 1, L: 3, S: 2, U: 2, zigzag: 3 }, minMeanBends: 1.6 },
};

/**
 * Per tier: board cells per arrow (longer, more winding arrows as tiers rise) and the longest
 * straight run. Boards are filled edge to edge (fillGaps in generateLevel), so the board size
 * is what keeps the count inside the tier's range.
 */
const TIER_SHAPE: Record<Difficulty, { cellsPerArrow: number; maxSegment: number }> = {
  simple: { cellsPerArrow: 3.6, maxSegment: 2 },
  easy: { cellsPerArrow: 3.4, maxSegment: 2 },
  normal: { cellsPerArrow: 3.2, maxSegment: 3 },
  hard: { cellsPerArrow: 3.2, maxSegment: 3 },
  'extra-hard': { cellsPerArrow: 3.0, maxSegment: 3 },
};
/** 10 columns keep cells ~30 dp even on a 360 dp phone: readable and tappable without zoom. */
const MAX_COLUMNS = 10;
/** Never smaller than the tutorial's last board (7x7). */
const MIN_SIDE = 7;

function boardFor(arrows: number, cellsPerArrow: number): [number, number] {
  const cells = arrows * cellsPerArrow;
  // Portrait boards (w:h about 0.85) suit a phone held upright.
  let h = Math.max(MIN_SIDE, Math.round(Math.sqrt(cells / 0.85)));
  const w = Math.min(MAX_COLUMNS, Math.max(MIN_SIDE, Math.round(cells / h)));
  h = Math.max(h, Math.round(cells / w));
  return [w, h];
}

/** Arrow target: regular levels climb through the tier's range; challenges and masters take the top. */
function targetArrows(levelId: number, tier: Tier): number {
  const [lo, hi] = tier.arrows;
  const special = isSpecialLevel(levelId);
  if (special === 'master') return hi;
  if (special === 'challenge') return hi - 1;
  const regular = Array.from({ length: tier.levels[1] - tier.levels[0] + 1 }, (_, i) => tier.levels[0] + i).filter((id) => !isSpecialLevel(id));
  const p = regular.indexOf(levelId) / Math.max(1, regular.length - 1);
  return Math.round(lo + (hi - 1 - lo) * p);
}

function specFor(levelId: number, floor: number): GenerationSpec {
  const chapter = CHAPTERS.find((c) => c.levelIds.includes(levelId))!;
  const tier = tierOf(levelId)!;
  const { cellsPerArrow, maxSegment } = TIER_SHAPE[tier.difficulty];
  const special = isSpecialLevel(levelId);
  const target = Math.max(targetArrows(levelId, tier), special ? floor : floor);
  const [w, h] = boardFor(target, cellsPerArrow);
  const lo = Math.max(tier.arrows[0], special ? floor : floor, target - 1);
  const hi = Math.min(tier.arrows[1], target + 1);
  return {
    id: levelId,
    width: w,
    height: h,
    arrows: [Math.min(lo, hi), hi],
    targetArrows: Math.min(target, hi),
    density: 1,
    maxSegment,
    shapes: SHAPES[chapter.id].shapes,
    // Rises with the tier; the arrow count is the hard requirement, the score only breaks ties.
    targetScore: 40 + tier.arrows[1] / 2,
    minMeanBends: SHAPES[chapter.id].minMeanBends,
    difficulty: tier.difficulty,
    attempts: special ? 20 : 12,
    scoreWeight: 1,
  };
}

const levels: Level[] = [];
/** Arrows in the last regular level: a regular level never has fewer than the one before. */
let floor = 0;
console.log('id   tier        board  arrows  [range]  fill  score');
for (let id = FIRST_GENERATED; id <= LAST_GENERATED; id++) {
  const spec = specFor(id, floor);
  let out = generateLevel(spec);
  // A board that can't reach the count gets fresh random streams before anything is relaxed.
  for (let seed = 1; !out && seed <= 20; seed++) out = generateLevel({ ...spec, seed });
  if (!out) throw new Error(`Could not generate level ${id} (${spec.width}x${spec.height}, ${spec.arrows.join('-')} arrows)`);
  levels.push(out.level);
  const m = out.metrics;
  if (!isSpecialLevel(id)) floor = Math.max(floor, m.arrowCount);
  const cells = out.level.arrows.reduce((s, a) => s + a.points.slice(1).reduce((n, p, i) => n + Math.abs(p.x - a.points[i].x) + Math.abs(p.y - a.points[i].y), 0) + 1, 0);
  console.log(
    [
      String(id).padEnd(4),
      spec.difficulty.padEnd(11),
      `${spec.width}x${spec.height}`.padEnd(6),
      String(m.arrowCount).padEnd(7),
      `[${spec.arrows.join('-')}]`.padEnd(8),
      `${Math.round((cells / (spec.width * spec.height)) * 100)}%`.padEnd(5),
      m.score,
    ].join(' '),
  );
}

const body = levels
  .map((l) => {
    const arrows = l.arrows
      .map((a) => `      arrow('${a.id}', '${a.color}', '${a.direction}', [${a.points.map((p) => `[${p.x}, ${p.y}]`).join(', ')}]),`)
      .join('\n');
    return `  {\n    id: ${l.id},\n    boardWidth: ${l.boardWidth},\n    boardHeight: ${l.boardHeight},\n    difficulty: '${l.difficulty}',\n    arrows: [\n${arrows}\n    ],\n  },`;
  })
  .join('\n');

await Bun.write(
  'src/game/levels/generated.ts',
  `// GENERATED by scripts/generateLevels.ts (bun run generate-levels). Do not edit by hand:\n// change the plans in the script and regenerate. Output is deterministic.\nimport type { Level } from '../../types/level';\nimport { arrow } from './authoring';\n\nexport const GENERATED_LEVELS: readonly Level[] = [\n${body}\n];\n`,
);
console.log(`\nwrote ${levels.length} levels to src/game/levels/generated.ts`);
