import type { GameState, LevelResult } from '../../types/game';
import { calculateReward } from '../engine/calculateReward';
import { calculateStars } from '../engine/calculateStars';
import { checkWin } from '../engine/checkWin';
import { milestoneFor } from '../progression/milestones';

/** Won state → stars → reward. The UI never computes rewards itself. */
export function buildLevelResult(state: GameState, opts: { isFirstClear: boolean }): LevelResult {
  if (!checkWin(state)) throw new Error('buildLevelResult called on an unfinished level.');
  const stars = calculateStars(state);
  const reward = calculateReward({ difficulty: state.difficulty, stars, isFirstClear: opts.isFirstClear });
  const milestone = milestoneFor(state.levelId, opts.isFirstClear);
  return {
    levelId: state.levelId,
    stars,
    reward,
    // A chapter chest's coins come on top of the level's own reward.
    coinsEarned: reward.total + (milestone?.coins ?? 0),
    isFirstClear: opts.isFirstClear,
    moves: state.moves,
    mistakes: state.mistakes,
    hintsUsed: state.hintsUsed,
    hammersUsed: state.hammersUsed,
    milestone,
  };
}
