import { describe, expect, it } from 'bun:test';
import { analyzeArrowShape } from '../src/game/analysis/arrowShape';
import { analyzeLevel, tierFor } from '../src/game/analysis/levelMetrics';
import { arrow } from '../src/game/levels/authoring';
import type { Level } from '../src/types/level';

const pts = (coords: [number, number][]) => coords.map(([x, y]) => ({ x, y }));

describe('arrow shape families', () => {
  it.each([
    ['straight', [[0, 0], [3, 0]]],
    ['L', [[0, 0], [2, 0], [2, 2]]],
    ['U', [[0, 0], [2, 0], [2, 2], [0, 2]]],
    ['S', [[0, 0], [2, 0], [2, 2], [4, 2]]],
    ['zigzag', [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]]],
    ['spiral', [[0, 0], [3, 0], [3, 3], [0, 3], [0, 1]]],
    ['winding', [[0, 0], [2, 0], [2, 2], [0, 2], [0, 4], [2, 4]]],
  ] as const)('%s', (family, coords) => {
    expect(analyzeArrowShape(pts(coords as unknown as [number, number][])).family).toBe(family);
  });
  it('counts cells, bends, reversals and symmetry', () => {
    const u = analyzeArrowShape(pts([[0, 0], [2, 0], [2, 2], [0, 2]]));
    expect(u).toMatchObject({ cells: 7, bends: 2, reversals: 1, symmetric: true });
    expect(analyzeArrowShape(pts([[0, 0], [3, 0], [3, 1]])).symmetric).toBe(false);
  });
});

describe('level metrics', () => {
  it('finds the dependency chain, layers and the single solving order', () => {
    // a → b → c in one row, all pointing right: c must go first, then b, then a.
    const level: Level = {
      id: 91,
      boardWidth: 6,
      boardHeight: 1,
      difficulty: 'easy',
      arrows: [
        arrow('a', 'blue', 'right', [[0, 0], [1, 0]]),
        arrow('b', 'pink', 'right', [[2, 0], [3, 0]]),
        arrow('c', 'green', 'right', [[4, 0], [5, 0]]),
      ],
    };
    const m = analyzeLevel(level);
    const byId = Object.fromEntries(m.arrows.map((a) => [a.id, a]));
    expect(byId.a.blockers).toEqual(['b', 'c']);
    expect(byId.c.blockers).toEqual([]);
    expect(m.layers).toBe(3);
    expect(m.freeAtStart).toBe(1);
    expect(m.log10Orders).toBeCloseTo(0); // exactly one order
    expect(m.forcedness).toBeCloseTo(1);
    // c is free because its head is at the edge; b and a become free with empty cells ahead.
    expect(m.edgeTell).toBeCloseTo(1 / 3);
  });

  it('counts every order when nothing depends on anything', () => {
    const level: Level = {
      id: 92,
      boardWidth: 3,
      boardHeight: 3,
      difficulty: 'easy',
      arrows: [
        arrow('a', 'blue', 'right', [[0, 0], [2, 0]]),
        arrow('b', 'pink', 'right', [[0, 1], [2, 1]]),
        arrow('c', 'green', 'right', [[0, 2], [2, 2]]),
      ],
    };
    const m = analyzeLevel(level);
    expect(m.log10Orders).toBeCloseTo(Math.log10(6)); // 3! orders
    expect(m.forcedness).toBeCloseTo(0);
    expect(m.trapRate).toBe(0);
  });

  it('flags an arrow that looks free: gap ahead, blocker further down the lane', () => {
    const level: Level = {
      id: 93,
      boardWidth: 5,
      boardHeight: 2,
      difficulty: 'easy',
      arrows: [
        arrow('a', 'blue', 'right', [[0, 0], [1, 0]]), // empty (2,0), then b's body at (3,0)
        arrow('b', 'pink', 'down', [[3, 0], [3, 1]]),
      ],
    };
    const m = analyzeLevel(level);
    const a = m.arrows.find((x) => x.id === 'a')!;
    expect(a.tempting).toBe(true);
    expect(a.firstBlockerDistance).toBe(2);
    expect(m.deception).toBe(1);
  });

  it('maps scores to tiers', () => {
    expect(tierFor(10)).toBe('easy');
    expect(tierFor(30)).toBe('medium');
    expect(tierFor(50)).toBe('hard');
    expect(tierFor(80)).toBe('expert');
  });
});
