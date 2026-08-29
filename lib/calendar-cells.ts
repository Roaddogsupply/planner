import type { CalendarDayCell } from "@/lib/calendar-types";

type LinkOverlay = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function parseCalendarDayFromUri(
  uri: string,
  base: LinkOverlay,
): CalendarDayCell | null {
  const match = uri.match(/FROMDATE=([^&%]+)/);
  if (!match) return null;

  const date = decodeURIComponent(match[1]).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  return {
    date,
    x: base.x,
    y: base.y,
    width: Math.max(base.width, 6.5),
    height: Math.max(base.height, 5),
  };
}
