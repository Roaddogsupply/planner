import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { PlannerCloudSnapshot } from "@/lib/planner-cloud-types";

const DATA_DIR = path.join(process.cwd(), ".data", "planners");

const PLANNER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidPlannerId(id: string) {
  return PLANNER_ID_PATTERN.test(id);
}

async function plannerFilePath(id: string) {
  await mkdir(DATA_DIR, { recursive: true });
  return path.join(DATA_DIR, `${id}.json`);
}

export async function readPlannerSnapshot(id: string): Promise<PlannerCloudSnapshot | null> {
  if (!isValidPlannerId(id)) return null;

  try {
    const raw = await readFile(await plannerFilePath(id), "utf8");
    return JSON.parse(raw) as PlannerCloudSnapshot;
  } catch {
    return null;
  }
}

export async function writePlannerSnapshot(id: string, snapshot: PlannerCloudSnapshot) {
  if (!isValidPlannerId(id)) {
    throw new Error("Invalid planner id");
  }

  await writeFile(await plannerFilePath(id), JSON.stringify(snapshot, null, 2), "utf8");
}
