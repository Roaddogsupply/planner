"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import { loadPlannerDocument, type LoadProgress } from "@/lib/pdf";
import {
  isImageAnnotation,
  isTextAnnotation,
  loadPlannerData,
  savePlannerData,
  type ImageAnnotation,
  type PlannerAnnotation,
  type PlannerTool,
} from "@/lib/annotations";
import { DEFAULT_TEXT_STYLE, normalizeTextStyle, type TextStyle } from "@/lib/text-styles";
import { normalizeFontFamily } from "@/lib/google-fonts";
import { PdfPage } from "@/components/planner/pdf-page";
import { PlannerToolbar } from "@/components/planner/planner-toolbar";
import type { CalendarEvent } from "@/lib/calendar-types";
import {
  clearCalendarCache,
  loadCalendarCache,
  loadCalendarFeedUrl,
  saveCalendarCache,
  saveCalendarFeedUrl,
} from "@/lib/calendar-storage";
import { customTabLabel, isCustomPage } from "@/lib/custom-pages";
import { compressImageFile, imageAspectHeightPercent } from "@/lib/image-utils";
import { createCloudSnapshot } from "@/lib/planner-cloud-types";
import {
  fetchPlannerFromCloud,
  savePlannerToCloud,
  scheduleCloudSave,
} from "@/lib/planner-cloud-sync";
import { buildRestoreLink, resolvePlannerId } from "@/lib/planner-sync-id";
import { preloadDefaultFonts } from "@/lib/google-fonts";

function formatLoadingMessage(progress: LoadProgress | null) {
  if (!progress) return "Starting planner…";
  if (progress.phase === "starting") return "Starting planner…";
  if (progress.phase === "downloading") {
    return progress.percent > 0
      ? `Downloading planner… ${progress.percent}%`
      : "Downloading planner…";
  }
  return progress.percent >= 50 ? "Opening planner…" : "Preparing viewer…";
}

function fitZoom() {
  if (typeof window === "undefined") return 1;
  const padding = 48;
  const scaleX = (window.innerWidth - padding) / 816;
  const scaleY = (window.innerHeight - 160) / 595;
  return Math.min(Math.max(Math.min(scaleX, scaleY), 0.55), 1.35);
}

