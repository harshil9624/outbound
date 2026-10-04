/* Dev tool: bun run analyze-levels [--arrows]   Prints the Level Design Bible metrics (§4) for every level. */
import { LOCAL_LEVELS } from '../src/game/levels';
import { analyzeLevel } from '../src/game/analysis/levelMetrics';

const showArrows = process.argv.includes('--arrows');
const pct = (x: number) => `${Math.round(x * 100)}%`;
const fixed = (x: number | null, d = 1) => (x === null ? '—' : x.toFixed(d));

console.log('lvl  size  arrows dens  layers free@0 trap  decept edge  narrow orders(log10) forced hidden bends  score tier     tagged');
for (const level of LOCAL_LEVELS) {
  const m = analyzeLevel(level);
  console.log(
    [
      String(m.levelId).padEnd(4),
      `${level.boardWidth}x${level.boardHeight}`.padEnd(5),
      String(m.arrowCount).padEnd(6),
      pct(m.density).padEnd(5),
      String(m.layers).padEnd(6),
      String(m.freeAtStart).padEnd(6),
      pct(m.trapRate).padEnd(5),
      pct(m.deception).padEnd(6),
      pct(m.edgeTell).padEnd(5),
      fixed(m.narrowestChoice).padEnd(6),
      fixed(m.log10Orders, 2).padEnd(14),
      fixed(m.forcedness, 2).padEnd(6),
      String(m.hiddenDependencies).padEnd(6),
      fixed(m.meanBends).padEnd(6),
      String(m.score).padEnd(5),
      m.tier.padEnd(8),
      m.tagged,
    ].join(' '),
  );
  if (m.sameColourContacts.length) {
    console.log(`     warn: same-colour arrows touch: ${m.sameColourContacts.map((p) => p.join('+')).join(', ')}`);
  }
  if (showArrows) {
    for (const a of m.arrows) {
      console.log(
        `     ${a.id}: ${a.shape.family.padEnd(8)} cells ${a.shape.cells} bends ${a.shape.bends}` +
          ` lane ${a.laneLength} layer ${a.layer} blockers [${a.blockers.join(',')}] blocks [${a.blocks.join(',')}]` +
          `${a.tempting ? ' TEMPTING' : ''}${a.hiddenBlockers.length ? ` hidden[${a.hiddenBlockers.join(',')}]` : ''}` +
          ` complexity ${a.complexity}`,
      );
    }
  }
}
