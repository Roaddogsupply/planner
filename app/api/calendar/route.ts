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

function toIso(value: Date | { toISOString?: () => string } | string | undefined) {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  if (typeof value.toISOString === "function") return value.toISOString();
  return new Date(String(value)).toISOString();
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

    const parsed = await ical.async.fromURL(feedUrl);
    const events: CalendarEvent[] = [];

    for (const item of Object.values(parsed)) {
      if (!item || typeof item !== "object" || !("type" in item) || item.type !== "VEVENT") {
        continue;
      }

      const event = item as {
        uid?: string;
        summary?: string | { toString(): string };
        start?: Date | string;
        end?: Date | string;
        datetype?: string;
      };
      const summary = event.summary?.toString() || "Busy";
      const start = toIso(event.start as Date);
      const end = toIso(event.end as Date);
      const allDay =
        Boolean(event.datetype && String(event.datetype).includes("DATE")) ||
        start.includes("T00:00:00");

      events.push({
        id: String(event.uid ?? `${summary}-${start}`),
        summary,
        start,
        end,
        allDay,
      });
    }

    events.sort((a, b) => a.start.localeCompare(b.start));

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
          "Could not read that calendar link. In Apple Calendar, copy the private iCal subscription URL and try again.",
      },
      { status: 502 },
    );
  }
}
