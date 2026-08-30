import {
  DEFAULT_TEXT_STYLE,
  normalizeTextStyle,
  type TextStyle,
} from "@/lib/text-styles";
import { normalizeFontFamily } from "@/lib/google-fonts";
import { PAGE_DISPLAY_ASPECT } from "@/lib/image-utils";

export type TextAnnotation = {
  kind: "text";
  id: string;
  page: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
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

export type ImageAnnotation = {
  kind: "image";
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** naturalWidth / naturalHeight — used to keep proportions correct */
  aspectRatio: number;
  src: string;
};

export type PlannerAnnotation = TextAnnotation | CheckboxAnnotation | ImageAnnotation;

export type PlannerTool = "text" | "checkbox" | "image";

export type PlannerData = {
  version: 3;
  annotations: PlannerAnnotation[];
  lastPage: number;
  zoom: number;
  tool: PlannerTool;
  textStyle?: TextStyle;
};

const STORAGE_KEY = "road-dog-planner-data";

function inferImageAspectRatio(raw: Record<string, unknown>) {
  const width = Number(raw.width ?? 25);
  const height = Number(raw.height ?? 20);
  if (width > 0 && height > 0) {
    return (width / height) * PAGE_DISPLAY_ASPECT;
  }
  return 1;
}

function normalizeAnnotation(raw: Record<string, unknown>): PlannerAnnotation | null {
  if (raw.kind === "image" && typeof raw.src === "string") {
    return {
      kind: "image",
      id: String(raw.id),
      page: Number(raw.page),
      x: Number(raw.x),
      y: Number(raw.y),
      width: Number(raw.width ?? 25),
      height: Number(raw.height ?? 20),
      aspectRatio: Number(raw.aspectRatio) || inferImageAspectRatio(raw),
      src: raw.src,
    };
  }
  if (raw.kind === "checkbox") {
    return raw as CheckboxAnnotation;
  }
  if (raw.kind === "text" || raw.text !== undefined) {
    const style = normalizeTextStyle({
      fontSize: Number(raw.fontSize),
      fontFamily: normalizeFontFamily(raw.fontFamily),
      color: typeof raw.color === "string" ? raw.color : undefined,
    });
    return {
      kind: "text",
      id: String(raw.id),
      page: Number(raw.page),
      x: Number(raw.x),
      y: Number(raw.y),
      text: String(raw.text ?? ""),
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      color: style.color,
      width: Number(raw.width ?? 35),
    };
  }
  return null;
}

export function loadPlannerData(): PlannerData {
  const fallback: PlannerData = {
    version: 3,
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
      version: 3,
      annotations: (parsed.annotations ?? [])
        .map((item) => normalizeAnnotation(item))
        .filter((item): item is PlannerAnnotation => item !== null),
      lastPage: parsed.lastPage ?? 1,
      zoom: parsed.zoom ?? 1,
      tool: parsed.tool ?? "text",
      textStyle: normalizeTextStyle(parsed.textStyle),
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
  style: Partial<TextStyle> = {},
): TextAnnotation {
  const normalized = normalizeTextStyle(style);
  return {
    kind: "text",
    id: crypto.randomUUID(),
    page,
    x,
    y,
    text: "",
    fontSize: normalized.fontSize,
    fontFamily: normalized.fontFamily,
    color: normalized.color,
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

export function createImageAnnotation(
  page: number,
  x: number,
  y: number,
  src: string,
  width = 28,
  height = 20,
  aspectRatio = (width / height) * PAGE_DISPLAY_ASPECT,
): ImageAnnotation {
  return {
    kind: "image",
    id: crypto.randomUUID(),
    page,
    x,
    y,
    width,
    height,
    aspectRatio,
    src,
  };
}

export function isTextAnnotation(item: PlannerAnnotation): item is TextAnnotation {
  return item.kind === "text";
}

export function isCheckboxAnnotation(item: PlannerAnnotation): item is CheckboxAnnotation {
  return item.kind === "checkbox";
}

export function isImageAnnotation(item: PlannerAnnotation): item is ImageAnnotation {
  return item.kind === "image";
}
