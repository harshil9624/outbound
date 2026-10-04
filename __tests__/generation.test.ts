import { describe, expect, it } from 'bun:test';
import { generateLevel, type GenerationSpec } from '../src/game/generation/generateLevel';
import { validateLevel } from '../src/game/validation/validateLevel';

const spec: GenerationSpec = {
  id: 500,
  width: 6,
  height: 6,
  arrows: [5, 9],
  density: 0.9,
  shapes: { straight: 3, L: 3, S: 2 },
  targetScore: 32,
  targetArrows: 8,
  minMeanBends: 0.6,
  difficulty: 'easy',
  attempts: 12,
};

describe('level generator', () => {
  it('produces a valid, solvable level with no same-colour contacts', () => {
    const out = generateLevel(spec)!;
    expect(out).not.toBeNull();
    expect(validateLevel(out.level).valid).toBe(true);
    expect(out.metrics.sameColourContacts).toEqual([]);
    expect(out.metrics.freeAtStart).toBeGreaterThan(0);
  });
  it('is deterministic for the same id', () => {
    expect(generateLevel(spec)!.level).toEqual(generateLevel(spec)!.level);
  });
});
