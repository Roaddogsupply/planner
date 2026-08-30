import { Plus } from "lucide-react";
import {
  INDEX_LIST_LAYOUT,
  resolveSectionLayout,
  sectionBarColor,
  type GridIndexCell,
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

function IndexRowBar({
  label,
  barColor,
  compact,
  extraCount,
  onOpen,
  onAddCopy,
}: {
  label: string;
  barColor: string;
  compact?: boolean;
  extraCount: number;
  onOpen: () => void;
  onAddCopy: () => void;
}) {
  return (
    <div className="section-index-row flex h-full min-h-0 w-full overflow-hidden">
      <button
        type="button"
        className={`section-index-bar min-w-0 flex-1${compact ? " section-index-row-compact" : ""}`}
        style={{ backgroundColor: barColor }}
        onMouseEnter={(event) => {
          event.currentTarget.style.backgroundColor = barHoverColor(barColor);
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.backgroundColor = barColor;
        }}
        onClick={onOpen}
      >
        {label}
      </button>
      <button
        type="button"
        className="section-index-add-btn section-index-add-btn-inline flex shrink-0 items-center justify-center"
        style={{
          width: `${INDEX_LIST_LAYOUT.addColumnWidth}%`,
          backgroundColor: barColor,
          borderLeftColor: dividerColor(barColor),
          color: "var(--planner-index-bar-text)",
        }}
        title={`Add another ${label} page`}
        aria-label={`Add another ${label} page`}
        onMouseEnter={(event) => {
          event.currentTarget.style.backgroundColor = barHoverColor(barColor);
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.backgroundColor = barColor;
        }}
        onClick={(event) => {
          event.stopPropagation();
          onAddCopy();
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
}

function GridCell({
  cell,
  index,
  extraCount,
  onNavigate,
  onAddCopy,
}: {
  cell: GridIndexCell;
  index: number;
  extraCount: number;
  onNavigate: (page: number) => void;
  onAddCopy: (section: SectionIndexEntry) => void;
}) {
  const barColor = sectionBarColor(index);
  const section: SectionIndexEntry = {
    label: cell.label,
    page: cell.page,
    rowTop: cell.y,
    rowHeight: cell.height,
  };

  return (
    <div
      className="paper-grid-cell absolute flex flex-col overflow-hidden"
      style={{
        left: `${cell.x}%`,
        top: `${cell.y}%`,
        width: `${cell.width}%`,
        height: `${cell.height}%`,
      }}
    >
      <button
        type="button"
        className="paper-grid-preview flex-1"
        aria-label={`Open ${cell.label}`}
        onClick={() => onNavigate(cell.page)}
      />
      <div className="paper-grid-bar shrink-0" style={{ height: "28%" }}>
        <IndexRowBar
          label={cell.label}
          barColor={barColor}
          extraCount={extraCount}
          onOpen={() => onNavigate(cell.page)}
          onAddCopy={() => onAddCopy(section)}
        />
      </div>
    </div>
  );
}

export function SectionIndexOverlay({
  config,
  instanceCounts,
  onNavigate,
  onAddCopy,
}: SectionIndexOverlayProps) {
  const { bar, mask } = resolveSectionLayout(config);

  if (config.layout === "grid" && config.gridCells) {
    return (
      <div
        className="section-index-overlay absolute inset-0 z-[15]"
        style={{ pointerEvents: "none" }}
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
        {config.gridCells.map((cell, index) => (
          <GridCell
            key={cell.page}
            cell={cell}
            index={index}
            extraCount={instanceCounts[cell.page] ?? 0}
            onNavigate={onNavigate}
            onAddCopy={onAddCopy}
          />
        ))}
      </div>
    );
  }

  const sections = config.sections ?? [];

  return (
    <div
      className="section-index-overlay absolute inset-0 z-[15]"
      style={{ pointerEvents: "none" }}
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

      {sections.map((section, index) => {
        const barColor = sectionBarColor(index);
        const extraCount = instanceCounts[section.page] ?? 0;
        const compact = section.rowHeight < 4.5;

        return (
          <div
            key={section.page}
            className="absolute"
            style={{
              left: `${bar.x}%`,
              top: `${section.rowTop}%`,
              width: `${bar.width}%`,
              height: `${section.rowHeight}%`,
            }}
          >
            <IndexRowBar
              label={section.label}
              barColor={barColor}
              compact={compact}
              extraCount={extraCount}
              onOpen={() => onNavigate(section.page)}
              onAddCopy={() => onAddCopy(section)}
            />
          </div>
        );
      })}
    </div>
  );
}
