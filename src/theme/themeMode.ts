import { useSyncExternalStore } from 'react';
import { storage } from '@/storage/mmkv';
import { STORAGE_KEYS } from '@/storage/storageKeys';

export type ThemeMode = 'light' | 'dark';

let mode: ThemeMode = storage.getString(STORAGE_KEYS.theme) === 'dark' ? 'dark' : 'light';
const listeners = new Set<(mode: ThemeMode) => void>();

export function getThemeMode(): ThemeMode {
  return mode;
}

/** Listeners run in subscription order: `colors` subscribes at module load, before any component. */
export function subscribeThemeMode(listener: (mode: ThemeMode) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Saves the choice and swaps the tokens in place. ThemeBoundary remounts screen content on change. */
export function setThemeMode(next: ThemeMode): void {
  if (next === mode) return;
  mode = next;
  storage.set(STORAGE_KEYS.theme, next);
  listeners.forEach((l) => l(next));
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribeThemeMode, getThemeMode);
}

/**
 * Module-level styles that follow the theme. `factory` runs lazily and again after each theme
 * switch, so styles can keep reading `colors` and `textStyles` as plain values.
 */
export function themed<T extends object>(factory: () => T): T {
  let cache: T | undefined;
  let cachedFor: ThemeMode | undefined;
  const current = (): T => {
    if (cache === undefined || cachedFor !== mode) {
      cache = factory();
      cachedFor = mode;
    }
    return cache;
  };
  return new Proxy({} as T, {
    get: (_, key) => Reflect.get(current(), key),
    has: (_, key) => Reflect.has(current(), key),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (_, key) => {
      const d = Reflect.getOwnPropertyDescriptor(current(), key);
      return d && { ...d, configurable: true };
    },
  });
}
