"use client";

import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ColorSpectrumPickerProps = {
  color: string;
  onChange: (color: string) => void;
};

function normalizeHex(color: string) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    const [, r, g, b] = color;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#2d2a26";
}

export function ColorSpectrumPicker({ color, onChange }: ColorSpectrumPickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(normalizeHex(color));
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(normalizeHex(color));
  }, [color]);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-2 px-2"
        title="Open color spectrum"
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className="planner-text-color-swatch size-5 rounded-full border"
          style={{ backgroundColor: normalizeHex(color) }}
        />
        <span className="text-xs">Color</span>
      </Button>

      {open && (
        <div className="planner-color-picker absolute top-full right-0 z-[100] mt-2 rounded-xl border p-3 shadow-lg">
          <HexColorPicker
            color={draft}
            onChange={(next) => {
              setDraft(next);
              onChange(next);
            }}
          />
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(event) => {
                const next = event.target.value;
                setDraft(next);
                if (/^#[0-9a-f]{6}$/i.test(next)) {
                  onChange(next);
                }
              }}
              className="border-input h-8 flex-1 rounded-md border px-2 font-mono text-xs uppercase"
              aria-label="Hex color code"
            />
            <Button type="button" size="sm" className="h-8" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ColorPresetSwatch({
  value,
  label,
  active,
  onSelect,
}: {
  value: string;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "planner-text-color-swatch size-6 rounded-full border-2 transition-transform hover:scale-110",
        active ? "border-foreground ring-2 ring-primary/30" : "border-transparent",
      )}
      style={{ backgroundColor: value }}
      onClick={onSelect}
    />
  );
}
