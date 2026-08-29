import { DEFAULT_GOOGLE_FONT, normalizeFontFamily } from "@/lib/google-fonts";

export type TextStyle = {
  fontSize: number;
  fontFamily: string;
  color: string;
};

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 11,
  fontFamily: DEFAULT_GOOGLE_FONT,
  color: "#2d2a26",
};

export const TEXT_COLOR_PRESETS = [
  { id: "black", label: "Black", value: "#2d2a26" },
  { id: "slate", label: "Slate", value: "#475569" },
  { id: "blue", label: "Blue", value: "#2563eb" },
  { id: "red", label: "Red", value: "#dc2626" },
  { id: "green", label: "Green", value: "#16a34a" },
  { id: "purple", label: "Purple", value: "#7c3aed" },
] as const;

export function normalizeTextStyle(raw?: Partial<TextStyle>): TextStyle {
  return {
    fontSize: Number(raw?.fontSize ?? DEFAULT_TEXT_STYLE.fontSize),
    fontFamily: normalizeFontFamily(raw?.fontFamily),
    color:
      typeof raw?.color === "string" && raw.color.length > 0
        ? raw.color
        : DEFAULT_TEXT_STYLE.color,
  };
}
