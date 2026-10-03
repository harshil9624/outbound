import type { GameState, LevelResult } from '../../types/game';
import { calculateReward } from '../engine/calculateReward';
import { calculateStars } from '../engine/calculateStars';
import { checkWin } from '../engine/checkWin';

/** Won state → stars → reward. The UI never computes rewards itself. */
export function buildLevelResult(state: GameState, opts: { isFirstClear: boolean }): LevelResult {
  if (!checkWin(state)) throw new Error('buildLevelResult called on an unfinished level.');
  const stars = calculateStars(state);
  const reward = calculateReward({ difficulty: state.difficulty, stars, isFirstClear: opts.isFirstClear });
  return {
    levelId: state.levelId,
    stars,
    reward,
    coinsEarned: reward.total,
    isFirstClear: opts.isFirstClear,
    moves: state.moves,
    mistakes: state.mistakes,
    hintsUsed: state.hintsUsed,
  };
}
