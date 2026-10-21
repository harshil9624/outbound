import type { BoostKind, FreeBoosts } from '../../types/game';

/** Free boosts (from level chests and rewarded ads): used before any coins are spent. */

export const NO_FREE_BOOSTS: FreeBoosts = { hint: 0, hammer: 0, life: 0 };

export function addBoosts(a: FreeBoosts, b: FreeBoosts): FreeBoosts {
  return { hint: a.hint + b.hint, hammer: a.hammer + b.hammer, life: a.life + b.life };
}

/** The boost kinds a reward includes, with counts, in display order. */
export function boostList(boosts: FreeBoosts): { kind: BoostKind; count: number }[] {
  return (['hammer', 'hint', 'life'] as const).filter((k) => boosts[k] > 0).map((kind) => ({ kind, count: boosts[kind] }));
}
