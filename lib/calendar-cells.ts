import type { CalendarDayCell } from "@/lib/calendar-types";
import { isCompactCalendarPage } from "@/lib/calendar-pages";

export type CalendarOverlayLayout = {
  compact: boolean;
  variant: "overview" | "daily" | "week" | "default";
};

type LinkOverlay = {
  x: number;
  y: number;
  width: number;
  height: number;
  uri?: string;
};

/** Must match expandLink(padding) in scripts/extract-planner-links.mjs */
const STORED_LINK_HIT_PADDING = 0.5;

/** Turn a stored tap target back into the tight date-box overlay used on mini calendars. */
export function overlayCellFromStoredLink(link: LinkOverlay, date: string): CalendarDayCell {
  const raw: LinkOverlay = {
    x: link.x + STORED_LINK_HIT_PADDING,
    y: link.y + STORED_LINK_HIT_PADDING,
    width: link.width - STORED_LINK_HIT_PADDING * 2,
    height: link.height - STORED_LINK_HIT_PADDING * 2,
  };
  return expandCalendarDayCell(date, raw, true);
}

/** Build calendar day hit areas from prebuilt planner-links.json (Safari-safe). */
export function collectDayCellsFromLinks(links: LinkOverlay[]): CalendarDayCell[] {
  const dayCells: CalendarDayCell[] = [];

  for (const link of links) {
    if (!link.uri) continue;
    const match = link.uri.match(/FROMDATE=([^&%]+)/);
    if (!match) continue;

    const date = decodeURIComponent(match[1]).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    dayCells.push(overlayCellFromStoredLink(link, date));
  }

  return dayCells;
}

/** Pick compact vs title overlay and which mini-calendar band to use. */
export function resolveCalendarOverlayLayout(
  pageNumber: number,
  dayCells: CalendarDayCell[],
  options?: {
    /** Daily spread detected from page text (Breakfast + Snacks). */
    isDailySpreadText?: boolean;
    weekPlannerPages?: number[];
  },
): CalendarOverlayLayout {
  if (isCompactCalendarPage(pageNumber)) {
    return { compact: true, variant: "overview" };
  }

  const fromDateLinkCount = dayCells.length;
  const dailyMiniCalCells = dayCells.filter(
    (cell) => cell.x >= 25 && cell.x <= 50 && cell.y >= 18 && cell.y <= 32,
  );
  const isDailyMiniCal =
    !!options?.isDailySpreadText &&
    fromDateLinkCount >= 35 &&
    fromDateLinkCount <= 55 &&
    dailyMiniCalCells.length >= 38;

  const isWeekSpread =
    !isDailyMiniCal &&
    fromDateLinkCount >= 35 &&
    fromDateLinkCount <= 55 &&
    ((options?.weekPlannerPages?.includes(pageNumber) ?? false) ||
      dayCells.some((cell) => cell.y >= 22 && cell.y <= 36));

  if (isDailyMiniCal) return { compact: true, variant: "daily" };
  if (isWeekSpread) return { compact: true, variant: "week" };
  return { compact: false, variant: "default" };
}

/** Month centers on compact calendar spreads — used to pick the right mini calendar. */
const COMPACT_CALENDAR_MONTH_ANCHORS: Record<number, Record<number, { x: number; y: number }>> = {
  121: {
    1: { x: 14.7, y: 28 },
    2: { x: 22.6, y: 28.9 },
    3: { x: 36.1, y: 28.9 },
    4: { x: 62, y: 28 },
    5: { x: 78.3, y: 28 },
    6: { x: 86.2, y: 28 },
    7: { x: 13.3, y: 64.4 },
    8: { x: 31.1, y: 64.4 },
    9: { x: 38.9, y: 64.4 },
    10: { x: 63.4, y: 64.4 },
    11: { x: 71.2, y: 65.2 },
    12: { x: 87.6, y: 64.4 },
  },
  122: {
    1: { x: 19.1, y: 30.6 },
    2: { x: 29.8, y: 31.9 },
    3: { x: 9.5, y: 56.1 },
    4: { x: 37, y: 54.8 },
    5: { x: 21.4, y: 79 },
    6: { x: 32.2, y: 79 },
    7: { x: 65.3, y: 30.6 },
    8: { x: 92.8, y: 30.6 },
    9: { x: 63, y: 54.8 },
    10: { x: 88, y: 54.8 },
    11: { x: 58.2, y: 80.4 },
    12: { x: 83.2, y: 79 },
  },
  124: {
    1: { x: 32.1, y: 30.6 },
    2: { x: 11, y: 56.1 },
    3: { x: 11, y: 80.4 },
  },
  125: {
    4: { x: 26.8, y: 30.6 },
    5: { x: 37.4, y: 54.8 },
    6: { x: 16.3, y: 79 },
  },
  126: {
    7: { x: 26.8, y: 30.6 },
    8: { x: 42.7, y: 54.8 },
    9: { x: 21.5, y: 79 },
  },
  127: {
    10: { x: 32.1, y: 30.6 },
    11: { x: 11, y: 56.1 },
    12: { x: 21.5, y: 79 },
  },
};

