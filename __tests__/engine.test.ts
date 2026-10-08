import { describe, expect, it } from 'bun:test';
import { createGameState } from '../src/game/engine/createGameState';
import { canArrowExit } from '../src/game/engine/canArrowExit';
import { processArrowTap } from '../src/game/engine/processArrowTap';
import { undoMove } from '../src/game/engine/undoMove';
import { findHint } from '../src/game/engine/findHint';
import { smashArrow } from '../src/game/engine/smashArrow';
import { addLife, canAddLife } from '../src/game/engine/addLife';
import { checkWin } from '../src/game/engine/checkWin';
import { calculateStars } from '../src/game/engine/calculateStars';
import { calculateReward } from '../src/game/engine/calculateReward';
import { computeBoardLayout, cellCenterPx } from '../src/game/layout/boardLayout';
import { hitTestArrow } from '../src/game/layout/hitTest';
import { buildOccupancy } from '../src/game/engine/occupancy';
import { validateLevel } from '../src/game/validation/validateLevel';
import { registerPlayDay, getActiveStreak, getStreakDays, INITIAL_STREAK } from '../src/game/progression/streak';
import { arrow } from '../src/game/levels/authoring';
import { LOCAL_LEVELS } from '../src/game/levels';
import type { Level } from '../src/types/level';

// a → exits right freely. b (L-shape) points up into a.
const level: Level = {
  id: 99,
  boardWidth: 3,
  boardHeight: 3,
  difficulty: 'easy',
  arrows: [
    arrow('a', 'yellow', 'right', [[0, 0], [2, 0]]),
    arrow('b', 'blue', 'up', [[2, 2], [0, 2], [0, 1]]),
  ],
};

describe('canArrowExit', () => {
  it('is true for a clear path and false when blocked', () => {
    const s = createGameState(level);
    expect(canArrowExit(s, 'a')).toBe(true);
    expect(canArrowExit(s, 'b')).toBe(false);
  });
});

describe('processArrowTap', () => {
  it('blocked tap costs a life and records the blocker', () => {
    const { state, result } = processArrowTap(createGameState(level), 'b');
    expect(result.kind).toBe('blocked');
    if (result.kind === 'blocked') expect(result.blockerId).toBe('a');
    expect(state.lives).toBe(2);
    expect(state.mistakes).toBe(1);
  });

  it('removing a blocker unblocks the next arrow and wins', () => {
    let s = processArrowTap(createGameState(level), 'a').state;
    expect(canArrowExit(s, 'b')).toBe(true);
    s = processArrowTap(s, 'b').state;
    expect(checkWin(s)).toBe(true);
    expect(s.status).toBe('won');
  });

  it('loses when lives run out', () => {
    let s = createGameState(level);
    for (let i = 0; i < 3; i++) s = processArrowTap(s, 'b').state;
    expect(s.status).toBe('lost');
    expect(processArrowTap(s, 'a').result.kind).toBe('ignored');
  });

  it('does not mutate its input', () => {
    const s = createGameState(level);
    processArrowTap(s, 'a');
    expect(s.remainingIds).toEqual(['a', 'b']);
  });
});

describe('undo + hint', () => {
  it('undo restores the last removed arrow in authoring order', () => {
    const s = processArrowTap(createGameState(level), 'a').state;
    expect(undoMove(s).remainingIds).toEqual(['a', 'b']);
  });
  it('hint returns a currently free arrow', () => {
    expect(findHint(createGameState(level))).toBe('a');
  });
});

describe('boosts', () => {
  it('hammer removes a blocked arrow and can win the level', () => {
    const s = smashArrow(createGameState(level), 'b')!;
    expect(s.remainingIds).toEqual(['a']);
    expect(s.hammersUsed).toBe(1);
    expect(s.mistakes).toBe(0);
    const won = smashArrow(s, 'a')!;
    expect(won.status).toBe('won');
    expect(smashArrow(won, 'a')).toBeNull();
  });
  it('extra life refills one heart and revives a lost game', () => {
    const full = createGameState(level);
    expect(canAddLife(full)).toBe(false);
    let s = full;
    for (let i = 0; i < 3; i++) s = processArrowTap(s, 'b').state;
    expect(s.status).toBe('lost');
    const revived = addLife(s);
    expect(revived.lives).toBe(1);
    expect(revived.status).toBe('playing');
  });
});

