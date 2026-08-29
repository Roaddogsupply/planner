import type { CalendarDayCell } from "@/lib/calendar-types";

type LinkOverlay = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Expand the apple-icon anchor into a centered day cell box on the main grid. */
export function expandCalendarDayCell(date: string, base: LinkOverlay): CalendarDayCell {
  const iconCenterX = base.x + base.width / 2;
  const iconCenterY = base.y + base.height / 2;
  const width = 7.2;
  const height = 9;

  return {
    date,
    x: iconCenterX - width / 2,
    y: iconCenterY - 2.5,
    width,
    height,
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

/** Drop sidebar / mini-calendar day links (e.g. Sep preview on the left of August). */
export function filterMainGridCells(cells: CalendarDayCell[]): CalendarDayCell[] {
  return cells.filter(
    (cell) => cell.x >= 20 && cell.x <= 88 && cell.y >= 14 && cell.y <= 86,
  );
}

/** Prefer the main monthly grid when the same date appears twice on one page. */
export function dedupeCalendarCells(cells: CalendarDayCell[]): CalendarDayCell[] {
  const byDate = new Map<string, CalendarDayCell>();

  for (const cell of cells) {
    const existing = byDate.get(cell.date);
    if (!existing) {
      byDate.set(cell.date, cell);
      continue;
    }

    const score = (c: CalendarDayCell) => {
      const centerX = c.x + c.width / 2;
      const centerY = c.y + c.height / 2;
      // Main calendar sits in the middle band of the page; mini cals hug the edges.
      const horizontal = centerX >= 25 && centerX <= 75 ? 10 : 0;
      const vertical = centerY >= 25 && centerY <= 72 ? 5 : 0;
      return horizontal + vertical + c.width;
    };

    if (score(cell) > score(existing)) {
      byDate.set(cell.date, cell);
    }
  }

  return [...byDate.values()];
}

export function prepareCalendarCells(cells: CalendarDayCell[]): CalendarDayCell[] {
  return dedupeCalendarCells(filterMainGridCells(cells));
}
