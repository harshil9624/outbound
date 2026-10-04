import type { StarCount } from '../../types/game';
import { STAR_RULES } from '../../constants/gameConfig';

export function calculateStars(
  input: { mistakes: number; hintsUsed: number; hammersUsed?: number },
  rules: typeof STAR_RULES = STAR_RULES,
): StarCount {
  const penalty =
    input.mistakes * rules.mistakeWeight +
    input.hintsUsed * rules.hintWeight +
    (input.hammersUsed ?? 0) * rules.hammerWeight;
  if (penalty <= rules.threeStarMaxPenalty) return 3;
  if (penalty <= rules.twoStarMaxPenalty) return 2;
  return 1;
}
