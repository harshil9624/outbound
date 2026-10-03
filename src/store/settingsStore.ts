import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/storage/storageKeys';
import { zustandStorage } from '@/storage/zustandStorage';

interface SettingsData {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reducedMotion: boolean;
}

interface SettingsActions {
  setSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => void;
}

export type SettingsStore = SettingsData & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      soundEnabled: true,
      vibrationEnabled: true,
      reducedMotion: false,
      setSetting: (key, value) => set({ [key]: value } as Pick<SettingsData, typeof key>),
    }),
    {
      name: STORAGE_KEYS.settings,
      storage: zustandStorage,
      version: 1,
      partialize: ({ soundEnabled, vibrationEnabled, reducedMotion }) => ({
        soundEnabled, vibrationEnabled, reducedMotion,
      }),
    },
  ),
);
