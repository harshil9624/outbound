import { addDays, toDayKey, weekdayOf } from '../../utils/date';

/** A month as weeks (Sunday first). `null` pads days outside the month. */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = toDayKey(new Date(year, month, 1));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: weekdayOf(first) }, () => null);
  for (let d = 0; d < daysInMonth; d++) cells.push(addDays(first, d));
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}
