import type { Difficulty } from '../types/level';
import type { GameRules } from '../types/game';

export const DEFAULT_GAME_RULES: GameRules = {
  maxLives: 3,
  blockedTapCostsLife: true,
};

/** Penalty = mistakes * mistakeWeight + hints * hintWeight. */
export const STAR_RULES = {
  mistakeWeight: 1,
  hintWeight: 1,
  threeStarMaxPenalty: 0,
  twoStarMaxPenalty: 2,
} as const;

export interface RewardTable {
  base: Record<Difficulty, number>;
  perStar: number;
  firstClearBonus: number;
  replayMultiplier: number;
}

export const REWARD_TABLE: RewardTable = {
  base: { easy: 10, normal: 15, hard: 25 },
  perStar: 5,
  firstClearBonus: 10,
  replayMultiplier: 0.2,
};

/** 0 = free. Hook point for the coin economy / rewarded hints later. */
export const HINT_COIN_COST = 0;
