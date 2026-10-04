import type { ArrowPath, Level } from '../../types/level';
import type { BoardArrow, GameRules, GameState } from '../../types/game';
import { DEFAULT_GAME_RULES } from '../../constants/gameConfig';
import { expandPathToCells, getHead } from './geometry';

export function toBoardArrow(arrow: ArrowPath): BoardArrow {
  return {
    ...arrow,
    kind: arrow.kind ?? 'standard',
    cells: expandPathToCells(arrow.points),
    head: getHead(arrow.points),
  };
}

export function createGameState(level: Level, rules: GameRules = DEFAULT_GAME_RULES): GameState {
  const arrows: Record<string, BoardArrow> = {};
  const arrowOrder: string[] = [];
  for (const arrow of level.arrows) {
    arrows[arrow.id] = toBoardArrow(arrow);
    arrowOrder.push(arrow.id);
  }
  return {
    levelId: level.id,
    difficulty: level.difficulty,
    boardWidth: level.boardWidth,
    boardHeight: level.boardHeight,
    arrows,
    arrowOrder,
    remainingIds: [...arrowOrder],
    removedIds: [],
    lives: rules.maxLives,
    maxLives: rules.maxLives,
    moves: 0,
    mistakes: 0,
    hintsUsed: 0,
    hammersUsed: 0,
    undosUsed: 0,
    status: 'playing',
    history: [],
  };
}
