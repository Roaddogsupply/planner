"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { PlannerTool } from "@/lib/annotations";
import { CalendarSettings } from "@/components/planner/calendar-settings";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  CheckSquare,
  ImageIcon,
  Trash2,
  Download,
  Link2,
  RotateCcw,
} from "lucide-react";

type PlannerToolbarProps = {
  page: number;
  totalPages: number;
  zoom: number;
  tool: PlannerTool;
  fontSize: number;
  savedLabel: string;
  restoreLink: string;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onToolChange: (tool: PlannerTool) => void;
  onFontSizeChange: (fontSize: number) => void;
  onDeleteSelected: () => void;
  onExport: () => void;
  onReset: () => void;
  hasSelection: boolean;
  calendarFeedUrl: string | null;
  calendarEventCount: number;
  calendarSyncing: boolean;
  calendarLastSynced: string | null;
  onCalendarSave: (url: string) => Promise<void>;
  onCalendarDisconnect: () => void;
  onCalendarRefresh: () => Promise<void>;
  isCustomPage: boolean;
  pendingImage: boolean;
  onPickImage: () => void;
  selectedImageWidth: number | null;
  onImageWidthChange: (width: number) => void;
};

export function PlannerToolbar({
  page,
  totalPages,
  zoom,
  tool,
  fontSize,
  savedLabel,
  restoreLink,
  onPageChange,
  onZoomChange,
  onToolChange,
  onFontSizeChange,
  onDeleteSelected,
  onExport,
  onReset,
  hasSelection,
  calendarFeedUrl,
  calendarEventCount,
  calendarSyncing,
  calendarLastSynced,
  onCalendarSave,
  onCalendarDisconnect,
  onCalendarRefresh,
  isCustomPage,
  pendingImage,
  onPickImage,
  selectedImageWidth,
  onImageWidthChange,
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
            variant={tool === "text" ? "default" : "outline"}
            size="sm"
            title="Click lines and boxes to type"
            onClick={() => onToolChange("text")}
          >
            <Pencil />
            Type
          </Button>

          <Button
            variant={tool === "checkbox" ? "default" : "outline"}
            size="sm"
            title="Click to check or uncheck boxes"
            onClick={() => onToolChange("checkbox")}
          >
            <CheckSquare />
            Check
          </Button>

          <Button
            variant={tool === "image" ? "default" : "outline"}
            size="sm"
            title={pendingImage ? "Click the page to place your image" : "Add an image"}
            onClick={() => {
              onToolChange("image");
              if (!pendingImage) onPickImage();
            }}
          >
            <ImageIcon />
            Image
          </Button>

          {pendingImage && (
            <Badge variant="secondary" className="text-xs">
              Click page to place
            </Badge>
          )}

          {isCustomPage && (
            <Badge variant="outline" className="hidden text-xs sm:inline-flex">
              Custom page
            </Badge>
          )}

          <CalendarSettings
            feedUrl={calendarFeedUrl}
            eventCount={calendarEventCount}
            syncing={calendarSyncing}
            lastSynced={calendarLastSynced}
            onSave={onCalendarSave}
            onDisconnect={onCalendarDisconnect}
            onRefresh={onCalendarRefresh}
          />

          {tool === "text" && (
            <Input
              type="number"
              min={10}
              max={28}
              value={fontSize}
              onChange={(event) => onFontSizeChange(Number(event.target.value) || 14)}
              className="h-8 w-16"
              aria-label="Font size"
            />
          )}

          {selectedImageWidth !== null && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-xs">Size</span>
              <Input
                type="number"
                min={8}
                max={80}
                value={Math.round(selectedImageWidth)}
                onChange={(event) => onImageWidthChange(Number(event.target.value) || 28)}
                className="h-8 w-16"
                aria-label="Image width"
              />
            </div>
          )}

          <Button
            variant="outline"
            size="icon-sm"
            title="Delete selected item"
            onClick={onDeleteSelected}
            disabled={!hasSelection}
          >
            <Trash2 />
          </Button>

          <Button
            variant="outline"
            size="sm"
            title="Copy your personal planner link (bookmark this to get your notes back)"
            onClick={async () => {
              if (!restoreLink) return;
              try {
                await navigator.clipboard.writeText(restoreLink);
                window.alert("Link copied! Save it in your bookmarks so your notes always come back.");
              } catch {
                window.prompt("Copy this link and bookmark it:", restoreLink);
              }
            }}
          >
            <Link2 />
            <span className="hidden sm:inline">My link</span>
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            title="Optional: download a backup file"
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
