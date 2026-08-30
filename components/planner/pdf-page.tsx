"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { CheckboxAnnotation, ImageAnnotation, PlannerAnnotation, PlannerTool, TextAnnotation } from "@/lib/annotations";
import {
  createCheckboxAnnotation,
  createImageAnnotation,
  createTextAnnotation,
  isCheckboxAnnotation,
  isImageAnnotation,
  isTextAnnotation,
} from "@/lib/annotations";
import { fontFamilyCss, loadGoogleFont } from "@/lib/google-fonts";
import type { TextStyle } from "@/lib/text-styles";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { parseCalendarDayFromUri, prepareCalendarCells } from "@/lib/calendar-cells";
import type { CalendarDayCell, CalendarEvent } from "@/lib/calendar-types";
import { imageHeightForWidth, imageWidthForHeight } from "@/lib/image-utils";
import { CalendarOverlay } from "@/components/planner/calendar-overlay";
import {
  isCompactCalendarPage,
  isCalendarSidebarTab,
  getCalendarSidebarTabIndex,
  isCalendarIndexReady,
  calendarDateContext,
  needsCalendarSidebarOverride,
  parseDateFromCalendarUri,
  resolveCalendarDayPage,
  resolveCalendarSidebarNavigation,
  resolveWeekRowY,
  type CalendarPageIndex,
} from "@/lib/calendar-pages";
import { SectionIndexOverlay } from "@/components/planner/section-index-overlay";
import { getSectionIndex, isSectionIndexOverlayLink, type SectionIndexEntry } from "@/lib/section-indexes";
import { DEFAULT_INSTANCE_ID } from "@/lib/section-instances";

type PdfPageProps = {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  tool: PlannerTool;
  annotations: PlannerAnnotation[];
  selectedId: string | null;
  textStyle: TextStyle;
  activeInstanceId: string;
  sectionInstanceCounts: Record<number, number>;
  onPageNavigate: (page: number, instanceId?: string, calendarDate?: string) => void;
  onAddSectionCopy: (section: SectionIndexEntry) => void;
  onAddAnnotation: (annotation: PlannerAnnotation) => void;
  onUpdateAnnotation: (id: string, patch: Record<string, unknown>) => void;
  onSelectAnnotation: (id: string | null) => void;
  onToggleCheckbox: (id: string) => void;
  calendarEvents: CalendarEvent[];
  calendarPageIndex: CalendarPageIndex;
  activeCalendarDate: string | null;
  pendingImage: { src: string; width: number; height: number; aspectRatio: number } | null;
  onPendingImagePlaced: () => void;
};

type LinkOverlay = {
  x: number;
  y: number;
  width: number;
  height: number;
  page?: number;
  uri?: string;
};

function toPercent(value: number, total: number) {
  return (value / total) * 100;
}

function getAnnotationLinkUrl(annotation: { url?: string; unsafeUrl?: string }) {
  return annotation.url || annotation.unsafeUrl || null;
}

function expandLink(link: LinkOverlay, padding = 0.4): LinkOverlay {
  return {
    ...link,
    x: Math.max(0, link.x - padding),
    y: Math.max(0, link.y - padding),
    width: link.width + padding * 2,
    height: link.height + padding * 2,
  };
}

function hitTestLink(x: number, y: number, links: LinkOverlay[]) {
  for (const link of links) {
    if (
      x >= link.x &&
      x <= link.x + link.width &&
      y >= link.y &&
      y <= link.y + link.height
    ) {
      return link;
    }
  }
  return null;
}

function hitTestImage(x: number, y: number, items: ImageAnnotation[]) {
  for (const item of [...items].reverse()) {
    if (
      x >= item.x &&
      x <= item.x + item.width &&
      y >= item.y &&
      y <= item.y + item.height
    ) {
      return item;
    }
  }
  return null;
}

function hitTestCheckbox(x: number, y: number, items: CheckboxAnnotation[]) {
  for (const item of items) {
    const half = item.size / 2;
    if (x >= item.x - half && x <= item.x + half && y >= item.y - half && y <= item.y + half) {
      return item;
    }
  }
  return null;
}

