import { describe, expect, it } from 'bun:test';
import { calculateStars } from '../src/game/engine/calculateStars';
import { createGameState } from '../src/game/engine/createGameState';
import { processArrowTap } from '../src/game/engine/processArrowTap';
import { smashArrow } from '../src/game/engine/smashArrow';
import { level01 } from '../src/game/levels/level01';
import { buildLevelResult } from '../src/game/session/buildLevelResult';
import { solveLevel } from '../src/game/validation/solveLevel';
import { MAIN_ROUTE } from '../src/game/journey/progress';
import type { PlayerProgress } from '../src/game/journey/types';
import { winNextStep } from '../src/game/session/winNextStep';
import type { RewardLedger } from '../src/economy/rewards';

/** A player who has been paid nothing yet. */
const NEW_LEDGER: RewardLedger = { paidStars: {}, chestsClaimed: [], lastDailyBonusDay: null, streak: { count: 0, best: 0, lastPlayedDay: null } };

const all = () => true;
const upTo = (n: number) => (id: number) => id <= n;
const progress = (completed: number[], unlockedLevel: number): PlayerProgress => ({ completedLevels: completed, unlockedLevel, stars: {} });
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('win screen: where NEXT goes', () => {
  it('first clear moves on to the next route level', () => {
    const step = winNextStep({ levelId: 4, isFirstClear: true }, progress(range(1, 4), 5), all);
    expect(step).toEqual({ target: 5, isNatural: true, end: null });
  });

  it('a replay returns to the frontier, not replayed level + 1', () => {
    const step = winNextStep({ levelId: 3, isFirstClear: false }, progress(range(1, 11), 12), all);
    expect(step.target).toBe(12);
    expect(step.isNatural).toBe(false);
  });

  it('replaying the level just before the frontier is still a plain NEXT LEVEL', () => {
    const step = winNextStep({ levelId: 11, isFirstClear: false }, progress(range(1, 11), 12), all);
    expect(step).toEqual({ target: 12, isNatural: true, end: null });
  });

  it('a level off the route (bonus) returns to the frontier', () => {
    const step = winNextStep({ levelId: 9999, isFirstClear: true }, progress(range(1, 5), 6), all);
    expect(step.target).toBe(6);
  });

  it('end of the made levels says more are coming, not "all cleared"', () => {
    const step = winNextStep({ levelId: 8, isFirstClear: true }, progress(range(1, 8), 8), upTo(8));
    expect(step).toEqual({ target: null, isNatural: false, end: 'coming-soon' });
  });

  it('says "all cleared" only when every route level exists and is done', () => {
    const last = MAIN_ROUTE[MAIN_ROUTE.length - 1];
    const step = winNextStep({ levelId: last, isFirstClear: true }, progress([...MAIN_ROUTE], last), all);
    expect(step).toEqual({ target: null, isNatural: false, end: 'all-done' });
  });
});

describe('win screen: stats tiles agree with the stars', () => {
  // The win screen once lit MISTAKES and HELP (hints + hammers) green only at zero. Three stars must mean
  // both tiles are green, and a lost star must always show up in one of them.
  it.each([
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [2, 1, 1],
  ])('mistakes %d, hints %d, hammers %d', (mistakes, hintsUsed, hammersUsed) => {
    const stars = calculateStars({ mistakes, hintsUsed, hammersUsed });
    const allGreen = mistakes === 0 && hintsUsed + hammersUsed === 0;
    expect(stars === 3).toBe(allGreen);
  });
});

describe('win screen: every number on it is a real number', () => {
  const counters = ['moves', 'mistakes', 'hintsUsed', 'hammersUsed', 'coinsEarned'] as const;

  it('a level played to the win through the engine', () => {
    let state = createGameState(level01);
    for (const id of solveLevel(level01).order) state = processArrowTap(state, id).state;
    const result = buildLevelResult(state, { isFirstClear: true, ledger: NEW_LEDGER, today: '2026-10-21' });
    for (const k of counters) expect(Number.isFinite(result[k])).toBe(true);
    expect(result.hammersUsed).toBe(0);
    expect(result.stars).toBe(3);
  });

  it('a level cleared with the hammer counts it, and it shows as help', () => {
    let state = createGameState(level01);
    for (const id of [...state.arrowOrder]) state = smashArrow(state, id) ?? state;
    const result = buildLevelResult(state, { isFirstClear: true, ledger: NEW_LEDGER, today: '2026-10-21' });
    for (const k of counters) expect(Number.isFinite(result[k])).toBe(true);
    expect(result.hammersUsed).toBe(level01.arrows.length);
    expect(result.hintsUsed + result.hammersUsed).toBeGreaterThan(0);
    expect(result.stars).toBeLessThan(3);
  });
});
