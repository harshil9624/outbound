import type { Difficulty } from '../../types/level';
import { CHAPTERS } from '../journey/chapters';

/**
 * The journey's difficulty tiers, shared by the level generator and the progression tests.
 * Levels 1–8 are the handcrafted tutorial (Simple, under 10 arrows). From level 9 each chapter
 * is one tier with its own arrow range; challenge and master levels sit at the top of it.
 */

export const DIFFICULTY_RANK: Record<Difficulty, number> = { simple: 0, easy: 1, normal: 2, hard: 3, 'extra-hard': 4 };

export interface Tier {
  difficulty: Difficulty;
  /** Inclusive level id range. */
  levels: [number, number];
  /** Inclusive arrow count range. */
  arrows: [number, number];
}

export const TIERS: readonly Tier[] = [
  { difficulty: 'simple', levels: [9, 14], arrows: [10, 15] },
  { difficulty: 'easy', levels: [15, 28], arrows: [16, 22] },
  { difficulty: 'normal', levels: [29, 42], arrows: [23, 30] },
  { difficulty: 'hard', levels: [43, 56], arrows: [31, 35] },
  { difficulty: 'extra-hard', levels: [57, 70], arrows: [36, 40] },
];

export function tierOf(levelId: number): Tier | null {
  return TIERS.find((t) => levelId >= t.levels[0] && levelId <= t.levels[1]) ?? null;
}

/** 'challenge' or 'master' for a chapter's spike levels, null for regular levels. */
export function isSpecialLevel(levelId: number): 'challenge' | 'master' | null {
  const chapter = CHAPTERS.find((c) => c.levelIds.includes(levelId));
  if (!chapter) return null;
  if (chapter.levelIds[chapter.levelIds.length - 1] === levelId) return 'master';
  return chapter.challengeIds?.includes(levelId) ? 'challenge' : null;
}
