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
    return JSON.parse(raw) as CalendarSyncResult;
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
    const eventDate = event.allDay ? event.start.slice(0, 10) : event.start.slice(0, 10);
    if (eventDate === date) return true;
    if (event.allDay && event.end) {
      const endExclusive = event.end.slice(0, 10);
      return date >= eventDate && date < endExclusive;
    }
    return false;
  });
}

export function groupEventsByDate(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const start = event.start.slice(0, 10);
    const list = map.get(start) ?? [];
    list.push(event);
    map.set(start, list);
  }
  return map;
}
