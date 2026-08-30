"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import { loadPlannerDocument, type LoadProgress } from "@/lib/pdf";
import {
  isImageAnnotation,
  isTextAnnotation,
  loadPlannerData,
  migratePlannerData,
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
import { compressImageFile, imageAspectHeightPercent, imageHeightForWidth } from "@/lib/image-utils";
import { createCloudSnapshot } from "@/lib/planner-cloud-types";
import {
  fetchPlannerFromCloud,
  savePlannerToCloud,
  scheduleCloudSave,
} from "@/lib/planner-cloud-sync";
import { buildRestoreLink, resolvePlannerId } from "@/lib/planner-sync-id";
import { preloadDefaultFonts } from "@/lib/google-fonts";
import {
  createSectionInstance,
  DEFAULT_INSTANCE_ID,
  getInstancesForPage,
  nextCopyLabel,
  resolveActiveInstanceId,
  type SectionInstance,
} from "@/lib/section-instances";
import { getSectionForPage, isSectionTargetPage, type SectionIndexEntry } from "@/lib/section-indexes";
import { SectionInstanceBar } from "@/components/planner/section-instance-bar";
import {
  buildCalendarPageIndex,
  dateForPlannerPage,
  type CalendarPageIndex,
} from "@/lib/calendar-pages";

const EMPTY_CALENDAR_INDEX: CalendarPageIndex = {
  datePageMap: {},
  dailyPageDates: {},
  weekPageMap: {},
  weekPageByStart: {},
  weekPageByDate: {},
  weekRowByStart: {},
  monthPageMap: {},
  yearPageMap: { "2026": 121, "2027": 122 },
  dailyPlannerPages: [],
  weekPlannerPages: [],
  monthlyPlannerPages: [],
};

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
  const [tool, setTool] = useState<PlannerTool>("navigate");
  const [textStyle, setTextStyle] = useState<TextStyle>(DEFAULT_TEXT_STYLE);
  const [annotations, setAnnotations] = useState<PlannerAnnotation[]>([]);
  const [sectionInstances, setSectionInstances] = useState<SectionInstance[]>([]);
  const [activeSectionInstances, setActiveSectionInstances] = useState<Record<number, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState("Loading…");
  const [restoreLink, setRestoreLink] = useState("");
  const [plannerId, setPlannerId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [calendarFeedUrl, setCalendarFeedUrl] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [calendarLastSynced, setCalendarLastSynced] = useState<string | null>(null);
  const [calendarSyncError, setCalendarSyncError] = useState<string | null>(null);
  const [calendarPageIndex, setCalendarPageIndex] = useState<CalendarPageIndex>(EMPTY_CALENDAR_INDEX);
  const [activeCalendarDate, setActiveCalendarDate] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{
    src: string;
    width: number;
    height: number;
    aspectRatio: number;
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
      const resolvedFeedUrl = cloud?.calendarFeedUrl || feedUrl || null;

      if (cloud) {
        const migrated = migratePlannerData(cloud);
        setPage(migrated.lastPage);
        setZoom(migrated.zoom || fitZoom());
        setTool("navigate");
        setAnnotations(migrated.annotations);
        setSectionInstances(migrated.sectionInstances);
        setActiveSectionInstances(migrated.activeSectionInstances);
        setTextStyle(normalizeTextStyle(migrated.textStyle));
        savePlannerData(migrated);
      } else {
        setPage(local.lastPage);
        setZoom(local.zoom || fitZoom());
        setTool("navigate");
        setAnnotations(local.annotations);
        setSectionInstances(local.sectionInstances);
        setActiveSectionInstances(local.activeSectionInstances);
        setTextStyle(normalizeTextStyle(local.textStyle));

        if (local.annotations.length > 0 || local.lastPage > 1) {
          try {
            await savePlannerToCloud(
              id,
              createCloudSnapshot(local, feedUrl, cache),
            );
          } catch {
            // Offline or local-only — browser copy still works.
          }
        }
      }

      if (resolvedFeedUrl) {
        saveCalendarFeedUrl(resolvedFeedUrl);
        setCalendarFeedUrl(resolvedFeedUrl);
      }

      const cloudCache = cloud?.calendarCache;
      if (cloudCache?.events?.length) {
        saveCalendarCache(cloudCache);
        setCalendarEvents(cloudCache.events);
        setCalendarLastSynced(cloudCache.fetchedAt);
      } else if (cache?.events?.length) {
        setCalendarEvents(cache.events);
        setCalendarLastSynced(cache.fetchedAt);
      }

      setSavedLabel("Saved to cloud");
      setHydrated(true);
    })();
  }, []);

  const syncCalendar = useCallback(
    async (feedUrl: string) => {
      setCalendarSyncing(true);
      setCalendarSyncError(null);
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
        const cache = { events: data.events as CalendarEvent[], fetchedAt: data.fetchedAt as string };
        setCalendarEvents(cache.events);
        setCalendarLastSynced(cache.fetchedAt);
        saveCalendarCache(cache);

        if (plannerId) {
          void savePlannerToCloud(
            plannerId,
            createCloudSnapshot(
              {
                version: 4,
                annotations,
                sectionInstances,
                activeSectionInstances,
                lastPage: page,
                zoom,
                tool,
                textStyle,
              },
              feedUrl,
              cache,
            ),
          );
        }
      } catch (syncError) {
        const message =
          syncError instanceof Error ? syncError.message : "Calendar sync failed";
        setCalendarSyncError(message);
        throw syncError;
      } finally {
        setCalendarSyncing(false);
      }
    },
    [plannerId, annotations, sectionInstances, activeSectionInstances, page, zoom, tool, textStyle],
  );

  useEffect(() => {
    if (!calendarFeedUrl || loading || !hydrated) return;
    void syncCalendar(calendarFeedUrl).catch(() => {
      // Error message is stored in calendarSyncError for the settings dialog.
    });
    const interval = window.setInterval(() => {
      void syncCalendar(calendarFeedUrl).catch(() => undefined);
    }, 15 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [calendarFeedUrl, loading, hydrated, syncCalendar]);

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
    if (!pdf) return;

    let cancelled = false;

    void buildCalendarPageIndex(pdf).then((index) => {
      if (cancelled) return;
      setCalendarPageIndex(index);
    });

    return () => {
      cancelled = true;
    };
  }, [pdf]);

  useEffect(() => {
    if (loading || !hydrated || !plannerId) return;

    const calendarCache =
      calendarEvents.length > 0 && calendarLastSynced
        ? { events: calendarEvents, fetchedAt: calendarLastSynced }
        : null;

    const snapshot = createCloudSnapshot(
      {
        version: 4,
        annotations,
        sectionInstances,
        activeSectionInstances,
        lastPage: page,
        zoom,
        tool,
        textStyle,
      },
      calendarFeedUrl,
      calendarCache,
    );

    savePlannerData({
      version: 4,
      annotations,
      sectionInstances,
      activeSectionInstances,
      lastPage: page,
      zoom,
      tool,
      textStyle,
    });
    scheduleCloudSave(plannerId, snapshot, (status) => {
      if (status === "saving") setSavedLabel("Saving…");
      if (status === "saved") setSavedLabel("Saved to cloud");
      if (status === "offline") setSavedLabel("Saved on this device");
    });
  }, [
    annotations,
    sectionInstances,
    activeSectionInstances,
    page,
    zoom,
    tool,
    textStyle,
    loading,
    hydrated,
    plannerId,
    calendarFeedUrl,
    calendarEvents,
    calendarLastSynced,
  ]);

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
      if (event.key === "Escape") {
        setTool("navigate");
        setSelectedId(null);
        return;
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

  const activeSectionInstanceId = useMemo(() => {
    if (!isSectionTargetPage(page)) return DEFAULT_INSTANCE_ID;
    return resolveActiveInstanceId(activeSectionInstances, page, sectionInstances);
  }, [page, activeSectionInstances, sectionInstances]);

  const visibleAnnotations = useMemo(() => {
    return annotations.filter((item) => {
      if (item.page !== page) return false;
      if (!isSectionTargetPage(page)) return true;
      const stored = item.instanceId ?? DEFAULT_INSTANCE_ID;
      return stored === activeSectionInstanceId;
    });
  }, [annotations, page, activeSectionInstanceId]);

  const sectionInstanceCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const instance of sectionInstances) {
      counts[instance.basePage] = (counts[instance.basePage] ?? 0) + 1;
    }
    return counts;
  }, [sectionInstances]);

  const navigateToSection = useCallback(
    (targetPage: number, instanceId?: string, calendarDate?: string) => {
      setPage(targetPage);
      if (calendarDate) {
        setActiveCalendarDate(calendarDate);
      } else {
        const pageDate = dateForPlannerPage(targetPage, calendarPageIndex);
        if (pageDate) {
          setActiveCalendarDate(pageDate);
        }
      }
      if (instanceId) {
        setActiveSectionInstances((current) => ({ ...current, [targetPage]: instanceId }));
      }
    },
    [calendarPageIndex],
  );

  useEffect(() => {
    const pageDate = dateForPlannerPage(page, calendarPageIndex);
    if (pageDate) {
      setActiveCalendarDate(pageDate);
    }
  }, [page, calendarPageIndex]);

  const handleAddSectionCopy = useCallback(
    (section: SectionIndexEntry) => {
      const existing = getInstancesForPage(sectionInstances, section.page);
      const label = nextCopyLabel(section.label, existing.length + 1);
      const created = createSectionInstance(section.page, label);
      setSectionInstances((current) => [...current, created]);
      navigateToSection(section.page, created.id);
    },
    [sectionInstances, navigateToSection],
  );

  const handleAddCopyForCurrentPage = useCallback(() => {
    const section = getSectionForPage(page);
    if (!section) return;
    handleAddSectionCopy(section);
  }, [page, handleAddSectionCopy]);

  const handleSelectSectionInstance = useCallback(
    (instanceId: string) => {
      setActiveSectionInstances((current) => ({ ...current, [page]: instanceId }));
    },
    [page],
  );

  const handleDeleteSectionInstance = useCallback(
    (instanceId: string) => {
      const confirmed = window.confirm(
        "Delete this copy and all notes on it? This cannot be undone.",
      );
      if (!confirmed) return;

      setSectionInstances((current) => current.filter((item) => item.id !== instanceId));
      setAnnotations((current) =>
        current.filter((item) => item.instanceId !== instanceId),
      );
      setActiveSectionInstances((current) => {
        const next = { ...current };
        if (next[page] === instanceId) {
          next[page] = DEFAULT_INSTANCE_ID;
        }
        return next;
      });
    },
    [page],
  );

  const currentSection = getSectionForPage(page);

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
      [
        JSON.stringify(
          {
            version: 4,
            annotations,
            sectionInstances,
            activeSectionInstances,
            lastPage: page,
            zoom,
            tool,
            textStyle,
          },
          null,
          2,
        ),
      ],
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
    setSectionInstances([]);
    setActiveSectionInstances({});
    setSelectedId(null);
    const cleared = createCloudSnapshot(
      {
        version: 4,
        annotations: [],
        sectionInstances: [],
        activeSectionInstances: {},
        lastPage: page,
        zoom,
        tool,
        textStyle,
      },
      calendarFeedUrl,
      calendarEvents.length > 0 && calendarLastSynced
        ? { events: calendarEvents, fetchedAt: calendarLastSynced }
        : null,
    );
    savePlannerData({
      version: 4,
      annotations: [],
      sectionInstances: [],
      activeSectionInstances: {},
      lastPage: page,
      zoom,
      tool,
      textStyle,
    });
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
      setPendingImage({ src, width, height, aspectRatio: aspect });
      setTool("image");
    } catch (pickError) {
      window.alert(pickError instanceof Error ? pickError.message : "Could not add image.");
    }
  };

  const handleImageWidthChange = (width: number) => {
    if (!selectedImage) return;
    const height = imageHeightForWidth(width, selectedImage.aspectRatio);
    handleUpdateAnnotation(selectedImage.id, { width, height });
  };

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
        calendarSyncError={calendarSyncError}
        onCalendarSave={async (url) => {
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
          setCalendarSyncError(null);
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
            {currentSection && (
              <SectionInstanceBar
                label={currentSection.label}
                basePage={page}
                instances={sectionInstances}
                activeInstanceId={activeSectionInstanceId}
                onSelectInstance={handleSelectSectionInstance}
                onAddCopy={handleAddCopyForCurrentPage}
                onDeleteCopy={handleDeleteSectionInstance}
              />
            )}
            <PdfPage
              pdf={pdf}
              pageNumber={page}
              scale={zoom}
              tool={tool}
              annotations={visibleAnnotations}
              selectedId={selectedId}
              textStyle={textStyle}
              activeInstanceId={activeSectionInstanceId}
              sectionInstanceCounts={sectionInstanceCounts}
              onPageNavigate={navigateToSection}
              onAddSectionCopy={handleAddSectionCopy}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              onSelectAnnotation={setSelectedId}
              onToggleCheckbox={handleToggleCheckbox}
              calendarEvents={calendarEvents}
              calendarPageIndex={calendarPageIndex}
              activeCalendarDate={activeCalendarDate}
              pendingImage={pendingImage}
              onPendingImagePlaced={() => setPendingImage(null)}
            />

          </>
        )}
      </main>
    </div>
  );
}
