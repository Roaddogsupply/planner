import type { PlannerData } from "@/lib/annotations";
import type { CalendarSyncResult } from "@/lib/calendar-types";

export type PlannerCloudSnapshot = PlannerData & {
  calendarFeedUrl?: string | null;
  calendarCache?: CalendarSyncResult | null;
  updatedAt: string;
};

export function isValidCloudSnapshot(
  snapshot: { version?: number } | null | undefined,
): snapshot is PlannerCloudSnapshot {
  return snapshot?.version === 3 || snapshot?.version === 4;
}

export function createCloudSnapshot(
  data: PlannerData,
  calendarFeedUrl?: string | null,
  calendarCache?: CalendarSyncResult | null,
): PlannerCloudSnapshot {
  return {
    ...data,
    calendarFeedUrl: calendarFeedUrl ?? null,
    calendarCache: calendarCache ?? null,
    updatedAt: new Date().toISOString(),
  };
}
