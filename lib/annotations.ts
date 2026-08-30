import {
  DEFAULT_TEXT_STYLE,
  normalizeTextStyle,
  type TextStyle,
} from "@/lib/text-styles";
import { normalizeFontFamily } from "@/lib/google-fonts";
import { PAGE_DISPLAY_ASPECT } from "@/lib/image-utils";
import { DEFAULT_INSTANCE_ID, type SectionInstance } from "@/lib/section-instances";

export type TextAnnotation = {
  kind: "text";
  id: string;
  page: number;
  instanceId?: string;
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
  instanceId?: string;
  x: number;
  y: number;
  checked: boolean;
  size: number;
};

export type ImageAnnotation = {
  kind: "image";
  id: string;
  page: number;
  instanceId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** naturalWidth / naturalHeight — used to keep proportions correct */
  aspectRatio: number;
  src: string;
};

export type PlannerAnnotation = TextAnnotation | CheckboxAnnotation | ImageAnnotation;

export type PlannerTool = "navigate" | "text" | "checkbox" | "image";

function normalizeTool(tool: unknown): PlannerTool {
  if (tool === "navigate" || tool === "text" || tool === "checkbox" || tool === "image") {
    return tool;
  }
  return "navigate";
}

export type PlannerData = {
  version: 4;
  annotations: PlannerAnnotation[];
  sectionInstances: SectionInstance[];
  activeSectionInstances: Record<number, string>;
  lastPage: number;
  zoom: number;
  tool: PlannerTool;
  textStyle?: TextStyle;
};

export type LegacyPlannerData = {
  version: 3;
  annotations: PlannerAnnotation[];
  lastPage: number;
  zoom: number;
  tool: PlannerTool;
  textStyle?: TextStyle;
};

export type AnyPlannerData = PlannerData | LegacyPlannerData;

export function migratePlannerData(raw: AnyPlannerData): PlannerData {
  if (raw.version === 4) {
    return {
      version: 4,
      annotations: raw.annotations,
      sectionInstances: raw.sectionInstances ?? [],
      activeSectionInstances: raw.activeSectionInstances ?? {},
      lastPage: raw.lastPage,
      zoom: raw.zoom,
      tool: raw.tool,
      textStyle: raw.textStyle,
    };
  }

  return {
    version: 4,
    annotations: raw.annotations,
    sectionInstances: [],
    activeSectionInstances: {},
    lastPage: raw.lastPage,
    zoom: raw.zoom,
    tool: raw.tool,
    textStyle: raw.textStyle,
  };
}

const STORAGE_KEY = "road-dog-planner-data";

function inferImageAspectRatio(raw: Record<string, unknown>) {
  const width = Number(raw.width ?? 25);
  const height = Number(raw.height ?? 20);
  if (width > 0 && height > 0) {
    return (width / height) * PAGE_DISPLAY_ASPECT;
  }
  return 1;
}

function normalizeInstanceId(raw: unknown) {
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

function normalizeAnnotation(raw: Record<string, unknown>): PlannerAnnotation | null {
  const instanceId = normalizeInstanceId(raw.instanceId);

  if (raw.kind === "image" && typeof raw.src === "string") {
    return {
      kind: "image",
      id: String(raw.id),
      page: Number(raw.page),
      instanceId,
      x: Number(raw.x),
      y: Number(raw.y),
      width: Number(raw.width ?? 25),
      height: Number(raw.height ?? 20),
      aspectRatio: Number(raw.aspectRatio) || inferImageAspectRatio(raw),
      src: raw.src,
    };
  }
  if (raw.kind === "checkbox") {
    return {
      kind: "checkbox",
      id: String(raw.id),
      page: Number(raw.page),
      instanceId,
      x: Number(raw.x),
      y: Number(raw.y),
      checked: Boolean(raw.checked),
      size: Number(raw.size ?? 2.2),
    };
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
      instanceId,
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

function normalizeSectionInstances(raw: unknown): SectionInstance[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      if (typeof record.id !== "string" || typeof record.basePage !== "number") return null;
      return {
        id: record.id,
        basePage: Number(record.basePage),
        label: typeof record.label === "string" ? record.label : "Copy",
        createdAt:
          typeof record.createdAt === "string" ? record.createdAt : new Date(0).toISOString(),
      } satisfies SectionInstance;
    })
    .filter((item): item is SectionInstance => item !== null);
}

function normalizeActiveSectionInstances(raw: unknown): Record<number, string> {
  if (!raw || typeof raw !== "object") return {};
  const result: Record<number, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const page = Number(key);
    if (Number.isFinite(page) && typeof value === "string") {
      result[page] = value;
    }
  }
  return result;
}

export function loadPlannerData(): PlannerData {
  const fallback: PlannerData = {
    version: 4,
    annotations: [],
    sectionInstances: [],
    activeSectionInstances: {},
    lastPage: 1,
    zoom: 1,
    tool: "navigate",
  };

  if (typeof window === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as Partial<PlannerData> & Partial<LegacyPlannerData> & {
      annotations?: Record<string, unknown>[];
    };

    const version = parsed.version === 4 ? 4 : 3;
    const migrated = migratePlannerData({
      version,
      annotations: (parsed.annotations ?? [])
        .map((item) => normalizeAnnotation(item))
        .filter((item): item is PlannerAnnotation => item !== null),
      sectionInstances: normalizeSectionInstances(parsed.sectionInstances),
      activeSectionInstances: normalizeActiveSectionInstances(parsed.activeSectionInstances),
      lastPage: parsed.lastPage ?? 1,
      zoom: parsed.zoom ?? 1,
      tool: parsed.tool ?? "navigate",
      textStyle: normalizeTextStyle(parsed.textStyle),
    } as AnyPlannerData);

    return migrated;
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
  instanceId?: string,
): TextAnnotation {
  const normalized = normalizeTextStyle(style);
  return {
    kind: "text",
    id: crypto.randomUUID(),
    page,
    instanceId: instanceId === DEFAULT_INSTANCE_ID ? undefined : instanceId,
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
  instanceId?: string,
): CheckboxAnnotation {
  return {
    kind: "checkbox",
    id: crypto.randomUUID(),
    page,
    instanceId: instanceId === DEFAULT_INSTANCE_ID ? undefined : instanceId,
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
  instanceId?: string,
): ImageAnnotation {
  return {
    kind: "image",
    id: crypto.randomUUID(),
    page,
    instanceId: instanceId === DEFAULT_INSTANCE_ID ? undefined : instanceId,
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
