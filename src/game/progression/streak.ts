import { addDays, daysBetween } from '../../utils/date';
import { FREEZE_EVERY_DAYS, STREAK_CHESTS } from '../../economy/config';

/** Amounts live in economy/config; re-exported here for the screens that already import them. */
export { FREEZE_EVERY_DAYS };
export const STREAK_MILESTONES = STREAK_CHESTS;

export interface StreakState {
  count: number;
  best: number;
  lastPlayedDay: string | null;
  /**
   * Days a free freeze covered: a single missed day doesn't break the streak, once a week.
   * Optional so streaks saved before freezes existed still load.
   */
  frozenDays?: string[];
}


/** A freeze can cover `day` if none was used in the week before it. */
function freezeCovers(streak: StreakState, day: string): boolean {
  return !(streak.frozenDays ?? []).some((f) => {
    const gap = daysBetween(f, day);
    return gap >= 0 && gap < FREEZE_EVERY_DAYS;
  });
}

/** Whether a freeze is ready to save the next missed day (shown on the Streak screen). */
export function freezeReady(streak: StreakState, today: string): boolean {
  return freezeCovers(streak, today);
}

export const INITIAL_STREAK: StreakState = { count: 0, best: 0, lastPlayedDay: null };

/** The one missed day a freeze would cover, if the streak is exactly one day behind. */
function missedDay(streak: StreakState, today: string): string | null {
  if (!streak.lastPlayedDay || daysBetween(streak.lastPlayedDay, today) !== 2) return null;
  const missed = addDays(streak.lastPlayedDay, 1);
  return freezeCovers(streak, missed) ? missed : null;
}

/**
 * Call when the player completes a level on `today`. Playing the next day adds one; missing a
 * single day is covered by the weekly freeze (the streak carries on); otherwise it starts over.
 */
export function registerPlayDay(streak: StreakState, today: string): StreakState {
  if (streak.lastPlayedDay === today) return streak;
  const gap = streak.lastPlayedDay ? daysBetween(streak.lastPlayedDay, today) : Infinity;
  const frozen = missedDay(streak, today);
  const keeps = gap === 1 || frozen !== null;
  const count = keeps ? streak.count + 1 : 1;
  // Only recent freezes matter (they block the next one for a week).
  const frozenDays = keeps ? [...(streak.frozenDays ?? []), ...(frozen ? [frozen] : [])].filter((f) => daysBetween(f, today) < FREEZE_EVERY_DAYS * 2) : [];
  return { count, best: Math.max(streak.best, count), lastPlayedDay: today, frozenDays };
}

/** The streak to display: alive if played today or yesterday, or one missed day a freeze covers. */
export function getActiveStreak(streak: StreakState, today: string): number {
  if (!streak.lastPlayedDay) return 0;
  return daysBetween(streak.lastPlayedDay, today) <= 1 || missedDay(streak, today) !== null ? streak.count : 0;
}

export type StreakStatus =
  /** Cleared a level today. */
  | 'done'
  /** Alive; play today to grow it. */
  | 'waiting'
  /** Yesterday was missed and a freeze is holding it: play today to keep it. */
  | 'frozen'
  /** No streak right now (never played, or it lapsed). */
  | 'none';

export function streakStatus(streak: StreakState, today: string): StreakStatus {
  if (!streak.lastPlayedDay) return 'none';
  const gap = daysBetween(streak.lastPlayedDay, today);
  if (gap <= 0) return 'done';
  if (gap === 1) return 'waiting';
  return missedDay(streak, today) !== null ? 'frozen' : 'none';
}

/** The days a freeze is covering, including one holding the streak right now. */
export function frozenDayKeys(streak: StreakState, today: string): string[] {
  const holding = missedDay(streak, today);
  return [...(streak.frozenDays ?? []), ...(holding ? [holding] : [])];
}

export interface StreakDay {
  day: string;
  played: boolean;
}

/** The last `windowDays` days ending today, oldest first, marking days covered by the active streak. */
export function getStreakDays(streak: StreakState, today: string, windowDays = 7): StreakDay[] {
  const active = getActiveStreak(streak, today);
  return Array.from({ length: windowDays }, (_, i) => {
    const day = addDays(today, i - (windowDays - 1));
    const back = streak.lastPlayedDay ? daysBetween(day, streak.lastPlayedDay) : -1;
    return { day, played: back >= 0 && back < active };
  });
}

/** The week (Sunday first) that contains `today`, as day keys. */
export function weekOf(today: string): string[] {
  const [y, m, d] = today.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - weekday));
}

/** Milestones the player has reached but not yet collected. */
export function claimableMilestones(best: number, claimed: readonly number[]): number[] {
  return STREAK_MILESTONES.filter((m) => best >= m.days && !claimed.includes(m.days)).map((m) => m.days);
}

/** The day keys covered by the streak (used once to backfill play history). */
export function streakDayKeys(streak: StreakState): string[] {
  if (!streak.lastPlayedDay) return [];
  return Array.from({ length: streak.count }, (_, i) => addDays(streak.lastPlayedDay as string, -i)).reverse();
}