describe('stars + reward', () => {
  it('scores stars by penalty', () => {
    expect(calculateStars({ mistakes: 0, hintsUsed: 0 })).toBe(3);
    expect(calculateStars({ mistakes: 1, hintsUsed: 1 })).toBe(2);
    expect(calculateStars({ mistakes: 3, hintsUsed: 0 })).toBe(1);
    expect(calculateStars({ mistakes: 0, hintsUsed: 0, hammersUsed: 1 })).toBe(2);
  });
  it('only first clears pay coins', () => {
    const first = calculateReward({ difficulty: 'normal', stars: 3, isFirstClear: true });
    const replay = calculateReward({ difficulty: 'normal', stars: 3, isFirstClear: false });
    expect(first.total).toBe(15 + 15 + 10);
    expect(replay.total).toBe(0);
  });
});

describe('hitTestArrow', () => {
  const s = createGameState(level);
  const layout = computeBoardLayout({ availableWidth: 300, availableHeight: 300, columns: 3, rows: 3 });
  const occ = buildOccupancy(s);
  it('selects the arrow owning the tapped cell', () => {
    const c = cellCenterPx(layout, { x: 1, y: 2 });
    expect(hitTestArrow(s, occ, layout, c.x, c.y)).toBe('b');
  });
  it('rejects an ambiguous tap in an empty cell between two arrows', () => {
    const c = cellCenterPx(layout, { x: 1, y: 1 });
    expect(hitTestArrow(s, occ, layout, c.x, c.y)).toBeNull();
  });
});

describe('levels', () => {
  it.each(LOCAL_LEVELS.map((l) => [l.id, l] as const))('level %i is valid and solvable', (_id, l) => {
    const r = validateLevel(l);
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(true);
  });
  it('rejects overlapping arrows', () => {
    const bad: Level = { ...level, arrows: [...level.arrows, arrow('c', 'red', 'down', [[1, 0], [1, 1]])] };
    expect(validateLevel(bad).valid).toBe(false);
  });
});

describe('streak', () => {
  it('increments on consecutive days and resets after a gap', () => {
    let s = registerPlayDay(INITIAL_STREAK, '2026-09-01');
    s = registerPlayDay(s, '2026-09-02');
    expect(s.count).toBe(2);
    expect(getActiveStreak(s, '2026-09-05')).toBe(0);
    expect(registerPlayDay(s, '2026-09-05').count).toBe(1);
  });
  it('marks the active streak days in the week window, across a month boundary', () => {
    let s = registerPlayDay(INITIAL_STREAK, '2026-08-30');
    s = registerPlayDay(s, '2026-08-31');
    s = registerPlayDay(s, '2026-09-01');
    const days = getStreakDays(s, '2026-09-02');
    expect(days.map((d) => d.day)).toEqual([
      '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02',
    ]);
    expect(days.map((d) => d.played)).toEqual([false, false, false, true, true, true, false]);
    expect(getStreakDays(s, '2026-09-05').some((d) => d.played)).toBe(false);
  });
});

describe('streak rewards and calendar', () => {
  it('pays each reached milestone once and backfills streak days', async () => {
    const { claimableMilestones, streakDayKeys } = await import('../src/game/progression/streak');
    expect(claimableMilestones(8, [])).toEqual([2, 3, 5, 7]);
    expect(claimableMilestones(8, [2, 3])).toEqual([5, 7]);
    expect(streakDayKeys({ count: 3, best: 3, lastPlayedDay: '2026-09-01' })).toEqual(['2026-08-30', '2026-08-31', '2026-09-01']);
  });
  it('lays out a month in Sunday-first weeks', async () => {
    const { monthGrid } = await import('../src/game/progression/calendar');
    const oct = monthGrid(2026, 9); // October 2026 starts on a Thursday
    expect(oct[0]).toEqual([null, null, null, null, '2026-10-01', '2026-10-02', '2026-10-03']);
    expect(oct.flat().filter(Boolean)).toHaveLength(31);
  });
});
