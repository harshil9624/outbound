/* Dev tool: bun run generate-levels   Writes src/game/levels/generated.ts (levels 9–70, chapters 1–5). */
import { CHAPTERS } from '../src/game/journey/chapters';
import { generateLevel, type GenerationSpec } from '../src/game/generation/generateLevel';
import type { ShapeFamily } from '../src/game/analysis/arrowShape';
import type { Difficulty, Level } from '../src/types/level';

const FIRST_GENERATED = 9;
const LAST_GENERATED = 70; // completes chapter 5 (Switchback), master gate included

interface ChapterPlan {
  density: [number, number];
  shapes: Partial<Record<ShapeFamily, number>>;
  /** Target score at the chapter's first and last regular level. */
  score: [number, number];
  minMeanBends: number;
  difficulty: Difficulty;
}

/** Bible §5 tier recipes, one per chapter. Each chapter introduces its signature shape. */
const PLANS: Record<string, ChapterPlan> = {
  'first-exit': { density: [0.95, 0.92], shapes: { straight: 4, L: 3 }, score: [24, 34], minMeanBends: 0.5, difficulty: 'easy' },
  'the-queue': { density: [0.94, 0.9], shapes: { straight: 3, L: 4 }, score: [30, 42], minMeanBends: 0.8, difficulty: 'easy' },
  crosswalk: { density: [0.92, 0.88], shapes: { straight: 2, L: 3, S: 4 }, score: [36, 48], minMeanBends: 1.1, difficulty: 'normal' },
  hairpin: { density: [0.92, 0.88], shapes: { straight: 1, L: 3, S: 2, U: 3 }, score: [42, 54], minMeanBends: 1.3, difficulty: 'normal' },
  switchback: { density: [0.92, 0.88], shapes: { straight: 1, L: 3, S: 2, U: 2, zigzag: 3 }, score: [46, 60], minMeanBends: 1.6, difficulty: 'hard' },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Levels must visibly grow: more arrows on bigger boards as the journey goes on.
 * Level 8 (the last handcrafted one) has 9 arrows on 7x7, so the ramp starts just above it.
 * Boards stop at 8x10: past that, cells drop below ~36 dp on a 360 dp phone and arrows get hard to read.
 */
const ARROWS_FROM = 10;
const ARROWS_TO = 19;
const BOARDS: [number, number][] = [[7, 7], [7, 8], [8, 9], [8, 10]];

function growth(levelId: number, extra: number) {
  const t = (levelId - FIRST_GENERATED) / (LAST_GENERATED - FIRST_GENERATED);
  const targetArrows = Math.round(lerp(ARROWS_FROM, ARROWS_TO, t)) + extra;
  const [w, h] = BOARDS[Math.min(BOARDS.length - 1, Math.floor(t * BOARDS.length + (extra ? 0.5 : 0)))];
  return { targetArrows, w, h };
}

/**
 * @param floor Fewest arrows allowed: the last regular level's count, so the journey never
 *   visibly shrinks. Challenge and master levels must go at least one bigger.
 */
function specFor(levelId: number, floor: number): GenerationSpec {
  const chapter = CHAPTERS.find((c) => c.levelIds.includes(levelId))!;
  const plan = PLANS[chapter.id];
  const ids = chapter.levelIds;
  const t = ids.indexOf(levelId) / (ids.length - 1);
  const isMaster = levelId === ids[ids.length - 1];
  const isChallenge = chapter.challengeIds?.includes(levelId) ?? false;
  const boost = isMaster ? 8 : isChallenge ? 6 : 0;
  const { targetArrows, w, h } = growth(levelId, isMaster ? 2 : isChallenge ? 1 : 0);
  const special = isMaster || isChallenge;
  const minArrows = Math.max(targetArrows - 4, special ? floor + 1 : floor);
  return {
    id: levelId,
    width: w,
    height: h,
    arrows: [minArrows, Math.max(targetArrows, minArrows) + 2],
    targetArrows: Math.max(targetArrows, minArrows),
    density: lerp(plan.density[0], plan.density[1], t),
    shapes: plan.shapes,
    targetScore: lerp(plan.score[0], plan.score[1], t) + boost,
    minMeanBends: plan.minMeanBends,
    difficulty: isMaster && plan.difficulty === 'normal' ? 'hard' : plan.difficulty,
    // Special levels get more tries and weigh difficulty more, to land their spike.
    attempts: special ? 120 : 50,
    scoreWeight: special ? 3 : 1,
  };
}

const levels: Level[] = [];
/** Arrow count of the last regular level (level 8, the last handcrafted one, has 9). */
let floor = 9;
console.log('id   chapter       board arrows score(target) tier     layers trap  decept bends');
for (let id = FIRST_GENERATED; id <= LAST_GENERATED; id++) {
  const spec = specFor(id, floor);
  // If a level can't reach its size, relax the minimum a step at a time rather than fail.
  let out = generateLevel(spec);
  for (let relax = 1; !out && relax <= 4; relax++) out = generateLevel({ ...spec, arrows: [spec.arrows[0] - relax, spec.arrows[1]] });
  if (!out) throw new Error(`Could not generate level ${id}`);
  // A challenge or master that misses its difficulty spike gets a few fresh random streams.
  if ((spec.scoreWeight ?? 1) > 1) {
    for (let seed = 1; seed <= 4 && Math.abs(out.metrics.score - spec.targetScore) > 6; seed++) {
      const alt = generateLevel({ ...spec, seed });
      if (alt && Math.abs(alt.metrics.score - spec.targetScore) < Math.abs(out.metrics.score - spec.targetScore)) out = alt;
    }
  }
  levels.push(out.level);
  // Specials are spikes: the next regular level only has to match the last regular one.
  const chapterOfId = CHAPTERS.find((c) => c.levelIds.includes(id))!;
  const isSpecial = id === chapterOfId.levelIds[chapterOfId.levelIds.length - 1] || (chapterOfId.challengeIds ?? []).includes(id);
  // The floor follows the planned curve, so one lucky big level can't force the rest past what the board holds.
  if (!isSpecial) floor = Math.max(floor, Math.min(out.level.arrows.length, growth(id, 0).targetArrows));
  const m = out.metrics;
  const chapter = CHAPTERS.find((c) => c.levelIds.includes(id))!;
  console.log(
    [
      String(id).padEnd(4),
      chapter.title.padEnd(13),
      `${spec.width}x${spec.height}`.padEnd(5),
      String(m.arrowCount).padEnd(6),
      `${m.score}(${Math.round(spec.targetScore)})`.padEnd(13),
      m.tier.padEnd(8),
      String(m.layers).padEnd(6),
      `${Math.round(m.trapRate * 100)}%`.padEnd(5),
      `${Math.round(m.deception * 100)}%`.padEnd(6),
      m.meanBends.toFixed(1),
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
  `// GENERATED by scripts/generateLevels.ts (bun run generate-levels). Do not edit by hand:\n// change the chapter plans in the script and regenerate. Output is deterministic.\nimport type { Level } from '../../types/level';\nimport { arrow } from './authoring';\n\nexport const GENERATED_LEVELS: readonly Level[] = [\n${body}\n];\n`,
);
console.log(`\nwrote ${levels.length} levels to src/game/levels/generated.ts`);
