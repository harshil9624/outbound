/** Every persisted key in one place. Bump a store's `version` when its shape changes. */
export const STORAGE_KEYS = {
  player: 'outbound.player',
  settings: 'outbound.settings',
} as const;

export const MMKV_INSTANCE_ID = 'outbound-storage';
