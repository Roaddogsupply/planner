"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  PLANNER_FONT_OPTIONS,
  TEXT_COLOR_PRESETS,
  type TextStyle,
} from "@/lib/text-styles";

type TextStyleControlsProps = {
  style: TextStyle;
  onChange: (patch: Partial<TextStyle>) => void;
  editingSelected?: boolean;
};

export function TextStyleControls({
  style,
  onChange,
  editingSelected = false,
}: TextStyleControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground hidden text-xs sm:inline">
        {editingSelected ? "Selected text" : "New text"}
      </span>

      <select
        value={style.fontFamily}
        onChange={(event) =>
          onChange({ fontFamily: event.target.value as TextStyle["fontFamily"] })
        }
        className="border-input bg-background h-8 rounded-md border px-2 text-xs"
        aria-label="Font"
      >
        {PLANNER_FONT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <span className="text-muted-foreground text-xs">Size</span>
        <Input
          type="number"
          min={8}
          max={28}
          value={style.fontSize}
          onChange={(event) => onChange({ fontSize: Number(event.target.value) || 11 })}
          className="h-8 w-14 text-center"
          aria-label="Font size"
        />
      </div>

      <div className="flex items-center gap-1">
        {TEXT_COLOR_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            title={preset.label}
            aria-label={preset.label}
            className={cn(
              "planner-text-color-swatch size-6 rounded-full border-2 transition-transform hover:scale-110",
              style.color.toLowerCase() === preset.value.toLowerCase()
                ? "border-foreground ring-2 ring-primary/30"
                : "border-transparent",
            )}
            style={{ backgroundColor: preset.value }}
            onClick={() => onChange({ color: preset.value })}
          />
        ))}

        <label
          title="Pick a custom color"
          className="border-input relative size-6 cursor-pointer overflow-hidden rounded-full border"
        >
          <span className="sr-only">Custom color</span>
          <input
            type="color"
            value={style.color}
            onChange={(event) => onChange({ color: event.target.value })}
            className="absolute inset-0 size-full cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
      </div>
    </div>
  );
}
