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

// Coin rewards, prices and the starting purse live in src/economy/config.ts.
