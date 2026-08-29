export type TextAnnotation = {
  id: string;
  page: number;
  /** Position as percentage of page width (0-100) */
  x: number;
  /** Position as percentage of page height (0-100) */
  y: number;
  text: string;
  fontSize: number;
  /** Width as percentage of page width */
  width: number;
};

export type PlannerData = {
  version: 1;
  annotations: TextAnnotation[];
  lastPage: number;
  zoom: number;
};

const STORAGE_KEY = "road-dog-planner-data";

export function loadPlannerData(): PlannerData {
  if (typeof window === "undefined") {
    return { version: 1, annotations: [], lastPage: 1, zoom: 1 };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { version: 1, annotations: [], lastPage: 1, zoom: 1 };
    }
    const parsed = JSON.parse(raw) as PlannerData;
    return {
      version: 1,
      annotations: parsed.annotations ?? [],
      lastPage: parsed.lastPage ?? 1,
      zoom: parsed.zoom ?? 1,
    };
  } catch {
    return { version: 1, annotations: [], lastPage: 1, zoom: 1 };
  }
}

export function savePlannerData(data: PlannerData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createAnnotation(
  page: number,
  x: number,
  y: number,
  fontSize = 14,
): TextAnnotation {
  return {
    id: crypto.randomUUID(),
    page,
    x,
    y,
    text: "",
    fontSize,
    width: 30,
  };
}
