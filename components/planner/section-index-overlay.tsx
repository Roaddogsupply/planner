import { INDEX_BAR_COLORS, INDEX_LIST_LAYOUT, type SectionIndexConfig } from "@/lib/section-indexes";

type SectionIndexOverlayProps = {
  config: SectionIndexConfig;
  onNavigate: (page: number) => void;
};

function barHoverColor(hex: string) {
  return `color-mix(in oklab, ${hex} 88%, oklch(0.2 0 0))`;
}

export function SectionIndexOverlay({ config, onNavigate }: SectionIndexOverlayProps) {
  const { mask, rowTops, x, width, rowHeight } = INDEX_LIST_LAYOUT;

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

        const barColor = INDEX_BAR_COLORS[index] ?? INDEX_BAR_COLORS[0];

        return (
          <button
            key={section.page}
            type="button"
            className="section-index-bar absolute flex items-center justify-center"
            style={{
              left: `${((x - mask.x) / mask.width) * 100}%`,
              top: `${((top - mask.y) / mask.height) * 100}%`,
              width: `${(width / mask.width) * 100}%`,
              height: `${(rowHeight / mask.height) * 100}%`,
              backgroundColor: barColor,
            }}
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
        );
      })}
    </div>
  );
}
