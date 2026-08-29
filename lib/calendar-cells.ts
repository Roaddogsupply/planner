import type { CalendarDayCell } from "@/lib/calendar-types";

type LinkOverlay = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Turn the tiny apple-icon link box into the full day cell area. */
export function expandCalendarDayCell(date: string, base: LinkOverlay): CalendarDayCell {
  return {
    date,
    x: Math.max(0, base.x - 2),
    y: Math.max(0, base.y - 0.5),
    width: 10,
    height: 11,
  };
}

export function parseCalendarDayFromUri(
  uri: string,
  base: LinkOverlay,
): CalendarDayCell | null {
  const match = uri.match(/FROMDATE=([^&%]+)/);
  if (!match) return null;

  const date = decodeURIComponent(match[1]).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  return expandCalendarDayCell(date, base);
}

/** Some pages have mini-calendars that duplicate dates — keep the main grid cell. */
export function dedupeCalendarCells(cells: CalendarDayCell[]): CalendarDayCell[] {
  const byDate = new Map<string, CalendarDayCell>();

  for (const cell of cells) {
    const existing = byDate.get(cell.date);
    if (!existing) {
      byDate.set(cell.date, cell);
      continue;
    }
    // Main monthly grid is wider and usually further right than mini calendars.
    const cellScore = cell.x + cell.width;
    const existingScore = existing.x + existing.width;
    if (cellScore > existingScore) {
      byDate.set(cell.date, cell);
    }
  }

  return [...byDate.values()];
}
