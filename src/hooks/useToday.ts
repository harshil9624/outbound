import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { toDayKey } from '@/utils/date';

interface Today {
  /** YYYY-MM-DD in local time. */
  day: string;
  /** 0–23, for greetings. */
  hour: number;
}

const now = (): Today => ({ day: toDayKey(), hour: new Date().getHours() });

/**
 * The current day and hour, kept fresh. Tab screens stay mounted (and frozen when hidden), so a
 * value computed at render goes stale overnight: "Streak safe today" would still show the next
 * morning. This re-reads the clock whenever the screen comes into view or the app returns to the
 * foreground, and only re-renders when the day or hour actually changed.
 */
export function useToday(): Today {
  const [today, setToday] = useState(now);
  const refresh = useCallback(() => {
    setToday((prev) => {
      const next = now();
      return next.day === prev.day && next.hour === prev.hour ? prev : next;
    });
  }, []);

  useFocusEffect(refresh);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return today;
}
