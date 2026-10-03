import type { Level } from '../../types/level';
import { LOCAL_LEVELS } from './index';

/**
 * The only way the app obtains levels. Swap or compose implementations later
 * (bundled JSON packs, procedural generator, remote daily challenge) without
 * touching screens or stores.
 */
export interface LevelProvider {
  getLevel(id: number): Level | null;
  hasLevel(id: number): boolean;
  count(): number;
}

export function createLocalLevelProvider(levels: readonly Level[]): LevelProvider {
  const byId = new Map(levels.map((l) => [l.id, l]));
  return {
    getLevel: (id) => byId.get(id) ?? null,
    hasLevel: (id) => byId.has(id),
    count: () => levels.length,
  };
}

export const levelProvider: LevelProvider = createLocalLevelProvider(LOCAL_LEVELS);
