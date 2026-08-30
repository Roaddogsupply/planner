import { NextResponse } from "next/server";
import { migratePlannerData } from "@/lib/annotations";
import type { PlannerCloudSnapshot } from "@/lib/planner-cloud-types";
import { isValidCloudSnapshot } from "@/lib/planner-cloud-types";
import {
  isValidPlannerId,
  readPlannerSnapshot,
  writePlannerSnapshot,
} from "@/lib/planner-server-store";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";

  if (!isValidPlannerId(id)) {
    return NextResponse.json({ error: "Invalid planner id" }, { status: 400 });
  }

  const snapshot = await readPlannerSnapshot(id);
  if (!snapshot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      snapshot?: PlannerCloudSnapshot & { version?: number };
    };

    const id = body.id ?? "";
    const snapshot = body.snapshot;

    if (!isValidPlannerId(id) || !isValidCloudSnapshot(snapshot)) {
      return NextResponse.json({ error: "Invalid planner data" }, { status: 400 });
    }

    const normalized = migratePlannerData(snapshot);

    await writePlannerSnapshot(id, {
      ...normalized,
      calendarFeedUrl: snapshot.calendarFeedUrl ?? null,
      calendarCache: snapshot.calendarCache ?? null,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Planner save failed:", error);
    return NextResponse.json({ error: "Could not save planner" }, { status: 500 });
  }
}
