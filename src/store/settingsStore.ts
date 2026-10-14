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
  /** Sound effects volume, 0–1 in quarter steps. Separate from on/off, so muting keeps the level. */
  volume: number;
}

type SettingKey = 'soundEnabled' | 'vibrationEnabled' | 'reducedMotion';

interface SettingsActions {
  setSetting: <K extends SettingKey>(key: K, value: SettingsData[K]) => void;
  /** The phone's reduce-motion setting changed: applied only while the player hasn't chosen. */
  applySystemReducedMotion: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
}

export type SettingsStore = SettingsData & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      soundEnabled: true,
      vibrationEnabled: true,
      reducedMotion: false,
      reducedMotionChosen: false,
      volume: 1,
      setVolume: (volume) => set({ volume: Math.round(Math.min(1, Math.max(0, volume)) * 4) / 4 }),
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
      version: 3,
      partialize: ({ soundEnabled, vibrationEnabled, reducedMotion, reducedMotionChosen, volume }) => ({
        soundEnabled, vibrationEnabled, reducedMotion, reducedMotionChosen, volume,
      }),
      migrate: (persisted, fromVersion) => {
        const data = persisted as SettingsData;
        // v2 added reducedMotionChosen: someone who already switched it on chose it.
        let out = data;
        if (fromVersion < 2) out = { ...out, reducedMotionChosen: out.reducedMotion === true };
        // v3 added volume: full, as before.
        if (fromVersion < 3) out = { ...out, volume: 1 };
        return out;
      },
    },
  ),
);
