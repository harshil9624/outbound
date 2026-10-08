import { describe, expect, it } from 'bun:test';
import {
  INITIAL_STREAK,
  STREAK_MILESTONES,
  frozenDayKeys,
  freezeReady,
  getActiveStreak,
  registerPlayDay,
  streakStatus,
  weekOf,
  type StreakState,
} from '../src/game/progression/streak';

const play = (days: string[], from: StreakState = INITIAL_STREAK) => days.reduce(registerPlayDay, from);

describe('streak freeze: one missed day a week is forgiven', () => {
  it('a single missed day keeps the streak growing, and is remembered as frozen', () => {
    const s = play(['2026-10-01', '2026-10-02', '2026-10-04']); // missed the 3rd
    expect(s.count).toBe(3);
    expect(s.frozenDays).toEqual(['2026-10-03']);
  });

  it('while the freeze holds, the streak still shows and the status says so', () => {
    const s = play(['2026-10-01', '2026-10-02']);
    expect(getActiveStreak(s, '2026-10-04')).toBe(2);
    expect(streakStatus(s, '2026-10-04')).toBe('frozen');
    expect(frozenDayKeys(s, '2026-10-04')).toEqual(['2026-10-03']);
  });

  it('two missed days in a row break it, gently: it starts again at 1', () => {
    const s = play(['2026-10-01', '2026-10-02']);
    expect(getActiveStreak(s, '2026-10-05')).toBe(0);
    expect(streakStatus(s, '2026-10-05')).toBe('none');
    const next = registerPlayDay(s, '2026-10-05');
    expect(next.count).toBe(1);
    expect(next.frozenDays).toEqual([]);
    expect(next.best).toBe(2);
  });

  it('only one freeze a week: a second miss within 7 days breaks the streak', () => {
    const s = play(['2026-10-01', '2026-10-03', '2026-10-04', '2026-10-06']); // missed the 2nd, then the 5th
    expect(s.count).toBe(1);
  });

  it('a week later the freeze is ready again', () => {
    const s = play(['2026-10-01', '2026-10-03']); // freeze used on the 2nd
    expect(freezeReady(s, '2026-10-05')).toBe(false);
    const later = play(['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-10'], s); // missed the 9th
    expect(later.count).toBe(8); // 1st, 3rd–8th, 10th: eight days played, the 9th frozen
    expect(later.frozenDays).toEqual(['2026-10-02', '2026-10-09']);
  });

  it('statuses: done today, waiting after yesterday, none for a new player', () => {
    const s = play(['2026-10-01']);
    expect(streakStatus(s, '2026-10-01')).toBe('done');
    expect(streakStatus(s, '2026-10-02')).toBe('waiting');
    expect(streakStatus(INITIAL_STREAK, '2026-10-02')).toBe('none');
  });

  it('streaks saved before freezes existed still work', () => {
    const old: StreakState = { count: 4, best: 6, lastPlayedDay: '2026-10-01' };
    expect(getActiveStreak(old, '2026-10-03')).toBe(4);
    expect(registerPlayDay(old, '2026-10-03').count).toBe(5);
  });
});

describe('week strip and chests', () => {
  it('the week runs Sunday to Saturday around today, across a month boundary', () => {
    expect(weekOf('2026-10-01')).toEqual([
      '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03',
    ]);
  });

  it('chests are close together and grow, starting within reach', () => {
    expect(STREAK_MILESTONES[0].days).toBe(2);
    for (let i = 1; i < STREAK_MILESTONES.length; i++) {
      expect(STREAK_MILESTONES[i].days).toBeGreaterThan(STREAK_MILESTONES[i - 1].days);
      expect(STREAK_MILESTONES[i].coins).toBeGreaterThan(STREAK_MILESTONES[i - 1].coins);
    }
  });
});
