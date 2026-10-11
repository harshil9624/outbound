import type { Difficulty } from '../types/level';
import type { GameRules } from '../types/game';

export const DEFAULT_GAME_RULES: GameRules = {
  maxLives: 3,
  blockedTapCostsLife: true,
};

/** Penalty = mistakes * mistakeWeight + hints * hintWeight + hammers * hammerWeight. */
export const STAR_RULES = {
  mistakeWeight: 1,
  hintWeight: 1,
  hammerWeight: 1,
  threeStarMaxPenalty: 0,
  twoStarMaxPenalty: 2,
} as const;

export interface RewardTable {
  base: Record<Difficulty, number>;
  perStar: number;
  firstClearBonus: number;
}

/**
 * Small, steady rewards: a win pays 7–18 coins (first clear only), so a hint costs about 1–2 wins,
 * a heart 2–4 and a hammer 3–5. Boosts stay worth thinking about, and coins keep their value
 * (about 900 across all 70 levels). Common practice in casual puzzle games; rewarded ads come later.
 */
export const REWARD_TABLE: RewardTable = {
  base: { simple: 5, easy: 6, normal: 8, hard: 10, 'extra-hard': 12 },
  perStar: 2,
  firstClearBonus: 0,
};

/** Coin prices of the in-level boosts. */
export const BOOST_COSTS = {
  hint: 15,
  hammer: 40,
  life: 30,
} as const;

/** A new player's purse. Below every boost price: the first boost is earned by winning a level or two. */
export const STARTING_COINS = 10;
