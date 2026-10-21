import type { Point } from './geometry';
import type { ArrowPath, Difficulty } from './level';

/** An arrow after normalization: every cell it occupies is precomputed. */
export interface BoardArrow extends ArrowPath {
  cells: Point[];
  head: Point;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface MoveRecord {
  arrowId: string;
}

export interface GameRules {
  maxLives: number;
  blockedTapCostsLife: boolean;
}

/** Pure, serializable puzzle state. No React, no animation data. */
export interface GameState {
  levelId: number;
  difficulty: Difficulty;
  boardWidth: number;
  boardHeight: number;
  arrows: Record<string, BoardArrow>;
  /** Authoring order; used for stable render order and deterministic hints. */
  arrowOrder: string[];
  remainingIds: string[];
  removedIds: string[];
  lives: number;
  maxLives: number;
  moves: number;
  mistakes: number;
  hintsUsed: number;
  /** Arrows removed with the hammer boost. */
  hammersUsed: number;
  undosUsed: number;
  status: GameStatus;
  history: MoveRecord[];
}

export type TapResult =
  | { kind: 'exited'; arrowId: string; exitPath: Point[] }
  | {
      kind: 'blocked';
      arrowId: string;
      blockerId: string;
      blockedAt: Point;
      lifeLost: boolean;
    }
  | { kind: 'ignored'; arrowId: string; reason: 'not-playing' | 'unknown-arrow' | 'already-removed' };

export interface TapOutcome {
  state: GameState;
  result: TapResult;
}

export interface RewardBreakdown {
  base: number;
  starBonus: number;
  firstClearBonus: number;
  total: number;
}

export type StarCount = 1 | 2 | 3;

/** The three coin-priced boosts. */
export type BoostKind = 'hint' | 'hammer' | 'life';
/** Boosts the player holds for free (won from milestones); used before any coins are spent. */
export type FreeBoosts = Record<BoostKind, number>;

/** The chest on every 10th level (see economy/config LEVEL_CHEST). */
export interface MilestoneReward {
  kind: 'chest';
  coins: number;
  boosts: FreeBoosts;
}

export interface LevelResult {
  levelId: number;
  stars: StarCount;
  reward: RewardBreakdown;
  coinsEarned: number;
  isFirstClear: boolean;
  moves: number;
  mistakes: number;
  hintsUsed: number;
  /** Hammer smashes: they cost a star like hints, so the win screen shows them too. */
  hammersUsed: number;
  /** The chest on every 10th level, the first time it's cleared. */
  milestone: MilestoneReward | null;
  /** Daily streak bonus, paid on the first level cleared each day. */
  dailyBonus: number;
}
