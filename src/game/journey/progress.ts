import type { StarCount } from '../../types/game';
import { CHAPTERS } from './chapters';
import type { ChapterDef, ChapterLayout, MapNode, NodeState, PlayerProgress } from './types';

/** Every main-route level in play order. Bonus levels are not on it. */
export const MAIN_ROUTE: readonly number[] = CHAPTERS.flatMap((c) => c.levelIds);
const ROUTE_INDEX = new Map(MAIN_ROUTE.map((id, i) => [id, i]));

/** Some route levels aren't made yet: "nothing left to play" then means "more coming", not "finished". */
export function hasUnmadeLevels(exists: (id: number) => boolean): boolean {
  return MAIN_ROUTE.some((id) => !exists(id));
}

export function isMainRouteLevel(levelId: number): boolean {
  return ROUTE_INDEX.has(levelId);
}

/** The level that finishing `levelId` unlocks, or null (bonus level, or end of available content). */
export function nextMainLevel(levelId: number, exists: (id: number) => boolean): number | null {
  const i = ROUTE_INDEX.get(levelId);
  if (i === undefined) return null;
  const next = MAIN_ROUTE[i + 1];
  return next !== undefined && exists(next) ? next : null;
}

export function chapterOfLevel(levelId: number): ChapterDef | null {
  return CHAPTERS.find((c) => c.levelIds.includes(levelId) || c.bonus?.levelId === levelId) ?? null;
}

/** The level the player should play next: the first unfinished, unlocked main-route level. */
export function currentLevelId(progress: PlayerProgress, exists: (id: number) => boolean): number | null {
  const done = new Set(progress.completedLevels);
  for (const id of MAIN_ROUTE) {
    if (!exists(id) || id > progress.unlockedLevel) return null;
    if (!done.has(id)) return id;
  }
  return null;
}

export function chapterStars(chapter: ChapterDef, progress: PlayerProgress): number {
  return chapter.levelIds.reduce((s, id) => s + (progress.stars[id] ?? 0), 0);
}

/** Merges a pure layout with the player's progress. */
export function applyProgress(
  layout: ChapterLayout,
  progress: PlayerProgress,
  current: number | null,
): MapNode[] {
  const done = new Set(progress.completedLevels);
  const starsInChapter = chapterStars(layout.chapter, progress);
  return layout.nodes.map((n) => {
    const stars: StarCount | 0 = progress.stars[n.levelId] ?? 0;
    let state: NodeState;
    if (done.has(n.levelId)) state = stars === 3 ? 'perfect' : 'completed';
    else if (n.levelId === current) state = 'current';
    else if (n.kind === 'bonus') state = starsInChapter >= (layout.chapter.bonus?.starsRequired ?? Infinity) ? 'available' : 'locked';
    else state = n.levelId <= progress.unlockedLevel ? 'available' : 'locked';
    return { ...n, state, stars };
  });
}
