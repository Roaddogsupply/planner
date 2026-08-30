import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";

/** Whole-year overview spreads — event titles are too cramped here. */
export const YEAR_OVERVIEW_PAGES = [121, 122] as const;

/** Three-month quarterly spreads — same compact purple date boxes. */
export const QUARTERLY_PLANNER_PAGES = [124, 125, 126, 127] as const;

/** Left sidebar month tabs on monthly spreads (Jan–Dec). */
export const MONTHLY_TAB_PAGES = [
  129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140,
] as const;

const MONTHLY_PLANNER_PAGES = MONTHLY_TAB_PAGES;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const CALENDAR_TAB_Y_ANCHORS = [7.6, 14.1, 20.5, 27, 33.5, 40, 46.4, 52.9, 59.4, 65.8, 72.3, 78.8, 85.3];

export type CalendarPageIndex = {
  datePageMap: Record<string, number>;
  dailyPageDates: Record<number, string>;
  weekPageMap: Record<string, number>;
  /** Week spread whose top row begins on this Sunday (YYYY-MM-DD). */
  weekPageByStart: Record<string, number>;
  monthPageMap: Record<string, number>;
  yearPageMap: Record<string, number>;
  dailyPlannerPages: number[];
  weekPlannerPages: number[];
  monthlyPlannerPages: number[];
};

export function isYearOverviewPage(pageNumber: number) {
  return YEAR_OVERVIEW_PAGES.includes(pageNumber as (typeof YEAR_OVERVIEW_PAGES)[number]);
}

export function isQuarterlyPlannerPage(pageNumber: number) {
  return QUARTERLY_PLANNER_PAGES.includes(
    pageNumber as (typeof QUARTERLY_PLANNER_PAGES)[number],
  );
}

export function isMonthlyPlannerPage(pageNumber: number) {
  return MONTHLY_PLANNER_PAGES.includes(pageNumber as (typeof MONTHLY_PLANNER_PAGES)[number]);
}

/** Mini-calendar spreads that tint dates purple instead of listing titles. */
export function isCompactCalendarPage(pageNumber: number) {
  return isYearOverviewPage(pageNumber) || isQuarterlyPlannerPage(pageNumber);
}

export function parseDateFromCalendarUri(uri: string) {
  const match = uri.match(/FROMDATE=([^&%]+)/);
  if (!match) return null;
  const date = decodeURIComponent(match[1]).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

/** Sunday that starts the week containing this YYYY-MM-DD date (UTC-safe). */
export function sundayOfWeek(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() - utc.getUTCDay());
  return utc.toISOString().slice(0, 10);
}

export function resolveMonthPage(date: string) {
  const monthIndex = parseInt(date.slice(5, 7), 10);
  if (monthIndex < 1 || monthIndex > 12) return null;
  return MONTHLY_TAB_PAGES[monthIndex - 1];
}

export function resolveWeekPage(date: string, index: CalendarPageIndex) {
  const weekStart = sundayOfWeek(date);
  const cached = index.weekPageByStart?.[weekStart];
  if (cached) return cached;

  // Fallback while the index is still building.
  return index.weekPageMap[date] ?? index.weekPageMap[weekStart] ?? null;
}

export function calendarDateContext(
  pageNumber: number,
  activeDate: string | null,
  index: CalendarPageIndex,
) {
  return activeDate ?? dateForPlannerPage(pageNumber, index);
}

function extractDailyPageDate(text: string) {
  for (const month of MONTH_NAMES) {
    const match = text.match(new RegExp(`(\\d{1,2})\\s+\\w+\\s+${month}\\s+(\\d{4})`));
    if (!match) continue;

    const day = match[1].padStart(2, "0");
    const monthIndex = String(MONTH_NAMES.indexOf(month) + 1).padStart(2, "0");
    return `${match[2]}-${monthIndex}-${day}`;
  }

  return null;
}

