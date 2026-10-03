import type { Difficulty } from '../../types/level';
import type { RewardBreakdown, StarCount } from '../../types/game';
import { REWARD_TABLE, type RewardTable } from '../../constants/gameConfig';

export function calculateReward(
  input: { difficulty: Difficulty; stars: StarCount; isFirstClear: boolean },
  table: RewardTable = REWARD_TABLE,
): RewardBreakdown {
  const base = table.base[input.difficulty];
  const starBonus = input.stars * table.perStar;
  if (input.isFirstClear) {
    const firstClearBonus = table.firstClearBonus;
    return { base, starBonus, firstClearBonus, total: base + starBonus + firstClearBonus };
  }
  const total = Math.max(1, Math.round((base + starBonus) * table.replayMultiplier));
  return { base, starBonus, firstClearBonus: 0, total };
}
