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

export const REWARD_TABLE: RewardTable = {
  base: { easy: 10, normal: 15, hard: 25 },
  perStar: 5,
  firstClearBonus: 10,
};

/** Coin prices of the in-level boosts. */
export const BOOST_COSTS = {
  hint: 15,
  hammer: 40,
  life: 30,
} as const;

/** A new player's purse, so boosts are usable from level 1. */
export const STARTING_COINS = 100;
