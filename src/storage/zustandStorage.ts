import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import { storage } from './mmkv';

/** Synchronous adapter: MMKV reads are sync, so stores hydrate before first render. */
const mmkvStateStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
};

export const zustandStorage = createJSONStorage(() => mmkvStateStorage);
