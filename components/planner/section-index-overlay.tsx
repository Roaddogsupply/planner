import { Plus } from "lucide-react";
import {
  INDEX_LIST_LAYOUT,
  resolveSectionLayout,
  sectionBarColor,
  type SectionIndexConfig,
  type SectionIndexEntry,
} from "@/lib/section-indexes";

type SectionIndexOverlayProps = {
  config: SectionIndexConfig;
  instanceCounts: Record<number, number>;
  onNavigate: (page: number, instanceId?: string) => void;
  onAddCopy: (section: SectionIndexEntry) => void;
};

function barHoverColor(hex: string) {
  return `color-mix(in oklab, ${hex} 88%, oklch(0.2 0 0))`;
}

function dividerColor(hex: string) {
  return `color-mix(in oklab, ${hex} 55%, oklch(0.28 0.02 270))`;
}

function badgeColor(hex: string) {
  return `color-mix(in oklab, ${hex} 55%, oklch(0.22 0.02 270))`;
}

export function SectionIndexOverlay({
  config,
  instanceCounts,
  onNavigate,
  onAddCopy,
}: SectionIndexOverlayProps) {
  const { bar, mask } = resolveSectionLayout(config);
  const addWidth = INDEX_LIST_LAYOUT.addColumnWidth;

  return (
    <div
      className="section-index-overlay absolute inset-0 z-[15]"
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className="section-index-mask absolute"
        style={{
          left: `${mask.x}%`,
          top: `${mask.y}%`,
          width: `${mask.width}%`,
          height: `${mask.height}%`,
        }}
      />

      {config.sections.map((section, index) => {
        const barColor = sectionBarColor(index);
        const extraCount = instanceCounts[section.page] ?? 0;
        const compact = section.rowHeight < 4;

        return (
          <div
            key={section.page}
            className={`section-index-row absolute flex overflow-hidden${compact ? " section-index-row-compact" : ""}`}
            style={{
              left: `${bar.x}%`,
              top: `${section.rowTop}%`,
              width: `${bar.width}%`,
              height: `${section.rowHeight}%`,
            }}
          >
            <button
              type="button"
              className="section-index-bar min-w-0 flex-1"
              style={{ backgroundColor: barColor }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = barHoverColor(barColor);
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = barColor;
              }}
              onClick={() => onNavigate(section.page)}
            >
              {section.label}
            </button>
            <button
              type="button"
              className="section-index-add-btn section-index-add-btn-inline flex shrink-0 items-center justify-center"
              style={{
                width: `${addWidth}%`,
                backgroundColor: barColor,
                borderLeftColor: dividerColor(barColor),
                color: "var(--planner-index-bar-text)",
              }}
              title={`Add another ${section.label} page`}
              aria-label={`Add another ${section.label} page`}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = barHoverColor(barColor);
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = barColor;
              }}
              onClick={(event) => {
                event.stopPropagation();
                onAddCopy(section);
              }}
            >
              <Plus className={compact ? "size-2.5" : "size-3.5"} strokeWidth={2.5} />
              {extraCount > 0 && (
                <span
                  className={`section-index-add-count${compact ? " section-index-add-count-dense" : ""}`}
                  style={{
                    backgroundColor: badgeColor(barColor),
                    color: "var(--planner-index-bar-text)",
                  }}
                >
                  {extraCount + 1}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
