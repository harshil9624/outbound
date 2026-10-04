import { describe, expect, it } from 'bun:test';
import { CHAPTERS } from '../src/game/journey/chapters';
import { MAP_COLUMNS, layoutChapter } from '../src/game/journey/layout';
import { applyProgress, currentLevelId, nextMainLevel } from '../src/game/journey/progress';
import {
  arrivalDirection,
  between,
  pointAlong,
  polylineLengthPx,
  routePx,
  splitAt,
  trimEnd,
  zoneGeometry,
} from '../src/game/journey/mapGeometry';
import type { ChapterDef, GridPoint } from '../src/game/journey/types';

const all = () => true;

function onSegment(p: GridPoint, a: GridPoint, b: GridPoint) {
  const within = (v: number, s: number, e: number) => v >= Math.min(s, e) - 1e-9 && v <= Math.max(s, e) + 1e-9;
  return (a.x === b.x && p.x === a.x && within(p.y, a.y, b.y)) || (a.y === b.y && p.y === a.y && within(p.x, a.x, b.x));
}

describe('chapter layouts (every route style, full chapter)', () => {
  it.each(CHAPTERS.map((c) => [c.title, c] as const))('%s', (_title, chapter) => {
    const layout = layoutChapter(chapter, all);
    const main = layout.nodes.filter((n) => n.kind !== 'bonus');
    expect(main.map((n) => n.levelId)).toEqual(chapter.levelIds);
    expect(main[main.length - 1].kind).toBe('master');

    // Orthogonal only, on screen, and never going down.
    for (let i = 1; i < layout.route.length; i++) {
      const a = layout.route[i - 1];
      const b = layout.route[i];
      expect(a.x === b.x || a.y === b.y).toBe(true);
      expect(b.y).toBeGreaterThanOrEqual(a.y);
    }
    for (const p of layout.route) expect(p.x >= 0 && p.x <= MAP_COLUMNS - 1).toBe(true);

    // The route passes through every main node.
    for (const n of main) {
      expect(layout.route.some((_, i) => i > 0 && onSegment(n, layout.route[i - 1], layout.route[i]))).toBe(true);
    }

    // Tiles never crowd each other: 2 columns apart on a row, or at least a row apart.
    for (let i = 0; i < main.length; i++) {
      for (let j = i + 1; j < main.length; j++) {
        const dx = Math.abs(main[i].x - main[j].x);
        const dy = Math.abs(main[i].y - main[j].y);
        expect(dx >= 2 || dy >= 1).toBe(true);
      }
    }
  });

  it('is deterministic and stable when more levels are added', () => {
    const ch = CHAPTERS[0];
    const partial = layoutChapter(ch, (id) => id <= 8);
    const full = layoutChapter(ch, all);
    expect(partial.nodes.map((n) => n.levelId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    partial.nodes.forEach((n, i) => expect({ x: n.x, y: n.y }).toEqual({ x: full.nodes[i].x, y: full.nodes[i].y }));
    expect(layoutChapter(ch, all)).toEqual(full);
    // No master gate until the chapter's last level exists.
    expect(partial.nodes.some((n) => n.kind === 'master')).toBe(false);
  });

  it('places a bonus spur beside the master gate', () => {
    const ch: ChapterDef = { ...CHAPTERS[0], bonus: { levelId: 900, starsRequired: 30 } };
    const layout = layoutChapter(ch, all);
    const bonus = layout.nodes.find((n) => n.kind === 'bonus')!;
    const master = layout.nodes.find((n) => n.kind === 'master')!;
    expect(bonus.y).toBe(master.y);
    expect(layout.spur).not.toBeNull();
  });
});

describe('progress', () => {
  const exists = (id: number) => id <= 8;

  it('unlocks along the main route and stops at the end of available content', () => {
    expect(nextMainLevel(1, exists)).toBe(2);
    expect(nextMainLevel(8, exists)).toBeNull();
    expect(nextMainLevel(900, exists)).toBeNull();
  });

  it('finds the current level and labels every node', () => {
    const progress = { unlockedLevel: 4, completedLevels: [1, 2, 3], stars: { 1: 3, 2: 2, 3: 1 } as const };
    const current = currentLevelId(progress, exists);
    expect(current).toBe(4);
    const nodes = applyProgress(layoutChapter(CHAPTERS[0], exists), progress, current);
    expect(nodes.map((n) => n.state)).toEqual(['perfect', 'completed', 'completed', 'current', 'locked', 'locked', 'locked', 'locked']);
    expect(nodes[7].kind).toBe('challenge');
  });

  it('has no current level once everything available is finished', () => {
    const progress = { unlockedLevel: 8, completedLevels: [1, 2, 3, 4, 5, 6, 7, 8], stars: {} };
    expect(currentLevelId(progress, exists)).toBeNull();
  });
});

describe('map geometry', () => {
  const layout = layoutChapter(CHAPTERS[0], (id) => id <= 8);
  const geo = zoneGeometry(layout, 360);

  it('maps the grid into the zone, bottom-up', () => {
    const a = geo.toPx({ x: 0, y: 0 });
    const b = geo.toPx({ x: 4, y: 1 });
    expect(a.x).toBeLessThan(b.x);
    expect(a.y).toBeGreaterThan(b.y);
    expect(b.x).toBeLessThan(360);
  });

  it('splits the route at a tile and walks between tiles', () => {
    const pts = routePx(layout, geo, false);
    const n4 = geo.toPx(layout.nodes[3]);
    const { before, after } = splitAt(pts, n4);
    expect(before[before.length - 1]).toEqual(n4);
    expect(after[0]).toEqual(n4);
    expect(polylineLengthPx(before) + polylineLengthPx(after)).toBeCloseTo(polylineLengthPx(pts));
    const n3 = geo.toPx(layout.nodes[2]);
    const leg = between(pts, n3, n4);
    expect(leg[0]).toEqual(n3);
    expect(leg[leg.length - 1]).toEqual(n4);
    const xs = leg.map((p) => p.x);
    const ys = leg.map((p) => p.y);
    expect(pointAlong(xs, ys, polylineLengthPx(leg))).toEqual(n4);
    expect(arrivalDirection(leg)).toEqual({ x: 0, y: -1 }); // tile 4 is reached going up
  });
});

describe('trimEnd', () => {
  it('stops short of the end by the given distance', () => {
    const pts = [{ x: 0, y: 100 }, { x: 0, y: 0 }, { x: 80, y: 0 }];
    const t = trimEnd(pts, 50);
    expect(polylineLengthPx(t)).toBeCloseTo(130);
    expect(t[t.length - 1]).toEqual({ x: 30, y: 0 });
  });
});
