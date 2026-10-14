import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoostKind, FreeBoosts, LevelResult, StarCount } from '@/types';
import { NO_FREE_BOOSTS, addBoosts } from '@/game/progression/milestones';
import { STARTING_COINS } from '@/constants/gameConfig';
import {
  INITIAL_STREAK,
  STREAK_MILESTONES,
  registerPlayDay,
  streakDayKeys,
  type StreakState,
} from '@/game/progression/streak';
import { AVATARS, type FaceAnimal } from '@/constants/animals';
import { STORAGE_KEYS } from '@/storage/storageKeys';
import { zustandStorage } from '@/storage/zustandStorage';
import { toDayKey } from '@/utils/date';

interface PlayerData {
  /** Shown on Home and in Settings; editable. */
  name: string;
  avatar: FaceAnimal;
  coins: number;
  currentLevel: number;
  unlockedLevel: number;
  streak: StreakState;
  completedLevels: number[];
  /** Best star count per level id. */
  stars: Record<number, StarCount>;
  /**
   * What the Journey map last showed. The map animates the difference (new stars, unlocks,
   * the animal moving on) the next time it opens, then calls markMapSeen.
   */
  mapSeen: MapSeen;
  /** Every day (YYYY-MM-DD) on which the player cleared a level. Drives the streak calendar. */
  playDays: string[];
  /** Streak milestones (in days) already paid out. */
  streakRewardsClaimed: number[];
  /** The guided first level has been finished once; the coach never shows again. */
  tutorialDone: boolean;
  /** Boosts won from chapter chests and challenge perks: used before any coins are spent. */
  freeBoosts: FreeBoosts;
}

export interface MapSeen {
  unlockedLevel: number;
  stars: Record<number, StarCount>;
}

interface PlayerActions {
  addCoins: (amount: number) => void;
  /** Returns false (and changes nothing) if the balance is too low. */
  spendCoins: (amount: number) => boolean;
  setCurrentLevel: (levelId: number) => void;
  /** `nextLevel` comes from the journey order (null for bonus levels or the end of content). */
  applyLevelResult: (result: LevelResult, nextLevel: number | null) => void;
  markMapSeen: () => void;
  setName: (name: string) => void;
  setAvatar: (avatar: FaceAnimal) => void;
  /** Pays a reached milestone once. Returns the coins paid (0 if not claimable). */
  claimStreakReward: (days: number) => number;
  resetProgress: () => void;
  markTutorialDone: () => void;
  /** Uses one free boost of this kind. Returns false (and changes nothing) if there are none. */
  useFreeBoost: (kind: BoostKind) => boolean;
}

export type PlayerStore = PlayerData & PlayerActions;

export const MAX_NAME_LENGTH = 16;

const INITIAL_PLAYER: PlayerData = {
  name: 'Player',
  avatar: 'cat',
  coins: STARTING_COINS,
  currentLevel: 1,
  unlockedLevel: 1,
  streak: INITIAL_STREAK,
  completedLevels: [],
  stars: {},
  mapSeen: { unlockedLevel: 1, stars: {} },
  playDays: [],
  streakRewardsClaimed: [],
  tutorialDone: false,
  freeBoosts: NO_FREE_BOOSTS,
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

      applyLevelResult: (result, nextLevel) =>
        set((s) => {
          const prevStars = s.stars[result.levelId] ?? 0;
          return {
            coins: s.coins + result.coinsEarned,
            completedLevels: s.completedLevels.includes(result.levelId)
              ? s.completedLevels
              : [...s.completedLevels, result.levelId],
            stars: result.stars > prevStars ? { ...s.stars, [result.levelId]: result.stars } : s.stars,
            unlockedLevel: nextLevel === null ? s.unlockedLevel : Math.max(s.unlockedLevel, nextLevel),
            currentLevel: nextLevel === null ? s.currentLevel : Math.max(s.currentLevel, nextLevel),
            // Any clear counts as playing today, replays included: the streak rewards the daily
            // habit. Replays pay no coins, so this can't be farmed for rewards.
            // A chapter chest or challenge perk adds its free boosts.
            freeBoosts: result.milestone ? addBoosts(s.freeBoosts, result.milestone.boosts) : s.freeBoosts,
            streak: registerPlayDay(s.streak, toDayKey()),
            playDays: s.playDays.includes(toDayKey()) ? s.playDays : [...s.playDays, toDayKey()],
          };
        }),

      markMapSeen: () => set((s) => ({ mapSeen: { unlockedLevel: s.unlockedLevel, stars: s.stars } })),

      setName: (name) => {
        const clean = name.trim().slice(0, MAX_NAME_LENGTH);
        if (clean) set({ name: clean });
      },

      setAvatar: (avatar) => {
        if (AVATARS.includes(avatar)) set({ avatar });
      },

      claimStreakReward: (days) => {
        const s = get();
        const milestone = STREAK_MILESTONES.find((m) => m.days === days);
        if (!milestone || s.streak.best < days || s.streakRewardsClaimed.includes(days)) return 0;
        set({ coins: s.coins + milestone.coins, streakRewardsClaimed: [...s.streakRewardsClaimed, days] });
        return milestone.coins;
      },

      // Progress is wiped; the player keeps their name, avatar, and knowing how to play.
      resetProgress: () => set((s) => ({ ...INITIAL_PLAYER, name: s.name, avatar: s.avatar, tutorialDone: s.tutorialDone })),

      markTutorialDone: () => set((s) => (s.tutorialDone ? s : { tutorialDone: true })),

      useFreeBoost: (kind) => {
        const s = get();
        if (s.freeBoosts[kind] <= 0) return false;
        set({ freeBoosts: { ...s.freeBoosts, [kind]: s.freeBoosts[kind] - 1 } });
        return true;
      },
    }),
    {
      name: STORAGE_KEYS.player,
      storage: zustandStorage,
      version: 6,
      // Persist data only, never actions.
      partialize: (s): PlayerData => ({
        name: s.name,
        avatar: s.avatar,
        coins: s.coins,
        currentLevel: s.currentLevel,
        unlockedLevel: s.unlockedLevel,
        streak: s.streak,
        completedLevels: s.completedLevels,
        stars: s.stars,
        mapSeen: s.mapSeen,
        playDays: s.playDays,
        streakRewardsClaimed: s.streakRewardsClaimed,
        tutorialDone: s.tutorialDone,
        freeBoosts: s.freeBoosts,
      }),
      migrate: (persisted, fromVersion) => {
        let data = persisted as PlayerData;
        // v2 introduced coin-priced boosts: existing players get the same starter purse as new ones.
        // (The starter purse was 100 then; later new players start with STARTING_COINS.)
        if (fromVersion < 2) data = { ...data, coins: data.coins + 100 };
        // v3 added the Journey map: start it at the player's real progress, with nothing to replay.
        if (fromVersion < 3) data = { ...data, mapSeen: { unlockedLevel: data.unlockedLevel, stars: data.stars } };
        // v4 added the streak calendar: backfill it with the days of the current streak.
        if (fromVersion < 4) data = { ...data, playDays: streakDayKeys(data.streak), streakRewardsClaimed: [] };
        // v5 added the guided first level: anyone who already cleared a level knows how to play.
        if (fromVersion < 5) data = { ...data, tutorialDone: data.completedLevels.length > 0 };
        // v6 added free boosts from chapter chests and challenge perks: everyone starts with none.
        if (fromVersion < 6) data = { ...data, freeBoosts: NO_FREE_BOOSTS };
        return data;
      },
    },
  ),
);
