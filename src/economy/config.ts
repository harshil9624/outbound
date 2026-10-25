/**
 * Every price, reward, cap and multiplier in the game, in one place. No economy number lives
 * anywhere else: screens, stores and rules all read from here.
 *
 * Balanced for rewarded ads later (not added yet): wins pay steadily, but a boost costs a couple
 * of wins, so a future "watch an ad for a free hint / heart / double coins" stays worth it.
 */
import type { BoostKind, StarCount } from '../types/game';

/** A new player's purse, given once (existing players keep their balance). */
export const STARTING_COINS = 30;

/** Coins for a level's first clear, by level number (the last tier runs to the end of the game). Replays pay nothing. */
export const LEVEL_REWARD_TIERS: readonly { upToLevel: number; base: number }[] = [
  { upToLevel: 10, base: 10 },
  { upToLevel: 30, base: 15 },
  { upToLevel: 55, base: 25 },
  { upToLevel: Infinity, base: 40 },
];

/** Stars multiply the level's base (rounded). */
export const STAR_MULTIPLIER: Record<StarCount, number> = { 1: 1, 2: 1.25, 3: 1.5 };

/**
 * Boost prices. Raised (from 15 / 40 / 30) along with the bigger level rewards, so a boost still
 * costs about the same number of wins as before: hint ~1.5, heart ~2.5, hammer ~3.5 wins.
 */
export const BOOST_COSTS: Record<BoostKind, number> = {
  hint: 45,
  hammer: 100,
  life: 75,
};

/** Paid once per chapter, on the first clear of its last level: coins plus free boosts. */
export const CHAPTER_REWARD = {
  coins: 100,
  boosts: { hint: 2, hammer: 1, life: 0 } satisfies Record<BoostKind, number>,
} as const;

/** Paid on the first level cleared each day: more on every 7th day of a streak. */
export const DAILY_STREAK_BONUS = {
  coins: 20,
  weeklyCoins: 100,
  everyDays: 7,
} as const;

/** One-time streak chests on the Streak screen, by best streak length. */
export const STREAK_CHESTS: readonly { days: number; coins: number }[] = [
  { days: 2, coins: 10 },
  { days: 3, coins: 15 },
  { days: 5, coins: 25 },
  { days: 7, coins: 50 },
  { days: 10, coins: 60 },
  { days: 14, coins: 100 },
  { days: 21, coins: 150 },
  { days: 30, coins: 250 },
];

/** One free streak freeze per this many days. */
export const FREEZE_EVERY_DAYS = 7;

/** Testing tools' coin buttons (Settings → Testing tools). */
export const DEV_COIN_GRANTS = [100, 1000] as const;

/** One-time top-up given by the v2 save upgrade (players from before coin-priced boosts). */
export const LEGACY_V2_STARTER_GRANT = 100;
