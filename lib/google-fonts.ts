export type GoogleFontOption = {
  family: string;
  group: "Handwriting" | "Sans" | "Serif" | "Display";
};

/** Curated Google Fonts that work well in a planner. */
export const GOOGLE_FONT_OPTIONS: GoogleFontOption[] = [
  { family: "Caveat", group: "Handwriting" },
  { family: "Patrick Hand", group: "Handwriting" },
  { family: "Indie Flower", group: "Handwriting" },
  { family: "Shadows Into Light", group: "Handwriting" },
  { family: "Sacramento", group: "Handwriting" },
  { family: "Dancing Script", group: "Handwriting" },
  { family: "Cedarville Cursive", group: "Handwriting" },
  { family: "Homemade Apple", group: "Handwriting" },
  { family: "DM Sans", group: "Sans" },
  { family: "Inter", group: "Sans" },
  { family: "Nunito", group: "Sans" },
  { family: "Lato", group: "Sans" },
  { family: "Open Sans", group: "Sans" },
  { family: "Poppins", group: "Sans" },
  { family: "Work Sans", group: "Sans" },
  { family: "Libre Baskerville", group: "Serif" },
  { family: "Merriweather", group: "Serif" },
  { family: "Lora", group: "Serif" },
  { family: "Playfair Display", group: "Display" },
  { family: "Cormorant Garamond", group: "Serif" },
  { family: "EB Garamond", group: "Serif" },
  { family: "Great Vibes", group: "Display" },
  { family: "Pacifico", group: "Display" },
  { family: "Satisfy", group: "Handwriting" },
];

export const DEFAULT_GOOGLE_FONT = "Caveat";

const LEGACY_FONT_MAP: Record<string, string> = {
  hand: "Caveat",
  script: "Patrick Hand",
  clean: "DM Sans",
  serif: "Libre Baskerville",
};

const loadedFonts = new Set<string>();

function fontLinkId(family: string) {
  return `google-font-${family.replace(/\s+/g, "-").toLowerCase()}`;
}

export function normalizeFontFamily(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    return DEFAULT_GOOGLE_FONT;
  }

  if (LEGACY_FONT_MAP[value]) {
    return LEGACY_FONT_MAP[value];
  }

  const known = GOOGLE_FONT_OPTIONS.find(
    (option) => option.family.toLowerCase() === value.toLowerCase(),
  );
  if (known) return known.family;

  return value;
}

export function fontFamilyCss(family: string) {
  const normalized = normalizeFontFamily(family);
  const option = GOOGLE_FONT_OPTIONS.find((item) => item.family === normalized);
  const fallback =
    option?.group === "Handwriting" || option?.group === "Display"
      ? "cursive"
      : option?.group === "Serif"
        ? "serif"
        : "sans-serif";
  return `"${normalized}", ${fallback}`;
}

export function loadGoogleFont(family: string) {
  if (typeof document === "undefined") return;

  const normalized = normalizeFontFamily(family);
  if (loadedFonts.has(normalized)) return;

  const id = fontLinkId(normalized);
  if (document.getElementById(id)) {
    loadedFonts.add(normalized);
    return;
  }

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(normalized)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
  loadedFonts.add(normalized);
}

export function preloadDefaultFonts() {
  loadGoogleFont(DEFAULT_GOOGLE_FONT);
  loadGoogleFont("Patrick Hand");
  loadGoogleFont("DM Sans");
}

export function filterGoogleFonts(query: string) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return GOOGLE_FONT_OPTIONS;
  return GOOGLE_FONT_OPTIONS.filter((option) =>
    option.family.toLowerCase().includes(trimmed),
  );
}
