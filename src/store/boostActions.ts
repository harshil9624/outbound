import { BOOST_COSTS } from '@/constants/gameConfig';
import { canAddLife } from '@/game/engine/addLife';
import { findHint } from '@/game/engine/findHint';
import { useGameStore } from './gameStore';
import { usePlayerStore } from './playerStore';

/** Why a boost didn't happen, so the UI can say so instead of silently ignoring the tap. */
export type BoostFailure = 'coins' | 'hearts-full' | 'hint-shown' | 'not-playing' | 'no-target';
export type BoostResult = { ok: true } | { ok: false; reason: BoostFailure };

const ok: BoostResult = { ok: true };
const fail = (reason: BoostFailure): BoostResult => ({ ok: false, reason });

/**
 * Coin-priced boosts. Each checks every precondition first and charges only once the
 * engine has accepted the action, so a failed boost never costs coins.
 */
export function buyHint(): BoostResult {
  const s = useGameStore.getState();
  if (!s.game || s.game.status !== 'playing') return fail('not-playing');
  if (s.hintArrowId && s.game.remainingIds.includes(s.hintArrowId)) return fail('hint-shown');
  if (!findHint(s.game)) return fail('no-target');
  const player = usePlayerStore.getState();
  if (player.coins < BOOST_COSTS.hint) return fail('coins');
  if (!s.showHint()) return fail('no-target');
  player.spendCoins(BOOST_COSTS.hint);
  return ok;
}

/** Arms the hammer, or disarms it if already armed (free). Coins are charged on the actual smash. */
export function toggleHammer(): BoostResult {
  const s = useGameStore.getState();
  if (s.hammerArmed) {
    s.setHammerArmed(false);
    return ok;
  }
  if (!s.game || s.game.status !== 'playing') return fail('not-playing');
  if (usePlayerStore.getState().coins < BOOST_COSTS.hammer) return fail('coins');
  s.setHammerArmed(true);
  return ok;
}

/** With the hammer armed, removes the tapped arrow even if blocked. */
export function hammerArrow(arrowId: string): BoostResult {
  const s = useGameStore.getState();
  const player = usePlayerStore.getState();
  if (player.coins < BOOST_COSTS.hammer) {
    s.setHammerArmed(false);
    return fail('coins');
  }
  if (!s.smash(arrowId)) return fail('no-target');
  player.spendCoins(BOOST_COSTS.hammer);
  return ok;
}

/** +1 heart, including reviving a lost level. */
export function buyHeart(): BoostResult {
  const s = useGameStore.getState();
  if (!s.game) return fail('not-playing');
  if (!canAddLife(s.game)) return fail(s.game.status === 'won' ? 'not-playing' : 'hearts-full');
  const player = usePlayerStore.getState();
  if (player.coins < BOOST_COSTS.life) return fail('coins');
  if (!s.addLife()) return fail('hearts-full');
  player.spendCoins(BOOST_COSTS.life);
  return ok;
}

export const BOOST_FAILURE_TEXT: Record<BoostFailure, string> = {
  coins: 'Not enough coins',
  'hearts-full': 'Your hearts are already full',
  'hint-shown': 'A hint is already showing',
  'not-playing': 'Not available right now',
  'no-target': 'Nothing to do here',
};
