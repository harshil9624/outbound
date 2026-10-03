import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LevelResult, StarCount } from '@/types';
import { INITIAL_STREAK, registerPlayDay, type StreakState } from '@/game/progression/streak';
import { STORAGE_KEYS } from '@/storage/storageKeys';
import { zustandStorage } from '@/storage/zustandStorage';
import { toDayKey } from '@/utils/date';

interface PlayerData {
  coins: number;
  currentLevel: number;
  unlockedLevel: number;
  streak: StreakState;
  completedLevels: number[];
  /** Best star count per level id. */
  stars: Record<number, StarCount>;
}

interface PlayerActions {
  addCoins: (amount: number) => void;
  /** Returns false (and changes nothing) if the balance is too low. */
  spendCoins: (amount: number) => boolean;
  setCurrentLevel: (levelId: number) => void;
  applyLevelResult: (result: LevelResult, totalLevels: number) => void;
  resetProgress: () => void;
}

export type PlayerStore = PlayerData & PlayerActions;

const INITIAL_PLAYER: PlayerData = {
  coins: 0,
  currentLevel: 1,
  unlockedLevel: 1,
  streak: INITIAL_STREAK,
  completedLevels: [],
  stars: {},
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_PLAYER,

      addCoins: (amount) => set((s) => ({ coins: s.coins + Math.max(0, amount) })),

      spendCoins: (amount) => {
        if (amount <= 0) return true;
        if (get().coins < amount) return false;
        set((s) => ({ coins: s.coins - amount }));
        return true;
      },

      setCurrentLevel: (levelId) =>
        set((s) => ({ currentLevel: Math.min(Math.max(1, levelId), s.unlockedLevel) })),

      applyLevelResult: (result, totalLevels) =>
        set((s) => {
          const nextLevel = Math.min(result.levelId + 1, totalLevels);
          const prevStars = s.stars[result.levelId] ?? 0;
          return {
            coins: s.coins + result.coinsEarned,
            completedLevels: s.completedLevels.includes(result.levelId)
              ? s.completedLevels
              : [...s.completedLevels, result.levelId],
            stars: result.stars > prevStars ? { ...s.stars, [result.levelId]: result.stars } : s.stars,
            unlockedLevel: Math.max(s.unlockedLevel, nextLevel),
            currentLevel: Math.max(s.currentLevel, nextLevel),
            streak: registerPlayDay(s.streak, toDayKey()),
          };
        }),

      resetProgress: () => set(INITIAL_PLAYER),
    }),
    {
      name: STORAGE_KEYS.player,
      storage: zustandStorage,
      version: 1,
      partialize: ({ coins, currentLevel, unlockedLevel, streak, completedLevels, stars }) => ({
        coins, currentLevel, unlockedLevel, streak, completedLevels, stars,
      }),
      // Future shape changes: migrate: (persisted, fromVersion) => ...
    },
  ),
);
