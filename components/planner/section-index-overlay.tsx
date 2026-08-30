import { Plus } from "lucide-react";
import {
  INDEX_LIST_LAYOUT,
  resolveAddButtonPlacement,
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

function barBorderColor(hex: string) {
  return `color-mix(in oklab, ${hex} 62%, oklch(0.28 0.02 270))`;
}

function badgeColor(hex: string) {
  return `color-mix(in oklab, ${hex} 55%, oklch(0.22 0.02 270))`;
}

function AddCopyButton({
  section,
  index,
  config,
  extraCount,
  onAddCopy,
}: {
  section: SectionIndexEntry;
  index: number;
  config: SectionIndexConfig;
  extraCount: number;
  onAddCopy: (section: SectionIndexEntry) => void;
}) {
  const placement = resolveAddButtonPlacement(config, section, index);
  const dense = Boolean(config.addButton);

  return (
    <button
      type="button"
      className={`section-index-add-btn absolute flex items-center justify-center${dense ? " section-index-add-btn-dense" : ""}`}
      style={{
        left: `${placement.left}%`,
        top: `${placement.top}%`,
        width: `${placement.width}%`,
        height: `${placement.height}%`,
        backgroundColor: placement.barColor,
        borderColor: barBorderColor(placement.barColor),
        color: "var(--planner-index-bar-text)",
      }}
      title={`Add another ${section.label} page`}
      aria-label={`Add another ${section.label} page`}
      onMouseEnter={(event) => {
        event.currentTarget.style.backgroundColor = barHoverColor(placement.barColor);
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.backgroundColor = placement.barColor;
      }}
      onClick={(event) => {
        event.stopPropagation();
        onAddCopy(section);
      }}
    >
      <Plus className={dense ? "size-3" : "size-3.5"} strokeWidth={2.5} />
      {extraCount > 0 && (
        <span
          className="section-index-add-count"
          style={{
            backgroundColor: badgeColor(placement.barColor),
            color: "var(--planner-index-bar-text)",
          }}
        >
          {extraCount + 1}
        </span>
      )}
    </button>
  );
}

export function SectionIndexOverlay({
  config,
  instanceCounts,
  onNavigate,
  onAddCopy,
}: SectionIndexOverlayProps) {
  const { mask, rowTops, x, width, rowHeight } = INDEX_LIST_LAYOUT;

  if (config.variant === "addons") {
    return (
      <div
        className="section-index-addons absolute inset-0 z-[15]"
        onClick={(event) => event.stopPropagation()}
      >
        {config.sections.map((section, index) => (
          <AddCopyButton
            key={section.page}
            section={section}
            index={index}
            config={config}
            extraCount={instanceCounts[section.page] ?? 0}
            onAddCopy={onAddCopy}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="section-index-overlay absolute z-[15]"
      style={{
        left: `${mask.x}%`,
        top: `${mask.y}%`,
        width: `${mask.width}%`,
        height: `${mask.height}%`,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {config.sections.map((section, index) => {
        const top = rowTops[index];
        if (top === undefined) return null;

        const placement = resolveAddButtonPlacement(config, section, index);
        const extraCount = instanceCounts[section.page] ?? 0;

        return (
          <div
            key={section.page}
            className="absolute"
            style={{
              left: `${((x - mask.x) / mask.width) * 100}%`,
              top: `${((top - mask.y) / mask.height) * 100}%`,
              width: `${(width / mask.width) * 100}%`,
              height: `${(rowHeight / mask.height) * 100}%`,
            }}
          >
            <button
              type="button"
              className="section-index-bar absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: placement.barColor }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = barHoverColor(placement.barColor);
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = placement.barColor;
              }}
              onClick={() => onNavigate(section.page)}
            >
              {section.label}
            </button>
            <button
              type="button"
              className="section-index-add-btn section-index-add-btn-inline absolute flex items-center justify-center"
              style={{
                right: 0,
                top: "50%",
                width: "14%",
                height: "78%",
                transform: "translateY(-50%)",
                backgroundColor: placement.barColor,
                borderColor: barBorderColor(placement.barColor),
                color: "var(--planner-index-bar-text)",
              }}
              title={`Add another ${section.label} page`}
              aria-label={`Add another ${section.label} page`}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = barHoverColor(placement.barColor);
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = placement.barColor;
              }}
              onClick={(event) => {
                event.stopPropagation();
                onAddCopy(section);
              }}
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
              {extraCount > 0 && (
                <span
                  className="section-index-add-count"
                  style={{
                    backgroundColor: badgeColor(placement.barColor),
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
