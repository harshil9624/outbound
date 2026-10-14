import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import type { Level } from '../src/types/level';

// MMKV is native; give the stores an in-memory stand-in.
mock.module('react-native-mmkv', () => ({
  MMKV: class {
    private map = new Map<string, string>();
    getString(k: string) {
      return this.map.get(k);
    }
    set(k: string, v: string) {
      this.map.set(k, v);
    }
    delete(k: string) {
      this.map.delete(k);
    }
  },
}));

const { CHALLENGE_PERK, CHAPTER_CHEST, NO_FREE_BOOSTS, milestoneFor } = await import('../src/game/progression/milestones');
const { buildLevelResult } = await import('../src/game/session/buildLevelResult');
const { createGameState } = await import('../src/game/engine/createGameState');
const { processArrowTap } = await import('../src/game/engine/processArrowTap');
const { useGameStore } = await import('../src/store/gameStore');
const { usePlayerStore } = await import('../src/store/playerStore');
const { buyHeart, buyHint, hammerArrow, toggleHammer } = await import('../src/store/boostActions');
const { BOOST_COSTS } = await import('../src/constants/gameConfig');
const { arrow } = await import('../src/game/levels/authoring');

const MASTERS = [14, 28, 42, 56, 70];
const CHALLENGES = [8, 22, 36, 50, 64];

describe('milestone rewards', () => {
  it('opens a chapter chest on every master level and a perk on every challenge level', () => {
    for (const id of MASTERS) expect(milestoneFor(id, true)).toBe(CHAPTER_CHEST);
    for (const id of CHALLENGES) expect(milestoneFor(id, true)).toBe(CHALLENGE_PERK);
  });
  it('gives nothing on regular levels or on replays', () => {
    for (const id of [1, 9, 13, 15, 29, 69]) expect(milestoneFor(id, true)).toBeNull();
    for (const id of [...MASTERS, ...CHALLENGES]) expect(milestoneFor(id, false)).toBeNull();
  });
  it('adds a chest’s coins to the level’s own reward', () => {
    // A one-arrow level, won in one tap, standing in for a master level's id.
    const level: Level = { id: 14, boardWidth: 3, boardHeight: 3, difficulty: 'simple', arrows: [arrow('a', 'blue', 'right', [[0, 0], [1, 0]])] };
    const won = processArrowTap(createGameState(level), 'a').state;
    const result = buildLevelResult(won, { isFirstClear: true });
    expect(result.milestone).toBe(CHAPTER_CHEST);
    expect(result.coinsEarned).toBe(result.reward.total + CHAPTER_CHEST.coins);
    expect(buildLevelResult(won, { isFirstClear: false }).milestone).toBeNull();
  });
});

// a exits right freely; b points up into a (blocked until a leaves).
const level: Level = {
  id: 99,
  boardWidth: 3,
  boardHeight: 3,
  difficulty: 'easy',
  arrows: [arrow('a', 'blue', 'right', [[0, 0], [2, 0]]), arrow('b', 'pink', 'up', [[0, 2], [1, 2], [1, 1]])],
};
const coins = () => usePlayerStore.getState().coins;
const free = () => usePlayerStore.getState().freeBoosts;

describe('free boosts', () => {
  beforeEach(() => {
    usePlayerStore.setState({ coins: 0, freeBoosts: { hint: 1, hammer: 1, life: 1 } });
    useGameStore.getState().startLevel(level);
  });
  afterEach(() => usePlayerStore.setState({ freeBoosts: NO_FREE_BOOSTS }));

  it('uses a free hint even with no coins', () => {
    expect(buyHint()).toEqual({ ok: true });
    expect(free().hint).toBe(0);
    expect(coins()).toBe(0);
  });
  it('uses a free hammer before coins', () => {
    usePlayerStore.setState({ coins: 100 });
    expect(toggleHammer()).toEqual({ ok: true });
    expect(hammerArrow('b')).toEqual({ ok: true });
    expect(free().hammer).toBe(0);
    expect(coins()).toBe(100);
    // Next hammer is paid in coins.
    expect(toggleHammer()).toEqual({ ok: true });
    expect(hammerArrow('a')).toEqual({ ok: true });
    expect(coins()).toBe(100 - BOOST_COSTS.hammer);
  });
  it('uses a free heart, and a failed boost costs nothing', () => {
    // Hearts are full: refused, and the free heart is kept.
    expect(buyHeart()).toEqual({ ok: false, reason: 'hearts-full' });
    expect(free().life).toBe(1);
    useGameStore.getState().tapArrow('b'); // blocked: loses a heart
    expect(buyHeart()).toEqual({ ok: true });
    expect(free().life).toBe(0);
    expect(coins()).toBe(0);
  });
  it('adds a chest’s boosts when the player wins a master level', () => {
    usePlayerStore.setState({ freeBoosts: NO_FREE_BOOSTS });
    const one: Level = { id: 14, boardWidth: 3, boardHeight: 3, difficulty: 'simple', arrows: [arrow('a', 'blue', 'right', [[0, 0], [1, 0]])] };
    const result = buildLevelResult(processArrowTap(createGameState(one), 'a').state, { isFirstClear: true });
    usePlayerStore.getState().applyLevelResult(result, 15);
    expect(free()).toEqual(CHAPTER_CHEST.boosts);
    expect(coins()).toBe(result.coinsEarned);
  });
});
