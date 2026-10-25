import { afterEach, beforeEach, describe, expect, it, mock, setSystemTime } from 'bun:test';
import type { Level } from '../src/types/level';
import type { StarCount } from '../src/types/game';

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

const config = await import('../src/economy/config');
const { calculateLevelReward, chestFor, dailyStreakBonus, isChapterEnd, levelBase, levelRewards } = await import('../src/economy/rewards');
const { usePlayerStore } = await import('../src/store/playerStore');
const { buildLevelResult } = await import('../src/game/session/buildLevelResult');
const { createGameState } = await import('../src/game/engine/createGameState');
const { processArrowTap } = await import('../src/game/engine/processArrowTap');
const { arrow } = await import('../src/game/levels/authoring');
const { LOCAL_LEVELS } = await import('../src/game/levels');

const EMPTY = { paidStars: {}, chestsClaimed: [], lastDailyBonusDay: null, streak: { count: 0, best: 0, lastPlayedDay: null } };

describe('calculateLevelReward', () => {
  it('pays the tier base times the star multiplier on a first clear', () => {
    expect(calculateLevelReward(1, 1, 0)).toBe(10);
    expect(calculateLevelReward(10, 2, 0)).toBe(13); // 12.5 rounds up
    expect(calculateLevelReward(11, 3, 0)).toBe(23); // 22.5 rounds up
    expect(calculateLevelReward(30, 2, 0)).toBe(19); // 18.75
    expect(calculateLevelReward(31, 1, 0)).toBe(25);
    expect(calculateLevelReward(55, 3, 0)).toBe(38); // 37.5
    expect(calculateLevelReward(56, 3, 0)).toBe(60);
    expect(calculateLevelReward(70, 2, 0)).toBe(50);
  });
  it('pays nothing for any replay, even one with more stars', () => {
    for (const prev of [1, 2, 3] as const) for (const stars of [1, 2, 3] as const) expect(calculateLevelReward(20, stars, prev)).toBe(0);
  });
  it('reads every number from economy/config', () => {
    expect(levelBase(5)).toBe(config.LEVEL_REWARD_TIERS[0].base);
    expect(levelBase(70)).toBe(config.LEVEL_REWARD_TIERS[config.LEVEL_REWARD_TIERS.length - 1].base);
  });
});

describe('chests and the daily bonus', () => {
  it('puts a chest on the last level of each chapter: coins, 2 hints and 1 hammer', () => {
    expect(chestFor(10)).toBeNull();
    expect(chestFor(13)).toBeNull();
    for (const id of [14, 28, 42, 56, 70]) {
      expect(isChapterEnd(id)).toBe(true);
      expect(chestFor(id)).toEqual({ kind: 'chest', coins: config.CHAPTER_REWARD.coins, boosts: { hint: 2, hammer: 1, life: 0 } });
    }
  });
  it('pays 20 a day and 100 on every 7th day of a streak', () => {
    expect([1, 2, 6, 7, 8, 14].map(dailyStreakBonus)).toEqual([20, 20, 20, 100, 20, 100]);
  });
  it('pays the daily bonus once per day, and a chest once', () => {
    const first = levelRewards(EMPTY, 14, 3, '2026-10-21');
    expect(first.chest).not.toBeNull();
    expect(first.dailyBonus).toBe(20);
    const later = levelRewards({ ...EMPTY, chestsClaimed: [14], lastDailyBonusDay: '2026-10-21' }, 14, 3, '2026-10-21');
    expect(later.chest).toBeNull();
    expect(later.dailyBonus).toBe(0);
  });
});

// One-arrow level, won in a single tap, with a chosen id.
const won = (id: number) => {
  const level: Level = { id, boardWidth: 3, boardHeight: 3, difficulty: 'simple', arrows: [arrow('a', 'blue', 'right', [[0, 0], [1, 0]])] };
  return processArrowTap(createGameState(level), 'a').state;
};

