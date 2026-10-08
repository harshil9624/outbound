import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/storage/storageKeys';
import { zustandStorage } from '@/storage/zustandStorage';

interface SettingsData {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reducedMotion: boolean;
  /**
   * The player has set Reduced motion themselves. Until then it follows the phone's own
   * "Remove animations" setting (see followSystemMotion).
   */
  reducedMotionChosen: boolean;
}

type SettingKey = 'soundEnabled' | 'vibrationEnabled' | 'reducedMotion';

interface SettingsActions {
  setSetting: <K extends SettingKey>(key: K, value: SettingsData[K]) => void;
  /** The phone's reduce-motion setting changed: applied only while the player hasn't chosen. */
  applySystemReducedMotion: (enabled: boolean) => void;
}

export type SettingsStore = SettingsData & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      soundEnabled: true,
      vibrationEnabled: true,
      reducedMotion: false,
      reducedMotionChosen: false,
      setSetting: (key, value) =>
        set({ [key]: value, ...(key === 'reducedMotion' ? { reducedMotionChosen: true } : null) } as Partial<SettingsData>),
      applySystemReducedMotion: (enabled) => {
        const s = get();
        if (!s.reducedMotionChosen && s.reducedMotion !== enabled) set({ reducedMotion: enabled });
      },
    }),
    {
      name: STORAGE_KEYS.settings,
      storage: zustandStorage,
      version: 2,
      partialize: ({ soundEnabled, vibrationEnabled, reducedMotion, reducedMotionChosen }) => ({
        soundEnabled, vibrationEnabled, reducedMotion, reducedMotionChosen,
      }),
      migrate: (persisted, fromVersion) => {
        const data = persisted as SettingsData;
        // v2 added reducedMotionChosen: someone who already switched it on chose it.
        if (fromVersion < 2) return { ...data, reducedMotionChosen: data.reducedMotion === true };
        return data;
      },
    },
  ),
);
