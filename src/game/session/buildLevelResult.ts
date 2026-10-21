import type { GameState, LevelResult } from '../../types/game';
import { calculateStars } from '../engine/calculateStars';
import { checkWin } from '../engine/checkWin';
import { levelRewards, type RewardLedger } from '../../economy/rewards';

/**
 * Won state → stars → rewards. `ledger` is what the player has already been paid; the player
 * store pays from the same rules (economy/rewards), so the win screen shows exactly what's paid.
 */
export function buildLevelResult(state: GameState, opts: { isFirstClear: boolean; ledger: RewardLedger; today: string }): LevelResult {
  if (!checkWin(state)) throw new Error('buildLevelResult called on an unfinished level.');
  const stars = calculateStars(state);
  const rewards = levelRewards(opts.ledger, state.levelId, stars, opts.today);
  return {
    levelId: state.levelId,
    stars,
    reward: { base: rewards.levelCoins, starBonus: 0, firstClearBonus: 0, total: rewards.levelCoins },
    coinsEarned: rewards.totalCoins,
    isFirstClear: opts.isFirstClear,
    moves: state.moves,
    mistakes: state.mistakes,
    hintsUsed: state.hintsUsed,
    hammersUsed: state.hammersUsed,
    milestone: rewards.chest,
    dailyBonus: rewards.dailyBonus,
  };
}
