export type PlannerFontId = "hand" | "script" | "clean" | "serif";

export type TextStyle = {
  fontSize: number;
  fontFamily: PlannerFontId;
  color: string;
};

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 11,
  fontFamily: "hand",
  color: "#2d2a26",
};

export const PLANNER_FONT_OPTIONS: {
  id: PlannerFontId;
  label: string;
  cssVar: string;
}[] = [
  { id: "hand", label: "Hand", cssVar: "var(--font-planner-hand)" },
  { id: "script", label: "Script", cssVar: "var(--font-planner-script)" },
  { id: "clean", label: "Clean", cssVar: "var(--font-planner-clean)" },
  { id: "serif", label: "Serif", cssVar: "var(--font-planner-serif)" },
];

export const TEXT_COLOR_PRESETS = [
  { id: "black", label: "Black", value: "#2d2a26" },
  { id: "slate", label: "Slate", value: "#475569" },
  { id: "blue", label: "Blue", value: "#2563eb" },
  { id: "red", label: "Red", value: "#dc2626" },
  { id: "green", label: "Green", value: "#16a34a" },
  { id: "purple", label: "Purple", value: "#7c3aed" },
] as const;

export function isPlannerFontId(value: unknown): value is PlannerFontId {
  return PLANNER_FONT_OPTIONS.some((option) => option.id === value);
}

export function fontFamilyCss(fontFamily: PlannerFontId | string) {
  const match = PLANNER_FONT_OPTIONS.find((option) => option.id === fontFamily);
  return match?.cssVar ?? PLANNER_FONT_OPTIONS[0].cssVar;
}

export function normalizeTextStyle(raw?: Partial<TextStyle>): TextStyle {
  return {
    fontSize: Number(raw?.fontSize ?? DEFAULT_TEXT_STYLE.fontSize),
    fontFamily: isPlannerFontId(raw?.fontFamily)
      ? raw.fontFamily
      : DEFAULT_TEXT_STYLE.fontFamily,
    color:
      typeof raw?.color === "string" && raw.color.length > 0
        ? raw.color
        : DEFAULT_TEXT_STYLE.color,
  };
}
