import type { BoostKind, FreeBoosts, MilestoneReward } from '../../types/game';
import { isSpecialLevel } from '../levels/progression';

/**
 * Rewards for the special levels each chapter already has (see journey/chapters):
 * - beating the chapter's master level opens a chapter chest;
 * - beating its challenge level earns a perk.
 * First clears only, like coins, so replays can't farm them. Mostly free boosts rather than
 * coins: generous to use, without inflating the coin balance that rewarded ads will top up.
 */

export const NO_FREE_BOOSTS: FreeBoosts = { hint: 0, hammer: 0, life: 0 };

export const CHAPTER_CHEST: MilestoneReward = { kind: 'chest', coins: 20, boosts: { hint: 2, hammer: 1, life: 1 } };
export const CHALLENGE_PERK: MilestoneReward = { kind: 'perk', coins: 0, boosts: { hint: 0, hammer: 1, life: 0 } };

export function milestoneFor(levelId: number, isFirstClear: boolean): MilestoneReward | null {
  if (!isFirstClear) return null;
  const special = isSpecialLevel(levelId);
  if (special === 'master') return CHAPTER_CHEST;
  if (special === 'challenge') return CHALLENGE_PERK;
  return null;
}

export function addBoosts(a: FreeBoosts, b: FreeBoosts): FreeBoosts {
  return { hint: a.hint + b.hint, hammer: a.hammer + b.hammer, life: a.life + b.life };
}

/** The boost kinds a reward includes, with counts, in display order. */
export function boostList(boosts: FreeBoosts): { kind: BoostKind; count: number }[] {
  return (['hammer', 'hint', 'life'] as const).filter((k) => boosts[k] > 0).map((kind) => ({ kind, count: boosts[kind] }));
}
