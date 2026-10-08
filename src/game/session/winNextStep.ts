import type { LevelResult } from '../../types/game';
import { currentLevelId, hasUnmadeLevels, nextMainLevel } from '../journey/progress';
import type { PlayerProgress } from '../journey/types';

export interface WinNextStep {
  /** Level the main button opens, or null when there's nothing left to play. */
  target: number | null;
  /** The target is simply the next level on the route ("NEXT LEVEL"), not a jump back. */
  isNatural: boolean;
  /** Why there's no target: the game is finished, or later levels aren't made yet. */
  end: 'all-done' | 'coming-soon' | null;
}

/**
 * Where the win screen's main button goes. A first clear moves on along the route. A replay, or a
 * bonus level (not on the route), returns the player to where they're up to: replaying level 3
 * with progress at 12 must not offer level 4. `progress` is the player's state after the result.
 */
export function winNextStep(
  result: Pick<LevelResult, 'levelId' | 'isFirstClear'>,
  progress: PlayerProgress,
  exists: (id: number) => boolean,
): WinNextStep {
  const natural = nextMainLevel(result.levelId, exists);
  const target = (result.isFirstClear ? natural : null) ?? currentLevelId(progress, exists);
  if (target !== null) return { target, isNatural: target === natural, end: null };
  return { target: null, isNatural: false, end: hasUnmadeLevels(exists) ? 'coming-soon' : 'all-done' };
}
