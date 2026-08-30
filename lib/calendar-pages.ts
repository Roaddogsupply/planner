import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";

/** Whole-year overview spreads — event titles are too cramped here. */
export const YEAR_OVERVIEW_PAGES = [121, 122] as const;

/** Three-month quarterly spreads — same compact purple date boxes. */
export const QUARTERLY_PLANNER_PAGES = [124, 125, 126, 127] as const;

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

export type CalendarPageIndex = {
  datePageMap: Record<string, number>;
  dailyPlannerPages: number[];
};

export function isYearOverviewPage(pageNumber: number) {
  return YEAR_OVERVIEW_PAGES.includes(pageNumber as (typeof YEAR_OVERVIEW_PAGES)[number]);
}

export function isQuarterlyPlannerPage(pageNumber: number) {
  return QUARTERLY_PLANNER_PAGES.includes(
    pageNumber as (typeof QUARTERLY_PLANNER_PAGES)[number],
  );
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

/**
 * Maps each calendar date to its daily planner spread.
 * Uses the printed day header ("12 Wed August 2026") rather than sidebar mini-cal links.
 */
export async function buildCalendarPageIndex(pdf: PDFDocumentProxy): Promise<CalendarPageIndex> {
  const datePageMap = new Map<string, number>();
  const dailyPlannerPages = new Set<number>();

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    if (isCompactCalendarPage(pageNumber)) continue;

    const page = await pdf.getPage(pageNumber);
    const annotations = await page.getAnnotations();
    const fromDateCount = countFromDateLinks(annotations);

    // Daily spreads have a small month mini-calendar (~42 links).
    if (fromDateCount < 35 || fromDateCount > 55) continue;

    const text = (await page.getTextContent()).items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    if (!isDailyPlannerSpread(text)) continue;

    const date = extractDailyPageDate(text);
    if (!date) continue;

    datePageMap.set(date, pageNumber);
    dailyPlannerPages.add(pageNumber);
  }

  return {
    datePageMap: Object.fromEntries(datePageMap),
    dailyPlannerPages: [...dailyPlannerPages],
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
