import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";

/** Whole-year overview spreads — event titles are too cramped here. */
export const YEAR_OVERVIEW_PAGES = [121, 122] as const;

export function isYearOverviewPage(pageNumber: number) {
  return YEAR_OVERVIEW_PAGES.includes(pageNumber as (typeof YEAR_OVERVIEW_PAGES)[number]);
}

function parseDateFromCalendarUri(uri: string) {
  const match = uri.match(/FROMDATE=([^&%]+)/);
  if (!match) return null;
  const date = decodeURIComponent(match[1]).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

/**
 * Maps each calendar date to the best monthly/day PDF page for that date.
 * Skips year overviews and other dense index spreads.
 */
export async function buildCalendarDatePageMap(pdf: PDFDocumentProxy) {
  const map = new Map<string, number>();

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    if (isYearOverviewPage(pageNumber)) continue;

    const page = await pdf.getPage(pageNumber);
    const annotations = await page.getAnnotations();

    let fromDateCount = 0;
    const dates = new Set<string>();

    for (const annotation of annotations) {
      if (annotation.subtype !== "Link") continue;
      const uri = annotation.url || annotation.unsafeUrl || "";
      const date = parseDateFromCalendarUri(uri);
      if (!date) continue;
      fromDateCount++;
      dates.add(date);
    }

    // Quarter / year index pages — not day-detail spreads.
    if (fromDateCount > 150) continue;

    for (const date of dates) {
      const existing = map.get(date);
      if (existing === undefined || pageNumber < existing) {
        map.set(date, pageNumber);
      }
    }
  }

  return map;
}

export function resolveCalendarDayPage(
  date: string,
  datePageMap: Record<string, number>,
) {
  return datePageMap[date] ?? null;
}
