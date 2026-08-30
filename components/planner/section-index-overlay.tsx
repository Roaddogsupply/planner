import type { SectionIndexConfig } from "@/lib/section-indexes";

type SectionIndexOverlayProps = {
  config: SectionIndexConfig;
  onNavigate: (page: number) => void;
};

export function SectionIndexOverlay({ config, onNavigate }: SectionIndexOverlayProps) {
  const { overlay, sections } = config;

  return (
    <div
      className="section-index-overlay absolute z-[15]"
      style={{
        left: `${overlay.x}%`,
        top: `${overlay.y}%`,
        width: `${overlay.width}%`,
        height: `${overlay.height}%`,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex h-full flex-col justify-start gap-[2.5%] py-[1%]">
        {sections.map((section) => (
          <button
            key={section.page}
            type="button"
            className="section-index-item flex-1 text-left"
            onClick={() => onNavigate(section.page)}
          >
            {section.label}
          </button>
        ))}
      </div>
    </div>
  );
}
