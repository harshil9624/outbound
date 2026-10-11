import { create } from 'zustand';
import type { GameState, Level, LevelResult, TapResult } from '@/types';
import { addLife, applyHint, canAddLife, createGameState, processArrowTap, smashArrow } from '@/game/engine';

/** Increments on every blocked tap so the same arrow can bump twice in a row. */
export interface BumpFeedback {
  arrowId: string;
  blockerId: string;
  token: number;
}

interface GameData {
  level: Level | null;
  /** Pure engine state. Arrows, lives, moves, status, history all live here. */
  game: GameState | null;
  /** Removed from the puzzle already, still visible while their exit animation runs. */
  exitingIds: string[];
  /** Subset of exitingIds that leave by hammer (smash) instead of sliding out. */
  smashingIds: string[];
  hintArrowId: string | null;
  bump: BumpFeedback | null;
  /** Hammer boost armed: the next arrow tap smashes instead of sliding. */
  hammerArmed: boolean;
  /** Survives endSession so the Win screen can read it. */
  lastResult: LevelResult | null;
}

interface GameActions {
  /** `game` lets the screen build the state during its first render and hand it over unchanged. */
  startLevel: (level: Level, game?: GameState) => void;
  restart: () => void;
  tapArrow: (arrowId: string) => TapResult | null;
  /** Hammer: removes the arrow regardless of blockers and disarms. Returns false if not allowed. */
  smash: (arrowId: string) => boolean;
  setHammerArmed: (armed: boolean) => void;
  completeExit: (arrowId: string) => void;
  showHint: () => string | null;
  /** +1 heart (also revives a lost game). Returns false if not allowed. */
  addLife: () => boolean;
  setLastResult: (result: LevelResult) => void;
  endSession: () => void;
}

export type GameStore = GameData & GameActions;

const EMPTY_SESSION = {
  level: null,
  game: null,
  exitingIds: [],
  smashingIds: [],
  hintArrowId: null,
  bump: null,
  hammerArmed: false,
};

/** Thin adapter: every rule decision is delegated to src/game/engine. Not persisted. Coins are charged by the caller. */
export const useGameStore = create<GameStore>()((set, get) => ({
  ...EMPTY_SESSION,
  lastResult: null,

  startLevel: (level, game) =>
    set({ ...EMPTY_SESSION, level, game: game && game.levelId === level.id ? game : createGameState(level) }),

  restart: () => {
    const { level } = get();
    if (level) get().startLevel(level);
  },

  tapArrow: (arrowId) => {
    const { game, exitingIds, hintArrowId, bump } = get();
    if (!game || exitingIds.includes(arrowId)) return null;
    const { state, result } = processArrowTap(game, arrowId);

    if (result.kind === 'exited') {
      set({
        game: state,
        exitingIds: [...exitingIds, arrowId],
        hintArrowId: hintArrowId === arrowId ? null : hintArrowId,
      });
    } else if (result.kind === 'blocked') {
      set({
        game: state,
        bump: { arrowId, blockerId: result.blockerId, token: (bump?.token ?? 0) + 1 },
      });
    }
    return result;
  },

  smash: (arrowId) => {
    const { game, exitingIds, smashingIds, hintArrowId } = get();
    if (!game || exitingIds.includes(arrowId)) return false;
    const next = smashArrow(game, arrowId);
    if (!next) return false;
    set({
      game: next,
      exitingIds: [...exitingIds, arrowId],
      smashingIds: [...smashingIds, arrowId],
      hintArrowId: hintArrowId === arrowId ? null : hintArrowId,
      hammerArmed: false,
    });
    return true;
  },

  setHammerArmed: (armed) => set({ hammerArmed: armed }),

  completeExit: (arrowId) =>
    set((s) =>
      s.exitingIds.includes(arrowId)
        ? {
            exitingIds: s.exitingIds.filter((id) => id !== arrowId),
            smashingIds: s.smashingIds.filter((id) => id !== arrowId),
          }
        : s,
    ),

  showHint: () => {
    const { game, hintArrowId } = get();
    if (!game) return null;
    // A visible hint is not charged twice.
    if (hintArrowId && game.remainingIds.includes(hintArrowId)) return hintArrowId;
    const { state, arrowId } = applyHint(game);
    if (arrowId) set({ game: state, hintArrowId: arrowId });
    return arrowId;
  },

  addLife: () => {
    const { game } = get();
    if (!game || !canAddLife(game)) return false;
    set({ game: addLife(game) });
    return true;
  },

  setLastResult: (result) => set({ lastResult: result }),

  endSession: () => set(EMPTY_SESSION),
}));
