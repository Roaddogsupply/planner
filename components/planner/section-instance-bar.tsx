"use client";

import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllCopiesForPage } from "@/lib/section-instances";
import type { SectionInstance } from "@/lib/section-instances";

type SectionInstanceBarProps = {
  label: string;
  basePage: number;
  instances: SectionInstance[];
  activeInstanceId: string;
  onSelectInstance: (instanceId: string) => void;
  onAddCopy: () => void;
  onDeleteCopy: (instanceId: string) => void;
};

export function SectionInstanceBar({
  label,
  basePage,
  instances,
  activeInstanceId,
  onSelectInstance,
  onAddCopy,
  onDeleteCopy,
}: SectionInstanceBarProps) {
  const copies = getAllCopiesForPage(instances, basePage);
  const activeIndex = copies.findIndex((copy) => copy.id === activeInstanceId);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeCopy = copies[safeIndex] ?? copies[0];
  const total = copies.length;

  const goPrev = () => {
    const next = copies[Math.max(0, safeIndex - 1)];
    if (next) onSelectInstance(next.id);
  };

  const goNext = () => {
    const next = copies[Math.min(total - 1, safeIndex + 1)];
    if (next) onSelectInstance(next.id);
  };

  const canDelete = total > 1 && activeCopy && !activeCopy.isDefault;

  return (
    <div className="section-instance-bar mb-3 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm">
      <span className="text-primary font-medium">{label}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">
        {activeCopy?.label ?? "Copy 1"} ({safeIndex + 1} of {total})
      </span>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          disabled={safeIndex <= 0}
          onClick={goPrev}
          aria-label="Previous copy"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          disabled={safeIndex >= total - 1}
          onClick={goNext}
          aria-label="Next copy"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={onAddCopy}
        >
          <Plus className="size-3.5" />
          Add copy
        </Button>
        {canDelete && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onDeleteCopy(activeCopy.id)}
            aria-label="Delete this copy"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
