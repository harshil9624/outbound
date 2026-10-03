/* Dev tool: bun run validate-levels */
import { LOCAL_LEVELS } from '../src/game/levels';
import { validateLevel } from '../src/game/validation/validateLevel';

let failed = false;
for (const level of LOCAL_LEVELS) {
  const r = validateLevel(level);
  const tag = r.valid ? 'OK  ' : 'FAIL';
  console.log(`${tag} level ${level.id} (${level.boardWidth}x${level.boardHeight}, ${level.arrows.length} arrows) solution: ${r.solution.join(' → ')}`);
  r.errors.forEach((e) => console.log(`     error: ${e}`));
  r.warnings.forEach((w) => console.log(`     warn:  ${w}`));
  if (!r.valid) failed = true;
}
process.exit(failed ? 1 : 0);