function isDailyPlannerSpread(text: string) {
  return text.includes("Breakfast") && text.includes("Snacks");
}

function countFromDateLinks(annotations: Array<{ subtype?: string; url?: string; unsafeUrl?: string }>) {
  let count = 0;

  for (const annotation of annotations) {
    if (annotation.subtype !== "Link") continue;
    const uri = annotation.url || annotation.unsafeUrl || "";
    if (parseDateFromCalendarUri(uri)) count++;
  }

  return count;
}

function collectFromDates(annotations: Array<{ subtype?: string; url?: string; unsafeUrl?: string }>) {
  const dates = new Set<string>();

  for (const annotation of annotations) {
    if (annotation.subtype !== "Link") continue;
    const uri = annotation.url || annotation.unsafeUrl || "";
    const date = parseDateFromCalendarUri(uri);
    if (date) dates.add(date);
  }

  return dates;
}

export function isCalendarSidebarTab(link: { x: number; y: number; width: number }) {
  return link.x < 6 && link.width < 5 && link.y >= 6 && link.y <= 90;
}

export function getCalendarSidebarTabIndex(link: { y: number }) {
  let bestIndex = 0;
  let bestDistance = Infinity;

  for (let index = 0; index < CALENDAR_TAB_Y_ANCHORS.length; index++) {
    const distance = Math.abs(link.y - CALENDAR_TAB_Y_ANCHORS[index]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

export function isCalendarIndexReady(index: CalendarPageIndex) {
  return index.dailyPlannerPages.length > 0 && Object.keys(index.datePageMap).length > 0;
}

export function needsCalendarSidebarOverride(pageNumber: number, index: CalendarPageIndex) {
  return (
    index.dailyPlannerPages.includes(pageNumber) ||
    index.weekPlannerPages.includes(pageNumber) ||
    index.monthlyPlannerPages.includes(pageNumber)
  );
}

/** Fix sidebar tabs that point at random daily pages in the PDF. */
export function resolveCalendarSidebarNavigation(
  tabIndex: number,
  currentPage: number,
  activeDate: string | null,
  index: CalendarPageIndex,
): number | null {
  if (!needsCalendarSidebarOverride(currentPage, index)) {
    return null;
  }

  if (tabIndex === 0) {
    const dateContext = calendarDateContext(currentPage, activeDate, index);

    if (index.dailyPlannerPages.includes(currentPage)) {
      if (!dateContext) {
        return index.yearPageMap["2026"] ?? YEAR_OVERVIEW_PAGES[0];
      }
      return resolveWeekPage(dateContext, index);
    }

    if (index.weekPlannerPages.includes(currentPage)) {
      if (!dateContext) {
        return index.yearPageMap["2026"] ?? YEAR_OVERVIEW_PAGES[0];
      }
      return resolveMonthPage(dateContext);
    }

    if (index.monthlyPlannerPages.includes(currentPage)) {
      const year = dateContext?.slice(0, 4) ?? "2026";
      return index.yearPageMap[year] ?? YEAR_OVERVIEW_PAGES[0];
    }
  }

  if (tabIndex >= 1 && tabIndex <= 12) {
    return MONTHLY_TAB_PAGES[tabIndex - 1];
  }

  return null;
}

function collectWeekRows(
  annotations: Array<{ subtype?: string; url?: string; unsafeUrl?: string; rect?: number[] }>,
  viewport: { convertToViewportPoint: (x: number, y: number) => number[]; width: number; height: number },
) {
  const byY = new Map<number, string[]>();

  for (const annotation of annotations) {
    if (annotation.subtype !== "Link") continue;
    const uri = annotation.url || annotation.unsafeUrl || "";
    const date = parseDateFromCalendarUri(uri);
    if (!date || !annotation.rect) continue;

    const rect = annotation.rect;
    const [vx1, vy1] = viewport.convertToViewportPoint(rect[0], rect[1]);
    const [vx2, vy2] = viewport.convertToViewportPoint(rect[2], rect[3]);
    const y = Math.round((Math.min(vy1, vy2) / viewport.height) * 100);
    const bucket = byY.get(y) ?? [];
    bucket.push(date);
    byY.set(y, bucket);
  }

  return [...byY.entries()]
    .sort(([yA], [yB]) => yA - yB)
    .map(([y, dates]) => ({
      y,
      sunday: dates.sort()[0],
    }));
}

/**
 * Maps calendar dates to daily/week/month/year spreads.
 * Daily pages use the printed header; week pages use each spread's top-row Sunday.
 */
export async function buildCalendarPageIndex(pdf: PDFDocumentProxy): Promise<CalendarPageIndex> {
  const datePageMap = new Map<string, number>();
  const dailyPageDates: Record<number, string> = {};
  const weekPageMap = new Map<string, number>();
  const weekPageByStart = new Map<string, { page: number; rowY: number }>();
  const monthPageMap: Record<string, number> = {};
  const dailyPlannerPages = new Set<number>();
  const weekPlannerPages = new Set<number>();

  for (let monthIndex = 1; monthIndex <= 12; monthIndex++) {
    const monthKey = `2026-${String(monthIndex).padStart(2, "0")}`;
    monthPageMap[monthKey] = MONTHLY_TAB_PAGES[monthIndex - 1];
  }

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    if (isCompactCalendarPage(pageNumber)) continue;

    const page = await pdf.getPage(pageNumber);
    const annotations = await page.getAnnotations();
    const fromDateCount = countFromDateLinks(annotations);

    if (fromDateCount >= 35 && fromDateCount <= 55) {
      const viewport = page.getViewport({ scale: 1 });
      const text = (await page.getTextContent()).items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");

      if (isDailyPlannerSpread(text)) {
        const date = extractDailyPageDate(text);
        if (date) {
          datePageMap.set(date, pageNumber);
          dailyPageDates[pageNumber] = date;
          dailyPlannerPages.add(pageNumber);
          continue;
        }
      }

      if (!text.includes("Breakfast")) {
        weekPlannerPages.add(pageNumber);

        const rows = collectWeekRows(annotations, viewport);
        for (const row of rows) {
          const existing = weekPageByStart.get(row.sunday);
          if (
            !existing ||
            row.y < existing.rowY ||
            (row.y === existing.rowY && pageNumber < existing.page)
          ) {
            weekPageByStart.set(row.sunday, { page: pageNumber, rowY: row.y });
          }
        }

        for (const date of collectFromDates(annotations)) {
          const existing = weekPageMap.get(date);
          if (existing === undefined || pageNumber < existing) {
            weekPageMap.set(date, pageNumber);
          }
        }
      }
    }
  }

  return {
    datePageMap: Object.fromEntries(datePageMap),
    dailyPageDates,
    weekPageMap: Object.fromEntries(weekPageMap),
    weekPageByStart: Object.fromEntries(
      [...weekPageByStart.entries()].map(([sunday, entry]) => [sunday, entry.page]),
    ),
    monthPageMap,
    yearPageMap: { "2026": YEAR_OVERVIEW_PAGES[0], "2027": YEAR_OVERVIEW_PAGES[1] },
    dailyPlannerPages: [...dailyPlannerPages],
    weekPlannerPages: [...weekPlannerPages],
    monthlyPlannerPages: [...MONTHLY_PLANNER_PAGES],
  };
}

/** @deprecated Use buildCalendarPageIndex */
export async function buildCalendarDatePageMap(pdf: PDFDocumentProxy) {
  const index = await buildCalendarPageIndex(pdf);
  return new Map(Object.entries(index.datePageMap));
}

export function resolveCalendarDayPage(
  date: string,
  datePageMap: Record<string, number>,
) {
  return datePageMap[date] ?? null;
}

export function dateForPlannerPage(pageNumber: number, index: CalendarPageIndex) {
  return index.dailyPageDates[pageNumber] ?? null;
}