describe('paying a win is idempotent', () => {
  beforeEach(() => {
    setSystemTime(new Date(2026, 9, 21, 12));
    usePlayerStore.getState().resetProgress();
    usePlayerStore.setState({ coins: 0 });
  });
  afterEach(() => setSystemTime());

  it('pays once, even if the same win is applied twice (double tap, re-render)', () => {
    const p = usePlayerStore.getState();
    const result = buildLevelResult(won(14), { isFirstClear: true, ledger: p, today: '2026-10-21' });
    p.applyLevelResult(result, 15);
    usePlayerStore.getState().applyLevelResult(result, 15);
    const s = usePlayerStore.getState();
    expect(s.coins).toBe(result.coinsEarned);
    expect(result.coinsEarned).toBe(calculateLevelReward(14, 3, 0) + config.CHAPTER_REWARD.coins + config.DAILY_STREAK_BONUS.coins);
    expect(s.freeBoosts).toEqual({ hint: 2, hammer: 1, life: 0 });
    expect(s.paidStars[14]).toBe(3);
    expect(s.chestsClaimed).toEqual([14]);
  });
  it('pays nothing for a replay, even with more stars', () => {
    usePlayerStore.setState({ paidStars: { 56: 1 as StarCount }, completedLevels: [56], chestsClaimed: [56], lastDailyBonusDay: '2026-10-21' });
    const result = buildLevelResult(won(56), { isFirstClear: false, ledger: usePlayerStore.getState(), today: '2026-10-21' });
    expect(result.coinsEarned).toBe(0);
    expect(result.milestone).toBeNull();
    usePlayerStore.getState().applyLevelResult(result, null);
    expect(usePlayerStore.getState().coins).toBe(0);
  });
  it('starts a new player with STARTING_COINS', () => {
    usePlayerStore.getState().resetProgress();
    expect(usePlayerStore.getState().coins).toBe(30);
  });
});

describe('save upgrades', () => {
  it('marks what an existing player already earned as paid, so nothing is paid twice or lost', async () => {
    const opts = (usePlayerStore as unknown as { persist: { getOptions: () => { migrate: (p: unknown, v: number) => any } } }).persist.getOptions();
    const old = {
      coins: 55,
      completedLevels: [1, 2, 10, 11],
      stars: { 1: 3, 2: 2, 10: 1, 11: 3 },
      streak: { count: 3, best: 3, lastPlayedDay: '2026-10-20' },
      freeBoosts: { hint: 0, hammer: 0, life: 0 },
    };
    const up = opts.migrate(old, 6);
    expect(up.coins).toBe(55);
    expect(up.paidStars).toEqual(old.stars);
    expect(up.chestsClaimed).toEqual([10]);
    expect(up.lastDailyBonusDay).toBe('2026-10-20');
  });
  it('v8 counts chapters already finished as paid, and keeps coins and boosts', () => {
    const opts = (usePlayerStore as unknown as { persist: { getOptions: () => { migrate: (p: unknown, v: number) => any } } }).persist.getOptions();
    const old = {
      coins: 240,
      completedLevels: [1, 10, 13, 14, 15, 20],
      stars: {},
      streak: { count: 1, best: 1, lastPlayedDay: '2026-10-20' },
      freeBoosts: { hint: 1, hammer: 0, life: 0 },
      paidStars: {},
      chestsClaimed: [10, 20],
      lastDailyBonusDay: '2026-10-20',
    };
    const up = opts.migrate(old, 7);
    expect(up.coins).toBe(240);
    expect(up.freeBoosts).toEqual(old.freeBoosts);
    expect(up.chestsClaimed).toEqual([10, 20, 14]);
  });
});

describe('full playthrough, all 70 levels (first clears + chests + starting coins)', () => {
  const total = (stars: StarCount) =>
    config.STARTING_COINS +
    LOCAL_LEVELS.filter((l) => l.id <= 70).reduce((sum, l) => sum + calculateLevelReward(l.id, stars, 0) + (chestFor(l.id)?.coins ?? 0), 0);
  it('matches the planned totals', () => {
    expect(total(1)).toBe(2155);
    expect(total(2)).toBe(2565);
    expect(total(3)).toBe(2990);
  });
});
