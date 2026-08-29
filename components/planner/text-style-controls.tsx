"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  ColorPresetSwatch,
  ColorSpectrumPicker,
} from "@/components/planner/color-spectrum-picker";
import {
  GOOGLE_FONT_OPTIONS,
  filterGoogleFonts,
  loadGoogleFont,
} from "@/lib/google-fonts";
import { TEXT_COLOR_PRESETS, type TextStyle } from "@/lib/text-styles";

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
  const [fontQuery, setFontQuery] = useState("");

  useEffect(() => {
    loadGoogleFont(style.fontFamily);
  }, [style.fontFamily]);

  const filteredFonts = useMemo(() => filterGoogleFonts(fontQuery), [fontQuery]);

  const groupedFonts = useMemo(() => {
    const groups = new Map<string, typeof GOOGLE_FONT_OPTIONS>();
    for (const option of filteredFonts) {
      const list = groups.get(option.group) ?? [];
      list.push(option);
      groups.set(option.group, list);
    }
    return groups;
  }, [filteredFonts]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground hidden text-xs sm:inline">
        {editingSelected ? "Selected text" : "New text"}
      </span>

      <div className="flex flex-col gap-1">
        <Input
          type="search"
          placeholder="Search Google Fonts…"
          value={fontQuery}
          onChange={(event) => setFontQuery(event.target.value)}
          className="h-8 w-40 text-xs"
          aria-label="Search fonts"
        />
        <select
          value={style.fontFamily}
          onChange={(event) => onChange({ fontFamily: event.target.value })}
          className="border-input bg-background h-8 max-w-44 rounded-md border px-2 text-xs"
          aria-label="Font"
          style={{ fontFamily: `"${style.fontFamily}", sans-serif` }}
        >
          {[...groupedFonts.entries()].map(([group, options]) => (
            <optgroup key={group} label={group}>
              {options.map((option) => (
                <option key={option.family} value={option.family}>
                  {option.family}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

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
          <ColorPresetSwatch
            key={preset.id}
            value={preset.value}
            label={preset.label}
            active={style.color.toLowerCase() === preset.value.toLowerCase()}
            onSelect={() => onChange({ color: preset.value })}
          />
        ))}
        <ColorSpectrumPicker color={style.color} onChange={(color) => onChange({ color })} />
      </div>
    </div>
  );
}
