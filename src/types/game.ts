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

export interface LevelResult {
  levelId: number;
  stars: StarCount;
  reward: RewardBreakdown;
  coinsEarned: number;
  isFirstClear: boolean;
  moves: number;
  mistakes: number;
  hintsUsed: number;
}
