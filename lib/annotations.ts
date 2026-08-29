export type TextAnnotation = {
  kind: "text";
  id: string;
  page: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  width: number;
};

export type CheckboxAnnotation = {
  kind: "checkbox";
  id: string;
  page: number;
  x: number;
  y: number;
  checked: boolean;
  size: number;
};

export type PlannerAnnotation = TextAnnotation | CheckboxAnnotation;

export type PlannerTool = "text" | "checkbox";

export type PlannerData = {
  version: 2;
  annotations: PlannerAnnotation[];
  lastPage: number;
  zoom: number;
  tool: PlannerTool;
};

const STORAGE_KEY = "road-dog-planner-data";

function normalizeAnnotation(raw: Record<string, unknown>): PlannerAnnotation | null {
  if (raw.kind === "checkbox") {
    return raw as CheckboxAnnotation;
  }
  if (raw.kind === "text" || raw.text !== undefined) {
    return {
      kind: "text",
      id: String(raw.id),
      page: Number(raw.page),
      x: Number(raw.x),
      y: Number(raw.y),
      text: String(raw.text ?? ""),
      fontSize: Number(raw.fontSize ?? 14),
      width: Number(raw.width ?? 35),
    };
  }
  return null;
}

export function loadPlannerData(): PlannerData {
  const fallback: PlannerData = {
    version: 2,
    annotations: [],
    lastPage: 1,
    zoom: 1,
    tool: "text",
  };

  if (typeof window === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as Partial<PlannerData> & {
      annotations?: Record<string, unknown>[];
    };

    return {
      version: 2,
      annotations: (parsed.annotations ?? [])
        .map((item) => normalizeAnnotation(item))
        .filter((item): item is PlannerAnnotation => item !== null),
      lastPage: parsed.lastPage ?? 1,
      zoom: parsed.zoom ?? 1,
      tool: parsed.tool ?? "text",
    };
  } catch {
    return fallback;
  }
}

export function savePlannerData(data: PlannerData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createTextAnnotation(
  page: number,
  x: number,
  y: number,
  fontSize = 14,
): TextAnnotation {
  return {
    kind: "text",
    id: crypto.randomUUID(),
    page,
    x,
    y,
    text: "",
    fontSize,
    width: 40,
  };
}

export function createCheckboxAnnotation(
  page: number,
  x: number,
  y: number,
): CheckboxAnnotation {
  return {
    kind: "checkbox",
    id: crypto.randomUUID(),
    page,
    x,
    y,
    checked: true,
    size: 2.2,
  };
}

export function isTextAnnotation(item: PlannerAnnotation): item is TextAnnotation {
  return item.kind === "text";
}

export function isCheckboxAnnotation(item: PlannerAnnotation): item is CheckboxAnnotation {
  return item.kind === "checkbox";
}
