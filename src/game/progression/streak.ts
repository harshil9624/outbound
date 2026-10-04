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

/** Rewards for reaching a streak length (paid once each, based on the best streak). */
export const STREAK_MILESTONES: readonly { days: number; coins: number }[] = [
  { days: 3, coins: 25 },
  { days: 7, coins: 60 },
  { days: 14, coins: 120 },
  { days: 30, coins: 250 },
  { days: 60, coins: 500 },
  { days: 100, coins: 1000 },
];

/** Milestones the player has reached but not yet collected. */
export function claimableMilestones(best: number, claimed: readonly number[]): number[] {
  return STREAK_MILESTONES.filter((m) => best >= m.days && !claimed.includes(m.days)).map((m) => m.days);
}

/** The day keys covered by the streak (used once to backfill play history). */
export function streakDayKeys(streak: StreakState): string[] {
  if (!streak.lastPlayedDay) return [];
  return Array.from({ length: streak.count }, (_, i) => addDays(streak.lastPlayedDay as string, -i)).reverse();
}
