import type { CalendarEvent, CalendarSyncResult } from "@/lib/calendar-types";

const FEED_URL_KEY = "road-dog-planner-ical-url";
const CACHE_KEY = "road-dog-planner-ical-cache";

export function loadCalendarFeedUrl(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(FEED_URL_KEY);
}

export function saveCalendarFeedUrl(url: string | null) {
  if (typeof window === "undefined") return;
  if (url) {
    localStorage.setItem(FEED_URL_KEY, url);
  } else {
    localStorage.removeItem(FEED_URL_KEY);
  }
}

export function loadCalendarCache(): CalendarSyncResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CalendarSyncResult;
    // Drop old cache shape that lacks startDate
    if (parsed.events?.[0] && !("startDate" in parsed.events[0])) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveCalendarCache(result: CalendarSyncResult) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(result));
}

export function clearCalendarCache() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}

export function eventsForDate(events: CalendarEvent[], date: string) {
  return events.filter((event) => {
    const startDate = event.startDate ?? event.start.slice(0, 10);
    const endDate = event.endDate ?? event.end.slice(0, 10);

    if (event.allDay && endDate && endDate !== startDate) {
      return date >= startDate && date < endDate;
    }

    return startDate === date;
  });
}

export function eventsOnPage(events: CalendarEvent[], cells: { date: string }[]) {
  const dates = new Set(cells.map((cell) => cell.date));
  return events.filter((event) => {
    const startDate = event.startDate ?? event.start.slice(0, 10);
    return dates.has(startDate);
  });
}
