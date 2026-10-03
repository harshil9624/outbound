import { addDays, daysBetween } from '../../utils/date';

export interface StreakState {
  count: number;
  best: number;
  lastPlayedDay: string | null;
}

export const INITIAL_STREAK: StreakState = { count: 0, best: 0, lastPlayedDay: null };

/** Call when the player completes a level on `today`. */
export function registerPlayDay(streak: StreakState, today: string): StreakState {
  if (streak.lastPlayedDay === today) return streak;
  const gap = streak.lastPlayedDay ? daysBetween(streak.lastPlayedDay, today) : Infinity;
  const count = gap === 1 ? streak.count + 1 : 1;
  return { count, best: Math.max(streak.best, count), lastPlayedDay: today };
}

/** The streak to display: it silently lapses if a day was missed. */
export function getActiveStreak(streak: StreakState, today: string): number {
  if (!streak.lastPlayedDay) return 0;
  return daysBetween(streak.lastPlayedDay, today) <= 1 ? streak.count : 0;
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
