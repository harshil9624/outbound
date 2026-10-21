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
const { calculateLevelReward, chestFor, dailyStreakBonus, levelBase, levelRewards } = await import('../src/economy/rewards');
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
  it('pays only the difference when a replay beats the old best', () => {
    expect(calculateLevelReward(56, 3, 1)).toBe(60 - 40);
    expect(calculateLevelReward(56, 2, 1)).toBe(50 - 40);
    expect(calculateLevelReward(10, 3, 2)).toBe(15 - 13);
    // First clear + every improvement adds up to exactly the 3-star reward.
    expect(calculateLevelReward(40, 1, 0) + calculateLevelReward(40, 2, 1) + calculateLevelReward(40, 3, 2)).toBe(calculateLevelReward(40, 3, 0));
  });
  it('pays nothing for a replay that does not beat the best', () => {
    for (const prev of [1, 2, 3] as const) for (const stars of [1, 2, 3] as const) if (stars <= prev) expect(calculateLevelReward(20, stars, prev)).toBe(0);
  });
  it('reads every number from economy/config', () => {
    expect(levelBase(5)).toBe(config.LEVEL_REWARD_TIERS[0].base);
    expect(levelBase(70)).toBe(config.LEVEL_REWARD_TIERS[config.LEVEL_REWARD_TIERS.length - 1].base);
  });
});

describe('chests and the daily bonus', () => {
  it('puts a chest on every 10th level, the free boost rotating', () => {
    expect(chestFor(9)).toBeNull();
    expect(chestFor(10)).toEqual({ kind: 'chest', coins: 100, boosts: { hint: 0, hammer: 1, life: 0 } });
    expect(chestFor(20)?.boosts).toEqual({ hint: 1, hammer: 0, life: 0 });
    expect(chestFor(30)?.boosts).toEqual({ hint: 0, hammer: 0, life: 1 });
    expect(chestFor(40)?.boosts.hammer).toBe(1);
  });
  it('pays 20 a day and 100 on every 7th day of a streak', () => {
    expect([1, 2, 6, 7, 8, 14].map(dailyStreakBonus)).toEqual([20, 20, 20, 100, 20, 100]);
  });
  it('pays the daily bonus once per day, and a chest once', () => {
    const first = levelRewards(EMPTY, 10, 3, '2026-10-21');
    expect(first.chest).not.toBeNull();
    expect(first.dailyBonus).toBe(20);
    const later = levelRewards({ ...EMPTY, chestsClaimed: [10], lastDailyBonusDay: '2026-10-21' }, 10, 3, '2026-10-21');
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
    const result = buildLevelResult(won(10), { isFirstClear: true, ledger: p, today: '2026-10-21' });
    p.applyLevelResult(result, 11);
    usePlayerStore.getState().applyLevelResult(result, 11);
    const s = usePlayerStore.getState();
    expect(s.coins).toBe(result.coinsEarned);
    expect(result.coinsEarned).toBe(calculateLevelReward(10, 3, 0) + config.LEVEL_CHEST.coins + config.DAILY_STREAK_BONUS.coins);
    expect(s.freeBoosts.hammer).toBe(1);
    expect(s.paidStars[10]).toBe(3);
    expect(s.chestsClaimed).toEqual([10]);
  });
  it('pays a replay only for the stars it improves', () => {
    usePlayerStore.setState({ paidStars: { 56: 1 as StarCount }, completedLevels: [56], lastDailyBonusDay: '2026-10-21' });
    const result = buildLevelResult(won(56), { isFirstClear: false, ledger: usePlayerStore.getState(), today: '2026-10-21' });
    expect(result.coinsEarned).toBe(60 - 40);
    usePlayerStore.getState().applyLevelResult(result, null);
    expect(usePlayerStore.getState().coins).toBe(20);
  });
});

describe('save upgrade to v7', () => {
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
});

describe('full playthrough, all 70 levels (first clears + chests + starting coins)', () => {
  const total = (stars: StarCount) =>
    config.STARTING_COINS +
    LOCAL_LEVELS.filter((l) => l.id <= 70).reduce((sum, l) => sum + calculateLevelReward(l.id, stars, 0) + (chestFor(l.id)?.coins ?? 0), 0);
  it('matches the planned totals', () => {
    expect(total(1)).toBe(2425);
    expect(total(2)).toBe(2835);
    expect(total(3)).toBe(3260);
  });
});
