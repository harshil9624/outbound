import { beforeEach, describe, expect, it, mock } from 'bun:test';
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

const { useGameStore } = await import('../src/store/gameStore');
const { usePlayerStore } = await import('../src/store/playerStore');
const { buyHeart, buyHint, hammerArrow, toggleHammer } = await import('../src/store/boostActions');
const { BOOST_COSTS } = await import('../src/constants/gameConfig');
const { arrow } = await import('../src/game/levels/authoring');

// a exits right freely; b points up into a (blocked until a leaves).
const level: Level = {
  id: 99,
  boardWidth: 3,
  boardHeight: 3,
  difficulty: 'easy',
  arrows: [arrow('a', 'blue', 'right', [[0, 0], [2, 0]]), arrow('b', 'pink', 'up', [[0, 2], [1, 2], [1, 1]])],
};

const coins = () => usePlayerStore.getState().coins;
const game = () => useGameStore.getState().game!;

beforeEach(() => {
  usePlayerStore.setState({ coins: 100 });
  useGameStore.getState().startLevel(level);
});

describe('hint', () => {
  it('highlights a free arrow and charges once', () => {
    expect(buyHint()).toEqual({ ok: true });
    expect(useGameStore.getState().hintArrowId).toBe('a');
    expect(coins()).toBe(100 - BOOST_COSTS.hint);
    expect(buyHint()).toEqual({ ok: false, reason: 'hint-shown' });
    expect(coins()).toBe(100 - BOOST_COSTS.hint);
  });
  it('refuses without enough coins and charges nothing', () => {
    usePlayerStore.setState({ coins: BOOST_COSTS.hint - 1 });
    expect(buyHint()).toEqual({ ok: false, reason: 'coins' });
    expect(useGameStore.getState().hintArrowId).toBeNull();
    expect(coins()).toBe(BOOST_COSTS.hint - 1);
  });
});

describe('hammer', () => {
  it('arms, smashes a blocked arrow, charges, and disarms', () => {
    expect(toggleHammer()).toEqual({ ok: true });
    expect(useGameStore.getState().hammerArmed).toBe(true);
    expect(coins()).toBe(100);
    expect(hammerArrow('b')).toEqual({ ok: true });
    expect(game().remainingIds).toEqual(['a']);
    expect(useGameStore.getState().smashingIds).toEqual(['b']);
    expect(useGameStore.getState().hammerArmed).toBe(false);
    expect(coins()).toBe(100 - BOOST_COSTS.hammer);
  });
  it('can be cancelled for free', () => {
    toggleHammer();
    expect(toggleHammer()).toEqual({ ok: true });
    expect(useGameStore.getState().hammerArmed).toBe(false);
    expect(coins()).toBe(100);
  });
  it('will not arm without enough coins', () => {
    usePlayerStore.setState({ coins: BOOST_COSTS.hammer - 1 });
    expect(toggleHammer()).toEqual({ ok: false, reason: 'coins' });
    expect(useGameStore.getState().hammerArmed).toBe(false);
  });
});

describe('+1 heart', () => {
  it('is refused at full hearts without charging', () => {
    expect(buyHeart()).toEqual({ ok: false, reason: 'hearts-full' });
    expect(coins()).toBe(100);
  });
  it('refills a lost heart and charges', () => {
    useGameStore.getState().tapArrow('b'); // blocked → 2 hearts
    expect(game().lives).toBe(2);
    expect(buyHeart()).toEqual({ ok: true });
    expect(game().lives).toBe(3);
    expect(coins()).toBe(100 - BOOST_COSTS.life);
  });
  it('revives a lost level', () => {
    for (let i = 0; i < 3; i++) useGameStore.getState().tapArrow('b');
    expect(game().status).toBe('lost');
    expect(buyHeart()).toEqual({ ok: true });
    expect(game().status).toBe('playing');
    expect(game().lives).toBe(1);
  });
});