/** Expand the day-number link into a cell box on the calendar grid. */
export function expandCalendarDayCell(
  date: string,
  base: LinkOverlay,
  compact = false,
): CalendarDayCell {
  if (compact) {
    // Use the PDF link box itself — that is the clickable date square in mini calendars.
    const padX = 0.1;
    const padY = 0.06;
    return {
      date,
      x: base.x - padX,
      y: base.y - padY,
      width: base.width + padX * 2,
      height: base.height + padY * 2,
    };
  }

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
  compact = false,
): CalendarDayCell | null {
  const match = uri.match(/FROMDATE=([^&%]+)/);
  if (!match) return null;

  const date = decodeURIComponent(match[1]).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  return expandCalendarDayCell(date, base, compact);
}

/** Drop sidebar / mini-calendar day links (e.g. Sep preview on the left of August). */
export function filterMainGridCells(
  cells: CalendarDayCell[],
  compact = false,
  variant: "overview" | "daily" | "week" = "overview",
): CalendarDayCell[] {
  if (compact && variant === "daily") {
    return cells.filter(
      (cell) => cell.x >= 25 && cell.x <= 50 && cell.y >= 18 && cell.y <= 32,
    );
  }

  if (compact && variant === "week") {
    return cells.filter(
      (cell) => cell.x >= 25 && cell.x <= 50 && cell.y >= 22 && cell.y <= 36,
    );
  }

  if (compact) {
    return cells.filter(
      (cell) => cell.x >= 10 && cell.x <= 95 && cell.y >= 12 && cell.y <= 90,
    );
  }

  return cells.filter(
    (cell) => cell.x >= 20 && cell.x <= 88 && cell.y >= 14 && cell.y <= 86,
  );
}

function nearestOverviewGridMonth(cell: CalendarDayCell, pageNumber: number) {
  const anchors = COMPACT_CALENDAR_MONTH_ANCHORS[pageNumber];
  if (!anchors) return 0;

  const centerX = cell.x + cell.width / 2;
  const centerY = cell.y + cell.height / 2;
  let bestMonth = 1;
  let bestDistance = Infinity;

  for (const [monthStr, anchor] of Object.entries(anchors)) {
    const distance = Math.hypot(centerX - anchor.x, centerY - anchor.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMonth = parseInt(monthStr, 10);
    }
  }

  return bestMonth;
}

function scoreCompactCalendarCell(cell: CalendarDayCell, pageNumber: number) {
  const dateMonth = parseInt(cell.date.slice(5, 7), 10);
  const gridMonth = nearestOverviewGridMonth(cell, pageNumber);
  const anchor = COMPACT_CALENDAR_MONTH_ANCHORS[pageNumber]?.[dateMonth];
  if (!anchor) return 0;

  const centerX = cell.x + cell.width / 2;
  const centerY = cell.y + cell.height / 2;
  const distance = Math.hypot(centerX - anchor.x, centerY - anchor.y);

  // Prefer the copy inside that month's mini-calendar, not an adjacent overflow cell.
  const monthMatch = gridMonth === dateMonth ? 10_000 : 0;
  return monthMatch + (1_000 - distance);
}

/** Prefer the main monthly grid when the same date appears twice on one page. */
export function dedupeCalendarCells(
  cells: CalendarDayCell[],
  options?: {
    compact?: boolean;
    pageNumber?: number;
    variant?: "overview" | "daily" | "week" | "default";
  },
): CalendarDayCell[] {
  const { compact = false, pageNumber, variant = "overview" } = options ?? {};
  const byDate = new Map<string, CalendarDayCell>();
  const useOverviewScoring =
    compact &&
    variant === "overview" &&
    pageNumber != null &&
    COMPACT_CALENDAR_MONTH_ANCHORS[pageNumber] != null;

  for (const cell of cells) {
    const existing = byDate.get(cell.date);
    if (!existing) {
      byDate.set(cell.date, cell);
      continue;
    }

    const score = (c: CalendarDayCell) => {
      if (useOverviewScoring) {
        return scoreCompactCalendarCell(c, pageNumber!);
      }

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

export function prepareCalendarCells(
  cells: CalendarDayCell[],
  compact = false,
  pageNumber?: number,
  variant: "overview" | "daily" | "week" = "overview",
): CalendarDayCell[] {
  return dedupeCalendarCells(filterMainGridCells(cells, compact, variant), {
    compact,
    pageNumber,
    variant,
  });
}
