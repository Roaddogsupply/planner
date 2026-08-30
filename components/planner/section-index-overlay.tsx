import { INDEX_LIST_LAYOUT, type SectionIndexConfig } from "@/lib/section-indexes";

type SectionIndexOverlayProps = {
  config: SectionIndexConfig;
  onNavigate: (page: number) => void;
};

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
