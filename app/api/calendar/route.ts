import ical from "node-ical";
import { NextResponse } from "next/server";
import type { CalendarEvent } from "@/lib/calendar-types";

function normalizeFeedUrl(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("webcal://")) {
    return `https://${trimmed.slice("webcal://".length)}`;
  }
  return trimmed;
}

function isAllowedFeedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local")) return false;
    if (/^127\.|^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function fetchCalendarText(feedUrl: string) {
  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RoadDogPlanner/1.0)",
      Accept: "text/calendar, text/plain, */*",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`Calendar feed returned ${response.status}`);
  }

  return response.text();
}

function formatUtcDate(value: Date) {
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatLocalDate(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toIso(value: Date) {
  return value.toISOString();
}

function parseEvent(item: Record<string, unknown>): CalendarEvent | null {
  if (item.type !== "VEVENT") return null;

  const event = item as {
    uid?: string;
    summary?: string | { toString(): string };
    start?: Date;
    end?: Date;
    datetype?: string;
  };

  if (!(event.start instanceof Date)) return null;

  const summary = event.summary?.toString() || "Busy";
  const allDay = event.datetype === "date";
  const startDate = allDay ? formatUtcDate(event.start) : formatLocalDate(event.start);
  const endDate =
    event.end instanceof Date
      ? allDay
        ? formatUtcDate(event.end)
        : formatLocalDate(event.end)
      : startDate;

  return {
    id: String(event.uid ?? `${summary}-${startDate}`),
    summary,
    startDate,
    endDate,
    allDay,
    start: toIso(event.start),
    end: event.end instanceof Date ? toIso(event.end) : toIso(event.start),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { feedUrl?: string };
    const feedUrl = normalizeFeedUrl(body.feedUrl ?? "");

    if (!feedUrl || !isAllowedFeedUrl(feedUrl)) {
      return NextResponse.json(
        { error: "Please paste a valid https:// or webcal:// calendar link." },
        { status: 400 },
      );
    }

    const parsed = await ical.async.parseICS(await fetchCalendarText(feedUrl));
    const events: CalendarEvent[] = [];

    for (const item of Object.values(parsed)) {
      if (!item || typeof item !== "object") continue;
      const event = parseEvent(item as Record<string, unknown>);
      if (event) events.push(event);
    }

    events.sort((a, b) => a.startDate.localeCompare(b.startDate));

    return NextResponse.json({
      events,
      fetchedAt: new Date().toISOString(),
      count: events.length,
    });
  } catch (error) {
    console.error("Calendar sync failed:", error);
    return NextResponse.json(
      {
        error:
          "Could not read that calendar link. In Apple Calendar, copy the public iCal subscription URL and try again.",
      },
      { status: 502 },
    );
  }
}
