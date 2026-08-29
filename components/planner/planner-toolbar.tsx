"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  MousePointer2,
  Trash2,
  Download,
  RotateCcw,
} from "lucide-react";

type PlannerToolbarProps = {
  page: number;
  totalPages: number;
  zoom: number;
  editMode: boolean;
  fontSize: number;
  savedLabel: string;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onEditModeChange: (editMode: boolean) => void;
  onFontSizeChange: (fontSize: number) => void;
  onDeleteSelected: () => void;
  onExport: () => void;
  onReset: () => void;
  hasSelection: boolean;
};

export function PlannerToolbar({
  page,
  totalPages,
  zoom,
  editMode,
  fontSize,
  savedLabel,
  onPageChange,
  onZoomChange,
  onEditModeChange,
  onFontSizeChange,
  onDeleteSelected,
  onExport,
  onReset,
  hasSelection,
}: PlannerToolbarProps) {
  return (
    <header className="planner-toolbar sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-sm font-semibold tracking-tight sm:text-base">
            Interactive Planner
          </h1>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {savedLabel}
          </Badge>
        </div>

        <Separator orientation="vertical" className="hidden h-6 sm:block" />

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            title="Previous page"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft />
          </Button>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isNaN(next)) {
                  onPageChange(Math.min(totalPages, Math.max(1, next)));
                }
              }}
              className="h-8 w-16 text-center"
            />
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              of {totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon-sm"
            title="Next page"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight />
          </Button>
        </div>

        <Separator orientation="vertical" className="hidden h-6 md:block" />

        <div className="flex min-w-[140px] flex-1 items-center gap-2">
          <span className="text-muted-foreground text-xs">Zoom</span>
          <Slider
            value={zoom}
            min={0.5}
            max={2}
            step={0.05}
            onValueChange={(value) =>
              onZoomChange(Array.isArray(value) ? value[0] : value)
            }
            className="max-w-36"
          />
          <span className="text-muted-foreground w-10 text-xs">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <Separator orientation="vertical" className="hidden h-6 lg:block" />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            title="Click anywhere on the page to type"
            onClick={() => onEditModeChange(true)}
          >
            <Pencil />
            Write
          </Button>

          <Button
            variant={!editMode ? "default" : "outline"}
            size="sm"
            title="Use tabs and index links like the PDF"
            onClick={() => onEditModeChange(false)}
          >
            <MousePointer2 />
            Navigate
          </Button>

          {editMode && (
            <>
              <Input
                type="number"
                min={10}
                max={28}
                value={fontSize}
                onChange={(event) => onFontSizeChange(Number(event.target.value) || 14)}
                className="h-8 w-16"
                aria-label="Font size"
              />

              <Button
                variant="outline"
                size="icon-sm"
                title="Delete selected text box"
                onClick={onDeleteSelected}
                disabled={!hasSelection}
              >
                <Trash2 />
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="icon-sm"
            title="Download your saved notes as JSON"
            onClick={onExport}
          >
            <Download />
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            title="Clear all saved notes"
            onClick={onReset}
          >
            <RotateCcw />
          </Button>
        </div>
      </div>
    </header>
  );
}
