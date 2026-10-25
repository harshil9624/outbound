/**
 * Pure reward rules. The win screen (to show what was earned) and the player store (to pay it)
 * both call levelRewards with the same inputs, so what's shown is exactly what's paid.
 */
import type { MilestoneReward, StarCount } from '../types/game';
import { registerPlayDay, type StreakState } from '../game/progression/streak';
import { CHAPTERS } from '../game/journey/chapters';
import { CHAPTER_REWARD, DAILY_STREAK_BONUS, LEVEL_REWARD_TIERS, STAR_MULTIPLIER } from './config';

/** The level's base reward, from its tier. */
export function levelBase(levelId: number): number {
  return (LEVEL_REWARD_TIERS.find((t) => levelId <= t.upToLevel) ?? LEVEL_REWARD_TIERS[LEVEL_REWARD_TIERS.length - 1]).base;
}

function starValue(levelId: number, stars: StarCount | 0): number {
  return stars === 0 ? 0 : Math.round(levelBase(levelId) * STAR_MULTIPLIER[stars]);
}

/**
 * Coins for clearing `levelId` with `stars`, given the best stars already paid for that level
 * (0 = never cleared). Paid once, on the first clear; replays pay 0.
 */
export function calculateLevelReward(levelId: number, stars: StarCount, previousBestStars: StarCount | 0): number {
  return previousBestStars > 0 ? 0 : starValue(levelId, stars);
}

/** True for a chapter's last level: clearing it completes the chapter. */
export function isChapterEnd(levelId: number): boolean {
  return CHAPTERS.some((c) => c.levelIds[c.levelIds.length - 1] === levelId);
}

/** The chapter-completion chest a level holds (each chapter's last level), or null. */
export function chestFor(levelId: number): MilestoneReward | null {
  if (!isChapterEnd(levelId)) return null;
  return { kind: 'chest', coins: CHAPTER_REWARD.coins, boosts: { ...CHAPTER_REWARD.boosts } };
}

/** Daily bonus for the day a streak reaches `streakCount` days. */
export function dailyStreakBonus(streakCount: number): number {
  return streakCount > 0 && streakCount % DAILY_STREAK_BONUS.everyDays === 0 ? DAILY_STREAK_BONUS.weeklyCoins : DAILY_STREAK_BONUS.coins;
}

/** What the player has already been paid: the claimed flags rewards are checked against. */
export interface RewardLedger {
  /** Best stars already paid for, per level. */
  paidStars: Record<number, StarCount>;
  /** Chest levels already paid out (chapter ends; every 10th level before save v8). */
  chestsClaimed: number[];
  /** The local day the daily streak bonus was last paid. */
  lastDailyBonusDay: string | null;
  streak: StreakState;
}

export interface LevelRewards {
  /** Coins for the level itself (0 on a replay). */
  levelCoins: number;
  chest: MilestoneReward | null;
  dailyBonus: number;
  /** Everything above in coins. */
  totalCoins: number;
  /** The streak after counting today. */
  streak: StreakState;
}

/** Everything a win pays, checked against what was already paid. Pure; no side effects. */
export function levelRewards(ledger: RewardLedger, levelId: number, stars: StarCount, today: string): LevelRewards {
  const levelCoins = calculateLevelReward(levelId, stars, ledger.paidStars[levelId] ?? 0);
  const chest = ledger.chestsClaimed.includes(levelId) ? null : chestFor(levelId);
  const streak = registerPlayDay(ledger.streak, today);
  const dailyBonus = ledger.lastDailyBonusDay === today ? 0 : dailyStreakBonus(streak.count);
  return { levelCoins, chest, dailyBonus, totalCoins: levelCoins + (chest?.coins ?? 0) + dailyBonus, streak };
}