export function PdfPage({
  pdf,
  pageNumber,
  scale,
  tool,
  annotations,
  selectedId,
  textStyle,
  onPageNavigate,
  onAddSectionCopy,
  onAddAnnotation,
  onUpdateAnnotation,
  onSelectAnnotation,
  onToggleCheckbox,
  calendarEvents,
  calendarPageIndex,
  activeCalendarDate,
  pendingImage,
  onPendingImagePlaced,
  activeInstanceId,
  sectionInstanceCounts,
}: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const weekFocusRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageSize, setPageSize] = useState({ width: 816, height: 595 });
  const [links, setLinks] = useState<LinkOverlay[]>([]);
  const [calendarCells, setCalendarCells] = useState<CalendarDayCell[]>([]);
  const [calendarLayout, setCalendarLayout] = useState<"default" | "overview" | "daily" | "week">(
    "default",
  );
  const [loading, setLoading] = useState(true);
  const dragState = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const resizeState = useRef<{
    id: string;
    anchorX: number;
    anchorY: number;
    aspectRatio: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;

    async function drawPage() {
      setLoading(true);
      setCalendarLayout("default");

      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setPageSize({ width: viewport.width, height: viewport.height });

        renderTask = page.render({ canvas, canvasContext: context, viewport });
        await renderTask.promise;
        if (cancelled) return;

        const pageLinks: LinkOverlay[] = [];
        const dayCells: CalendarDayCell[] = [];
        let fromDateLinkCount = 0;
        const compactCalendarPage = isCompactCalendarPage(pageNumber);

        const pageText = (await page.getTextContent()).items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
        const isDailySpread =
          pageText.includes("Breakfast") && pageText.includes("Snacks");

        for (const annotation of await page.getAnnotations()) {
          if (annotation.subtype !== "Link") continue;

          const rect = annotation.rect as [number, number, number, number];
          const [vx1, vy1] = viewport.convertToViewportPoint(rect[0], rect[1]);
          const [vx2, vy2] = viewport.convertToViewportPoint(rect[2], rect[3]);
          const left = Math.min(vx1, vx2);
          const top = Math.min(vy1, vy2);
          const width = Math.abs(vx2 - vx1);
          const height = Math.abs(vy2 - vy1);

          const base: LinkOverlay = {
            x: toPercent(left, viewport.width),
            y: toPercent(top, viewport.height),
            width: toPercent(width, viewport.width),
            height: toPercent(height, viewport.height),
          };

          const linkUrl = getAnnotationLinkUrl(annotation);

          if (linkUrl) {
            const calendarDay = parseCalendarDayFromUri(linkUrl, base, true);
            if (calendarDay) {
              dayCells.push(calendarDay);
              fromDateLinkCount++;
            }
            pageLinks.push(expandLink({ ...base, uri: linkUrl }));
          } else if (annotation.dest) {
            const dest =
              typeof annotation.dest === "string"
                ? await pdf.getDestination(annotation.dest)
                : annotation.dest;
            if (dest) {
              const ref = dest[0];
              if (ref) {
                const targetPage = (await pdf.getPageIndex(ref)) + 1;
                pageLinks.push(expandLink({ ...base, page: targetPage }));
              }
            }
          }
        }

        if (!cancelled) {
          const filteredLinks = pageLinks.filter(
            (link) => !isSectionIndexOverlayLink(pageNumber, link),
          );

          const dailyMiniCalCells = dayCells.filter(
            (cell) => cell.x >= 25 && cell.x <= 50 && cell.y >= 18 && cell.y <= 32,
          );
          const isDailyMiniCal =
            isDailySpread &&
            fromDateLinkCount >= 35 &&
            fromDateLinkCount <= 55 &&
            dailyMiniCalCells.length >= 38;
          const isWeekSpread =
            !isDailySpread &&
            fromDateLinkCount >= 35 &&
            fromDateLinkCount <= 55 &&
            (calendarPageIndex.weekPlannerPages.includes(pageNumber) ||
              dayCells.some((cell) => cell.y >= 22 && cell.y <= 36));
          const compactCalendar = compactCalendarPage || isDailyMiniCal || isWeekSpread;
          const compactVariant = isDailyMiniCal ? "daily" : isWeekSpread ? "week" : "overview";

          setLinks(filteredLinks);
          setCalendarCells(
            prepareCalendarCells(dayCells, compactCalendar, pageNumber, compactVariant),
          );
          setCalendarLayout(
            compactCalendar
              ? compactVariant
              : "default",
          );
        }
      } catch (renderError) {
        if (!cancelled) {
          console.error(renderError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void drawPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, scale, calendarPageIndex.dailyPlannerPages, calendarPageIndex.weekPlannerPages]);

  const compactCalendar = calendarLayout !== "default";
  const isDailyMiniCal = calendarLayout === "daily";
  const weekFocusY =
    calendarLayout === "week" && activeCalendarDate
      ? resolveWeekRowY(activeCalendarDate, calendarPageIndex)
      : null;

  useEffect(() => {
    if (weekFocusY == null) return;
    weekFocusRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [pageNumber, weekFocusY, calendarLayout]);

  const getPointerPercent = (event: ReactMouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  };

  const handleLinkClick = (link: LinkOverlay) => {
    if (link.page) {
      if (
        needsCalendarSidebarOverride(pageNumber, calendarPageIndex) &&
        isCalendarSidebarTab(link)
      ) {
        const tabIndex = getCalendarSidebarTabIndex(link);

        if (isCalendarIndexReady(calendarPageIndex)) {
          const dateContext = calendarDateContext(
            pageNumber,
            activeCalendarDate,
            calendarPageIndex,
          );
          const overridePage = resolveCalendarSidebarNavigation(
            tabIndex,
            pageNumber,
            dateContext,
            calendarPageIndex,
          );
          if (overridePage) {
            onPageNavigate(overridePage, undefined, dateContext ?? undefined);
            return;
          }
        }

        // Never follow the PDF's broken YEAR-tab links (they jump to random daily pages).
        if (tabIndex === 0) {
          if (!isCalendarIndexReady(calendarPageIndex)) {
            window.alert(
              "The calendar is still loading. Wait a few seconds and try again.",
            );
          }
          return;
        }
      }

      onPageNavigate(link.page);
      return;
    }

    if (link.uri) {
      if (link.uri.startsWith("shortcuts://")) {
        const date = parseDateFromCalendarUri(link.uri);
        if (date) {
          const targetPage = resolveCalendarDayPage(date, calendarPageIndex.datePageMap);
          if (targetPage) {
            onPageNavigate(targetPage, undefined, date);
            return;
          }

          if (!isCalendarIndexReady(calendarPageIndex)) {
            window.alert(
              "The calendar is still loading. Wait a few seconds and try again.",
            );
            return;
          }

          window.alert(
            "Could not find that day in the planner. Try using the month tabs to navigate.",
          );
          return;
        }
      }
      window.open(link.uri, "_blank", "noopener,noreferrer");
    }
  };

  const handlePageClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const point = getPointerPercent(event);
    const link = hitTestLink(point.x, point.y, links);
    if (link) {
      handleLinkClick(link);
      return;
    }

    const pageCheckboxes = annotations.filter(
      (item): item is CheckboxAnnotation =>
        isCheckboxAnnotation(item) && item.page === pageNumber,
    );
    const pageImages = annotations.filter(
      (item): item is ImageAnnotation =>
        isImageAnnotation(item) && item.page === pageNumber,
    );
    const pageTexts = annotations.filter(
      (item): item is TextAnnotation =>
        isTextAnnotation(item) && item.page === pageNumber,
    );

    const hitImage = hitTestImage(point.x, point.y, pageImages);
    if (hitImage) {
      onSelectAnnotation(hitImage.id);
      return;
    }

    for (const text of pageTexts) {
      if (
        point.x >= text.x &&
        point.x <= text.x + text.width &&
        point.y >= text.y &&
        point.y <= text.y + 4
      ) {
        onSelectAnnotation(text.id);
        return;
      }
    }

    const instanceId =
      activeInstanceId === DEFAULT_INSTANCE_ID ? undefined : activeInstanceId;

    if (tool === "checkbox") {
      const existing = hitTestCheckbox(point.x, point.y, pageCheckboxes);
      if (existing) {
        onToggleCheckbox(existing.id);
        return;
      }
      const checkbox = createCheckboxAnnotation(pageNumber, point.x, point.y, instanceId);
      onAddAnnotation(checkbox);
      onSelectAnnotation(checkbox.id);
      return;
    }

    if (tool === "image" && pendingImage) {
      const image = createImageAnnotation(
        pageNumber,
        point.x,
        point.y,
        pendingImage.src,
        pendingImage.width,
        pendingImage.height,
        pendingImage.aspectRatio,
        instanceId,
      );
      onAddAnnotation(image);
      onSelectAnnotation(image.id);
      onPendingImagePlaced();
      return;
    }

    if (tool === "image") return;

    if (tool !== "text") return;

    const text = createTextAnnotation(
      pageNumber,
      point.x,
      point.y - 1.2,
      textStyle,
      instanceId,
    );
    onAddAnnotation(text);
    onSelectAnnotation(text.id);
  };

  const handleImageResizeMouseDown = (
    event: ReactMouseEvent,
    annotation: ImageAnnotation,
  ) => {
    event.stopPropagation();
    resizeState.current = {
      id: annotation.id,
      anchorX: annotation.x,
      anchorY: annotation.y,
      aspectRatio: annotation.aspectRatio,
    };
    onSelectAnnotation(annotation.id);
  };

  const handleDragMouseDown = (
    event: ReactMouseEvent,
    annotation: TextAnnotation | ImageAnnotation,
  ) => {
    event.stopPropagation();
    if (!containerRef.current) return;

    const point = getPointerPercent(event);
    dragState.current = {
      id: annotation.id,
      offsetX: point.x - annotation.x,
      offsetY: point.y - annotation.y,
    };
    onSelectAnnotation(annotation.id);
  };

  const handleTextMouseDown = (event: ReactMouseEvent, annotation: TextAnnotation) => {
    handleDragMouseDown(event, annotation);
  };

  useEffect(() => {
    const handleMouseMove = (event: globalThis.MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const pointerX = ((event.clientX - rect.left) / rect.width) * 100;
      const pointerY = ((event.clientY - rect.top) / rect.height) * 100;

      if (resizeState.current) {
        const { id, anchorX, anchorY, aspectRatio } = resizeState.current;
        let newWidth = Math.max(5, pointerX - anchorX);
        let newHeight = imageHeightForWidth(newWidth, aspectRatio);

        if (anchorX + newWidth > 100) {
          newWidth = 100 - anchorX;
          newHeight = imageHeightForWidth(newWidth, aspectRatio);
        }
        if (anchorY + newHeight > 100) {
          newHeight = 100 - anchorY;
          newWidth = Math.max(5, imageWidthForHeight(newHeight, aspectRatio));
        }

        onUpdateAnnotation(id, {
          width: Math.max(5, newWidth),
          height: Math.max(5, newHeight),
        });
        return;
      }

      if (!dragState.current) return;

      onUpdateAnnotation(dragState.current.id, {
        x: Math.max(0, Math.min(100, pointerX - dragState.current.offsetX)),
        y: Math.max(0, Math.min(100, pointerY - dragState.current.offsetY)),
      });
    };

    const handleMouseUp = () => {
      dragState.current = null;
      resizeState.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onUpdateAnnotation]);

  const pageAnnotations = annotations.filter((item) => item.page === pageNumber);
  const pageTextFontFamilies = useMemo(
    () =>
      pageAnnotations
        .filter(isTextAnnotation)
        .map((item) => item.fontFamily)
        .join("|"),
    [pageAnnotations],
  );

  useEffect(() => {
    for (const family of pageTextFontFamilies.split("|").filter(Boolean)) {
      loadGoogleFont(family);
    }
  }, [pageTextFontFamilies]);

  const pageImages = pageAnnotations.filter(isImageAnnotation);
  const pageOthers = pageAnnotations.filter((item) => !isImageAnnotation(item));
  const sectionIndex = getSectionIndex(pageNumber);

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: pageSize.width }}>
      <div
        ref={containerRef}
        className={cn(
          "planner-page relative w-full select-none",
          tool === "text"
            ? "cursor-text"
            : tool === "image"
              ? "cursor-copy"
              : tool === "checkbox"
                ? "cursor-crosshair"
                : "cursor-pointer",
          loading && "opacity-70",
        )}
        style={{ aspectRatio: `${pageSize.width} / ${pageSize.height}` }}
        onClick={handlePageClick}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {weekFocusY != null && (
          <div
            ref={weekFocusRef}
            className="pointer-events-none absolute left-0 w-full"
            style={{ top: `${weekFocusY}%`, height: 0 }}
            aria-hidden="true"
          />
        )}

        <CalendarOverlay
          cells={calendarCells}
          events={calendarEvents}
          compact={compactCalendar}
          compactStyle={isDailyMiniCal ? "dot" : "box"}
        />

        {sectionIndex && (
          <SectionIndexOverlay
            config={sectionIndex}
            instanceCounts={sectionInstanceCounts}
            onNavigate={onPageNavigate}
            onAddCopy={onAddSectionCopy}
          />
        )}

        {pageImages.map((annotation) => {
          const isSelected = selectedId === annotation.id;
          return (
            <div
              key={annotation.id}
              className={cn("absolute z-10", isSelected && "outline outline-2 outline-offset-0 outline-primary/60")}
              style={{
                left: `${annotation.x}%`,
                top: `${annotation.y}%`,
                width: `${annotation.width}%`,
                height: `${annotation.height}%`,
              }}
              onMouseDown={(event) => handleDragMouseDown(event, annotation)}
              onClick={(event) => event.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={annotation.src}
                alt="Custom planner image"
                className="pointer-events-none block h-full w-full object-contain"
                draggable={false}
                onLoad={(event) => {
                  const img = event.currentTarget;
                  const naturalAspect = img.naturalWidth / img.naturalHeight;
                  if (Math.abs(annotation.aspectRatio - naturalAspect) > 0.01) {
                    onUpdateAnnotation(annotation.id, {
                      aspectRatio: naturalAspect,
                      height: imageHeightForWidth(annotation.width, naturalAspect),
                    });
                  }
                }}
              />
              {isSelected && (
                <div
                  className="planner-image-resize-handle absolute right-0 bottom-0 z-20 size-4 translate-x-1/2 translate-y-1/2 cursor-se-resize"
                  title="Drag to resize"
                  onMouseDown={(event) => handleImageResizeMouseDown(event, annotation)}
                />
              )}
            </div>
          );
        })}

        {pageOthers.map((annotation) => {
          if (isCheckboxAnnotation(annotation)) {
            return (
              <button
                key={annotation.id}
                type="button"
                aria-label={annotation.checked ? "Checked" : "Unchecked"}
                className={cn(
                  "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm border border-foreground/50 bg-background/80",
                  annotation.checked && "bg-primary text-primary-foreground",
                )}
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  width: `${annotation.size}%`,
                  height: `${annotation.size * (pageSize.width / pageSize.height)}%`,
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleCheckbox(annotation.id);
                }}
              >
                {annotation.checked && <Check className="size-[70%]" strokeWidth={3} />}
              </button>
            );
          }

          if (!isTextAnnotation(annotation)) return null;

          const isSelected = selectedId === annotation.id;
          return (
            <div
              key={annotation.id}
              className={cn(
                "absolute z-20 min-h-[1.1rem] rounded-sm border border-transparent px-0.5",
                isSelected && "border-primary/60 bg-primary/5",
              )}
              style={{
                left: `${annotation.x}%`,
                top: `${annotation.y}%`,
                width: `${annotation.width}%`,
                fontSize: `${annotation.fontSize}px`,
                fontFamily: fontFamilyCss(annotation.fontFamily),
                color: annotation.color,
                lineHeight: 1.2,
              }}
              onMouseDown={(event) => handleTextMouseDown(event, annotation)}
              onClick={(event) => event.stopPropagation()}
            >
              {isSelected ? (
                <textarea
                  autoFocus
                  value={annotation.text}
                  onChange={(event) =>
                    onUpdateAnnotation(annotation.id, { text: event.target.value })
                  }
                  className="field-sizing-content w-full resize-none bg-transparent outline-none"
                  style={{
                    fontFamily: fontFamilyCss(annotation.fontFamily),
                    color: annotation.color,
                  }}
                  rows={1}
                />
              ) : (
                <span
                  className="whitespace-pre-wrap break-words"
                  style={{
                    fontFamily: fontFamilyCss(annotation.fontFamily),
                    color: annotation.color,
                  }}
                >
                  {annotation.text}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
