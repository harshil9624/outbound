import type { Difficulty } from '../../types/level';
import type { RewardBreakdown, StarCount } from '../../types/game';
import { REWARD_TABLE, type RewardTable } from '../../constants/gameConfig';

/** Coins only for a first clear: replaying a level is practice and pays nothing. */
export function calculateReward(
  input: { difficulty: Difficulty; stars: StarCount; isFirstClear: boolean },
  table: RewardTable = REWARD_TABLE,
): RewardBreakdown {
  if (!input.isFirstClear) return { base: 0, starBonus: 0, firstClearBonus: 0, total: 0 };
  const base = table.base[input.difficulty];
  const starBonus = input.stars * table.perStar;
  const firstClearBonus = table.firstClearBonus;
  return { base, starBonus, firstClearBonus, total: base + starBonus + firstClearBonus };
}
