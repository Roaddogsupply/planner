import type { PlannerCloudSnapshot } from "@/lib/planner-cloud-types";

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export async function fetchPlannerFromCloud(
  plannerId: string,
): Promise<PlannerCloudSnapshot | null> {
  try {
    const response = await fetch(`/api/planner?id=${encodeURIComponent(plannerId)}`);
    if (response.status === 404) return null;
    if (!response.ok) return null;
    return (await response.json()) as PlannerCloudSnapshot;
  } catch {
    return null;
  }
}

export async function savePlannerToCloud(plannerId: string, snapshot: PlannerCloudSnapshot) {
  const response = await fetch("/api/planner", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: plannerId, snapshot }),
  });

  if (!response.ok) {
    throw new Error("Cloud save failed");
  }
}

export function scheduleCloudSave(
  plannerId: string,
  snapshot: PlannerCloudSnapshot,
  onStatus?: (status: "saving" | "saved" | "offline") => void,
) {
  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    onStatus?.("saving");
    void savePlannerToCloud(plannerId, snapshot)
      .then(() => onStatus?.("saved"))
      .catch(() => onStatus?.("offline"));
  }, 1200);
}
