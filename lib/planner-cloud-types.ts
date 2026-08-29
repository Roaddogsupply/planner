import type { PlannerData } from "@/lib/annotations";

export type PlannerCloudSnapshot = PlannerData & {
  calendarFeedUrl?: string | null;
  updatedAt: string;
};

export function createCloudSnapshot(
  data: PlannerData,
  calendarFeedUrl?: string | null,
): PlannerCloudSnapshot {
  return {
    ...data,
    calendarFeedUrl: calendarFeedUrl ?? null,
    updatedAt: new Date().toISOString(),
  };
}
