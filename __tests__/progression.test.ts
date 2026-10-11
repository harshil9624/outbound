import { describe, expect, it } from 'bun:test';
import { expandPathToCells } from '../src/game/engine/geometry';
import { nextMainLevel } from '../src/game/journey/progress';
import { LOCAL_LEVELS } from '../src/game/levels';
import { levelProvider } from '../src/game/levels/levelProvider';
import { DIFFICULTY_RANK, TIERS, isSpecialLevel, tierOf } from '../src/game/levels/progression';
import { validateLevel } from '../src/game/validation/validateLevel';

/**
 * Every level, 1–70: the five tiers (Simple 10–15, Easy 16–22, Medium 23–30, Hard 31–35,
 * Extra Hard 36–40 arrows), boards filled, and a journey that never gets smaller or easier.
 * Levels 1–8 are the handcrafted tutorial (Simple, under 10 arrows).
 */

const LAST = 70;
const levels = LOCAL_LEVELS.filter((l) => l.id <= LAST);
const regular = levels.filter((l) => !isSpecialLevel(l.id));
const fill = (l: (typeof levels)[number]) =>
  l.arrows.reduce((s, a) => s + expandPathToCells(a.points).length, 0) / (l.boardWidth * l.boardHeight);

describe('journey progression, levels 1–70', () => {
  it('has every level from 1 to 70, each valid and solvable', () => {
    expect(levels.map((l) => l.id)).toEqual(Array.from({ length: LAST }, (_, i) => i + 1));
    for (const l of levels) expect(`${l.id}:${validateLevel(l).valid}`).toBe(`${l.id}:true`);
  });

  it('opens each next level in order through 70, and nothing after the last', () => {
    for (let id = 1; id < LAST; id++) expect(nextMainLevel(id, levelProvider.hasLevel)).toBe(id + 1);
    expect(nextMainLevel(LAST, levelProvider.hasLevel)).toBeNull();
  });

  it('keeps the tutorial (levels 1–8) Simple and under 10 arrows', () => {
    for (const l of levels.filter((x) => x.id <= 8)) {
      expect(l.difficulty).toBe('simple');
      expect(l.arrows.length).toBeLessThan(10);
    }
  });

  it('gives every level from 9 its tier and an arrow count inside the tier range', () => {
    for (const l of levels.filter((x) => x.id >= 9)) {
      const tier = tierOf(l.id)!;
      expect(`${l.id}:${l.difficulty}`).toBe(`${l.id}:${tier.difficulty}`);
      expect(l.arrows.length).toBeGreaterThanOrEqual(tier.arrows[0]);
      expect(l.arrows.length).toBeLessThanOrEqual(tier.arrows[1]);
    }
  });

  it('covers levels 9–70 with the five tiers, in order, with no gaps', () => {
    expect(TIERS.map((t) => t.difficulty)).toEqual(['simple', 'easy', 'normal', 'hard', 'extra-hard']);
    for (let i = 1; i < TIERS.length; i++) {
      expect(TIERS[i].levels[0]).toBe(TIERS[i - 1].levels[1] + 1);
      expect(TIERS[i].arrows[0]).toBe(TIERS[i - 1].arrows[1] + 1);
    }
    expect(TIERS[0].levels[0]).toBe(9);
    expect(TIERS[TIERS.length - 1].levels[1]).toBe(LAST);
  });

  it('never steps the difficulty back down, level to level', () => {
    for (let i = 1; i < levels.length; i++) {
      expect(DIFFICULTY_RANK[levels[i].difficulty]).toBeGreaterThanOrEqual(DIFFICULTY_RANK[levels[i - 1].difficulty]);
    }
  });

  it('never gives a regular level fewer arrows than the regular level before it (from level 9)', () => {
    for (let i = 1; i < regular.length; i++) {
      if (regular[i].id < 9) continue;
      expect(`${regular[i].id}:${regular[i].arrows.length >= regular[i - 1].arrows.length}`).toBe(`${regular[i].id}:true`);
    }
  });

  // Cells stay empty only where filling them would make the level unsolvable (fillGaps).
  it('fills generated boards: at least 88% of cells used, so no large blank regions', () => {
    for (const l of levels.filter((x) => x.id >= 9)) expect(`${l.id}:${fill(l) >= 0.88}`).toBe(`${l.id}:true`);
  });

  it('keeps boards readable without zoom: at most 10 columns', () => {
    for (const l of levels) expect(l.boardWidth).toBeLessThanOrEqual(10);
  });
});
