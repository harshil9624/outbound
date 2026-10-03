import { create } from 'zustand';
import type { GameState, Level, LevelResult, TapResult } from '@/types';
import { applyHint, canUndo, createGameState, processArrowTap, undoMove } from '@/game/engine';

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
  hintArrowId: string | null;
  bump: BumpFeedback | null;
  /** Survives endSession so the Win screen can read it. */
  lastResult: LevelResult | null;
}

interface GameActions {
  startLevel: (level: Level) => void;
  restart: () => void;
  tapArrow: (arrowId: string) => TapResult | null;
  completeExit: (arrowId: string) => void;
  undo: () => boolean;
  showHint: () => string | null;
  setLastResult: (result: LevelResult) => void;
  endSession: () => void;
}

export type GameStore = GameData & GameActions;

const EMPTY_SESSION = { level: null, game: null, exitingIds: [], hintArrowId: null, bump: null };

/** Thin adapter: every rule decision is delegated to src/game/engine. Not persisted. */
export const useGameStore = create<GameStore>()((set, get) => ({
  ...EMPTY_SESSION,
  lastResult: null,

  startLevel: (level) =>
    set({ ...EMPTY_SESSION, level, game: createGameState(level) }),

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

  completeExit: (arrowId) =>
    set((s) => (s.exitingIds.includes(arrowId) ? { exitingIds: s.exitingIds.filter((id) => id !== arrowId) } : s)),

  undo: () => {
    const { game, exitingIds } = get();
    if (!game || exitingIds.length > 0 || !canUndo(game)) return false;
    set({ game: undoMove(game), hintArrowId: null });
    return true;
  },

  showHint: () => {
    const { game, hintArrowId } = get();
    if (!game) return null;
    // A visible hint is not charged twice.
    if (hintArrowId && game.remainingIds.includes(hintArrowId)) return hintArrowId;
    const { state, arrowId } = applyHint(game);
    if (arrowId) set({ game: state, hintArrowId: arrowId });
    return arrowId;
  },

  setLastResult: (result) => set({ lastResult: result }),

  endSession: () => set(EMPTY_SESSION),
}));