export function PlannerViewer() {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState<LoadProgress>({
    phase: "starting",
    percent: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<PlannerTool>("text");
  const [textStyle, setTextStyle] = useState<TextStyle>(DEFAULT_TEXT_STYLE);
  const [annotations, setAnnotations] = useState<PlannerAnnotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState("Loading…");
  const [restoreLink, setRestoreLink] = useState("");
  const [plannerId, setPlannerId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [calendarFeedUrl, setCalendarFeedUrl] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [calendarLastSynced, setCalendarLastSynced] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{
    src: string;
    width: number;
    height: number;
  } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    preloadDefaultFonts();
    const id = resolvePlannerId();
    setPlannerId(id);
    setRestoreLink(buildRestoreLink(id));

    const local = loadPlannerData();
    const feedUrl = loadCalendarFeedUrl();
    const cache = loadCalendarCache();

    void (async () => {
      const cloud = await fetchPlannerFromCloud(id);

      if (cloud) {
        setPage(cloud.lastPage);
        setZoom(cloud.zoom || fitZoom());
        setTool(cloud.tool);
        setAnnotations(cloud.annotations);
        setTextStyle(normalizeTextStyle(cloud.textStyle));
        savePlannerData({
          version: 3,
          annotations: cloud.annotations,
          lastPage: cloud.lastPage,
          zoom: cloud.zoom,
          tool: cloud.tool,
          textStyle: normalizeTextStyle(cloud.textStyle),
        });

        if (cloud.calendarFeedUrl) {
          saveCalendarFeedUrl(cloud.calendarFeedUrl);
          setCalendarFeedUrl(cloud.calendarFeedUrl);
        } else if (feedUrl) {
          setCalendarFeedUrl(feedUrl);
        }
      } else {
        setPage(local.lastPage);
        setZoom(local.zoom || fitZoom());
        setTool(local.tool);
        setAnnotations(local.annotations);
        setTextStyle(normalizeTextStyle(local.textStyle));
        if (feedUrl) setCalendarFeedUrl(feedUrl);

        if (local.annotations.length > 0 || local.lastPage > 1) {
          try {
            await savePlannerToCloud(
              id,
              createCloudSnapshot(local, feedUrl),
            );
          } catch {
            // Offline or local-only — browser copy still works.
          }
        }
      }

      if (cache) {
        setCalendarEvents(cache.events);
        setCalendarLastSynced(cache.fetchedAt);
      }

      setSavedLabel("Saved to cloud");
      setHydrated(true);
    })();
  }, []);

  const syncCalendar = useCallback(async (feedUrl: string) => {
    setCalendarSyncing(true);
    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Calendar sync failed");
      }
      setCalendarEvents(data.events);
      setCalendarLastSynced(data.fetchedAt);
      saveCalendarCache({ events: data.events, fetchedAt: data.fetchedAt });
    } finally {
      setCalendarSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!calendarFeedUrl || loading) return;
    void syncCalendar(calendarFeedUrl);
    const interval = window.setInterval(() => {
      void syncCalendar(calendarFeedUrl);
    }, 15 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [calendarFeedUrl, loading, syncCalendar]);

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      setLoadProgress({ phase: "starting", percent: 0 });

      try {
        const doc = await loadPlannerDocument((progress) => {
          if (!cancelled) setLoadProgress(progress);
        });
        if (!cancelled) setPdf(doc);
      } catch (loadError) {
        if (!cancelled) {
          console.error(loadError);
          const message =
            loadError instanceof Error ? loadError.message : "Unknown error";
          setError(
            `Could not load the planner PDF (${message}). Please hard-refresh and try again.`,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPdf();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading || !hydrated || !plannerId) return;

    const snapshot = createCloudSnapshot(
      { version: 3, annotations, lastPage: page, zoom, tool, textStyle },
      calendarFeedUrl,
    );

    savePlannerData({ version: 3, annotations, lastPage: page, zoom, tool, textStyle });
    scheduleCloudSave(plannerId, snapshot, (status) => {
      if (status === "saving") setSavedLabel("Saving…");
      if (status === "saved") setSavedLabel("Saved to cloud");
      if (status === "offline") setSavedLabel("Saved on this device");
    });
  }, [annotations, page, zoom, tool, textStyle, loading, hydrated, plannerId, calendarFeedUrl]);

  useEffect(() => {
    if (!selectedId) return;
    const item = annotations.find((annotation) => annotation.id === selectedId);
    if (item && isTextAnnotation(item)) {
      setTextStyle(
        normalizeTextStyle({
          fontSize: item.fontSize,
          fontFamily: normalizeFontFamily(item.fontFamily),
          color: item.color,
        }),
      );
    }
  }, [selectedId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!pdf) return;
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        setPage((current) => Math.max(1, current - 1));
      }
      if (event.key === "ArrowRight") {
        setPage((current) => Math.min(pdf.numPages, current + 1));
      }
      if (event.key === "Delete" && selectedId) {
        setAnnotations((current) => current.filter((item) => item.id !== selectedId));
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pdf, selectedId]);

  const totalPages = pdf?.numPages ?? 597;

  const handleAddAnnotation = useCallback((annotation: PlannerAnnotation) => {
    setAnnotations((current) => [...current, annotation]);
  }, []);

  const handleUpdateAnnotation = useCallback((id: string, patch: Record<string, unknown>) => {
    setAnnotations((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } as PlannerAnnotation : item)),
    );
  }, []);

  const handleTextStyleChange = useCallback(
    (patch: Partial<TextStyle>) => {
      setTextStyle((current) => normalizeTextStyle({ ...current, ...patch }));
      if (!selectedId) return;
      setAnnotations((current) =>
        current.map((item) =>
          item.id === selectedId && isTextAnnotation(item)
            ? { ...item, ...patch }
            : item,
        ),
      );
    },
    [selectedId],
  );

  const selectedText = annotations.find(
    (item) => item.id === selectedId && isTextAnnotation(item),
  );

  const handleToggleCheckbox = useCallback((id: string) => {
    setAnnotations((current) =>
      current.map((item) =>
        item.kind === "checkbox" && item.id === id
          ? { ...item, checked: !item.checked }
          : item,
      ),
    );
  }, []);

  const handleExport = () => {
    const blob = new Blob(
      [JSON.stringify({ version: 3, annotations, lastPage: page, zoom, tool, textStyle }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "planner-notes.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      "Clear all typed notes, images, and checkmarks everywhere (cloud and this browser)? This cannot be undone.",
    );
    if (!confirmed || !plannerId) return;
    setAnnotations([]);
    setSelectedId(null);
    const cleared = createCloudSnapshot(
      { version: 3, annotations: [], lastPage: page, zoom, tool, textStyle },
      calendarFeedUrl,
    );
    savePlannerData({ version: 3, annotations: [], lastPage: page, zoom, tool, textStyle });
    void savePlannerToCloud(plannerId, cleared);
  };

  const selectedImage = annotations.find(
    (item): item is ImageAnnotation => item.id === selectedId && isImageAnnotation(item),
  );

  const handlePickImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const src = await compressImageFile(file);
      const aspect = await new Promise<number>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
        img.onerror = reject;
        img.src = src;
      });
      const width = 30;
      const height = imageAspectHeightPercent(width, aspect);
      setPendingImage({ src, width, height });
      setTool("image");
    } catch (pickError) {
      window.alert(pickError instanceof Error ? pickError.message : "Could not add image.");
    }
  };

  const handleImageWidthChange = (width: number) => {
    if (!selectedImage) return;
    const ratio = selectedImage.width / selectedImage.height;
    const height = width / ratio;
    handleUpdateAnnotation(selectedImage.id, { width, height });
  };

  const helpText = useMemo(() => {
    if (isCustomPage(page)) {
      if (tool === "image") {
        return pendingImage
          ? "Custom page: click where you want the image. Use Type for text anytime."
          : "Custom page: pick Image, choose a photo, then click the page to place it.";
      }
      return "Custom page — fully yours. Click anywhere to type. Use Image to add photos.";
    }
    if (calendarFeedUrl) {
      return "Events show on monthly calendar pages — click a month tab (JAN, FEB, etc.) on the left edge.";
    }
    if (tool === "image") {
      return pendingImage
        ? "Click the page to place your image."
        : "Choose Image, pick a photo, then click the page.";
    }
    if (tool === "text") {
      return "Use the toolbar to pick font, size, and color — then click any line or box to type.";
    }
    return "Check mode: click on » marks or checklist rows to add a checkmark. Tabs still work.";
  }, [page, tool, pendingImage, calendarFeedUrl]);

  const statusMessage = useMemo(() => {
    if (loading) return formatLoadingMessage(loadProgress);
    if (error) return error;
    return null;
  }, [loading, loadProgress, error]);

  const showProgressBar =
    loading &&
    (loadProgress.phase === "downloading" ||
      loadProgress.phase === "opening" ||
      loadProgress.phase === "starting");

  return (
    <div className="planner-app flex min-h-screen flex-col">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleImageFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <PlannerToolbar
        page={page}
        totalPages={totalPages}
        zoom={zoom}
        tool={tool}
        textStyle={textStyle}
        editingSelectedText={Boolean(selectedText)}
        savedLabel={savedLabel}
        restoreLink={restoreLink}
        onPageChange={setPage}
        onZoomChange={setZoom}
        onToolChange={(next) => {
          setTool(next);
          setSelectedId(null);
          if (next !== "image") setPendingImage(null);
        }}
        onTextStyleChange={handleTextStyleChange}
        onDeleteSelected={() => {
          if (!selectedId) return;
          setAnnotations((current) => current.filter((item) => item.id !== selectedId));
          setSelectedId(null);
        }}
        onExport={handleExport}
        onReset={handleReset}
        hasSelection={Boolean(selectedId)}
        calendarFeedUrl={calendarFeedUrl}
        calendarEventCount={calendarEvents.length}
        calendarSyncing={calendarSyncing}
        calendarLastSynced={calendarLastSynced}
        onCalendarSave={async (url) => {
          clearCalendarCache();
          saveCalendarFeedUrl(url);
          setCalendarFeedUrl(url);
          await syncCalendar(url);
        }}
        onCalendarDisconnect={() => {
          saveCalendarFeedUrl(null);
          clearCalendarCache();
          setCalendarFeedUrl(null);
          setCalendarEvents([]);
          setCalendarLastSynced(null);
        }}
        onCalendarRefresh={async () => {
          if (!calendarFeedUrl) return;
          await syncCalendar(calendarFeedUrl);
        }}
        isCustomPage={isCustomPage(page)}
        pendingImage={Boolean(pendingImage)}
        onPickImage={handlePickImage}
        selectedImageWidth={selectedImage ? selectedImage.width : null}
        onImageWidthChange={handleImageWidthChange}
      />

      <main className="planner-stage flex flex-1 flex-col items-center px-4 py-6">
        {statusMessage && (
          <div className="planner-status mb-4 w-full max-w-md rounded-xl px-4 py-3 text-center text-sm">
            <p>{statusMessage}</p>
            {showProgressBar && (
              <div className="bg-muted mt-3 h-2 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(loadProgress.percent, loadProgress.phase === "starting" ? 5 : 10)}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {pdf && !error && (
          <>
            {customTabLabel(page) && (
              <p className="text-primary mb-3 text-center text-sm font-medium">
                {customTabLabel(page)} — add text and images anywhere on this page
              </p>
            )}
            <PdfPage
              pdf={pdf}
              pageNumber={page}
              scale={zoom}
              tool={tool}
              annotations={annotations}
              selectedId={selectedId}
              textStyle={textStyle}
              onPageNavigate={setPage}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              onSelectAnnotation={setSelectedId}
              onToggleCheckbox={handleToggleCheckbox}
              calendarEvents={calendarEvents}
              pendingImage={pendingImage}
              onPendingImagePlaced={() => setPendingImage(null)}
            />

            <p className="text-muted-foreground mt-4 max-w-2xl text-center text-xs sm:text-sm">
              {helpText}
            </p>
            {restoreLink && (
              <p className="text-muted-foreground mt-2 max-w-2xl text-center text-xs">
                Your notes auto-save to the cloud. Bookmark this page once — if your browser
                ever clears data, open that bookmark and everything comes back.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
