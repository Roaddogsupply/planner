"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import { loadPlannerDocument, type LoadProgress } from "@/lib/pdf";
import {
  loadPlannerData,
  savePlannerData,
  type PlannerAnnotation,
  type PlannerTool,
} from "@/lib/annotations";
import { PdfPage } from "@/components/planner/pdf-page";
import { PlannerToolbar } from "@/components/planner/planner-toolbar";

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
  const [fontSize, setFontSize] = useState(14);
  const [annotations, setAnnotations] = useState<PlannerAnnotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState("Saved locally");

  useEffect(() => {
    const stored = loadPlannerData();
    setPage(stored.lastPage);
    setZoom(stored.zoom || fitZoom());
    setTool(stored.tool);
    setAnnotations(stored.annotations);
  }, []);

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
    if (loading) return;
    savePlannerData({ version: 2, annotations, lastPage: page, zoom, tool });
    setSavedLabel("Saved locally");
    const timer = window.setTimeout(() => setSavedLabel("All changes saved"), 400);
    return () => window.clearTimeout(timer);
  }, [annotations, page, zoom, tool, loading]);

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
      [JSON.stringify({ version: 2, annotations, lastPage: page, zoom, tool }, null, 2)],
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
      "Clear all typed notes and checkmarks from this browser? This cannot be undone.",
    );
    if (!confirmed) return;
    setAnnotations([]);
    setSelectedId(null);
    savePlannerData({ version: 2, annotations: [], lastPage: page, zoom, tool });
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
      <PlannerToolbar
        page={page}
        totalPages={totalPages}
        zoom={zoom}
        tool={tool}
        fontSize={fontSize}
        savedLabel={savedLabel}
        onPageChange={setPage}
        onZoomChange={setZoom}
        onToolChange={(next) => {
          setTool(next);
          setSelectedId(null);
        }}
        onFontSizeChange={setFontSize}
        onDeleteSelected={() => {
          if (!selectedId) return;
          setAnnotations((current) => current.filter((item) => item.id !== selectedId));
          setSelectedId(null);
        }}
        onExport={handleExport}
        onReset={handleReset}
        hasSelection={Boolean(selectedId)}
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
            <PdfPage
              pdf={pdf}
              pageNumber={page}
              scale={zoom}
              tool={tool}
              annotations={annotations}
              selectedId={selectedId}
              fontSize={fontSize}
              onPageNavigate={setPage}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              onSelectAnnotation={setSelectedId}
              onToggleCheckbox={handleToggleCheckbox}
            />

            <p className="text-muted-foreground mt-4 max-w-2xl text-center text-xs sm:text-sm">
              {tool === "text"
                ? "Click tabs and index links to navigate. Click any line or box to type on it."
                : "Check mode: click on » marks or checklist rows to add a checkmark. Tabs still work."}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
