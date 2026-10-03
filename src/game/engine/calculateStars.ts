import type { StarCount } from '../../types/game';
import { STAR_RULES } from '../../constants/gameConfig';

export function calculateStars(
  input: { mistakes: number; hintsUsed: number },
  rules: typeof STAR_RULES = STAR_RULES,
): StarCount {
  const penalty = input.mistakes * rules.mistakeWeight + input.hintsUsed * rules.hintWeight;
  if (penalty <= rules.threeStarMaxPenalty) return 3;
  if (penalty <= rules.twoStarMaxPenalty) return 2;
  return 1;
}
