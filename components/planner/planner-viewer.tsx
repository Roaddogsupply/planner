"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { configurePdfWorker, pdfjs, PDF_URL } from "@/lib/pdf";
import {
  loadPlannerData,
  savePlannerData,
  type TextAnnotation,
} from "@/lib/annotations";
import { PdfPage } from "@/components/planner/pdf-page";
import { PlannerToolbar } from "@/components/planner/planner-toolbar";

export function PlannerViewer() {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState("Saved locally");

  useEffect(() => {
    configurePdfWorker();
    const stored = loadPlannerData();
    setPage(stored.lastPage);
    setZoom(stored.zoom);
    setAnnotations(stored.annotations);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);

      try {
        const doc = await pdfjs.getDocument({ url: PDF_URL }).promise;
        if (!cancelled) {
          setPdf(doc);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load the planner PDF. Please refresh and try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPdf();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    savePlannerData({ version: 1, annotations, lastPage: page, zoom });
    setSavedLabel("Saved locally");
    const timer = window.setTimeout(() => setSavedLabel("All changes saved"), 400);
    return () => window.clearTimeout(timer);
  }, [annotations, page, zoom, loading]);

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
      if (event.key === "Delete" && selectedId && editMode) {
        setAnnotations((current) => current.filter((item) => item.id !== selectedId));
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pdf, selectedId, editMode]);

  const totalPages = pdf?.numPages ?? 597;

  const handleAddAnnotation = useCallback((annotation: TextAnnotation) => {
    setAnnotations((current) => [...current, annotation]);
  }, []);

  const handleUpdateAnnotation = useCallback(
    (id: string, patch: Partial<TextAnnotation>) => {
      setAnnotations((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const handleExport = () => {
    const blob = new Blob(
      [JSON.stringify({ version: 1, annotations, lastPage: page, zoom }, null, 2)],
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
      "Clear all typed notes from this browser? This cannot be undone.",
    );
    if (!confirmed) return;
    setAnnotations([]);
    setSelectedId(null);
    savePlannerData({ version: 1, annotations: [], lastPage: page, zoom });
  };

  const statusMessage = useMemo(() => {
    if (loading) return "Loading your planner…";
    if (error) return error;
    return null;
  }, [loading, error]);

  return (
    <div className="planner-app flex min-h-screen flex-col">
      <PlannerToolbar
        page={page}
        totalPages={totalPages}
        zoom={zoom}
        editMode={editMode}
        fontSize={fontSize}
        savedLabel={savedLabel}
        onPageChange={setPage}
        onZoomChange={setZoom}
        onEditModeChange={(next) => {
          setEditMode(next);
          if (!next) setSelectedId(null);
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
          <div className="planner-status mb-4 rounded-xl px-4 py-3 text-sm">
            {statusMessage}
          </div>
        )}

        {pdf && !error && (
          <>
            <PdfPage
              pdf={pdf}
              pageNumber={page}
              scale={zoom}
              editMode={editMode}
              annotations={annotations}
              selectedId={selectedId}
              fontSize={fontSize}
              onPageNavigate={setPage}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              onSelectAnnotation={setSelectedId}
            />

            <p className="text-muted-foreground mt-4 max-w-2xl text-center text-xs sm:text-sm">
              {editMode
                ? "Write mode: click on any line or box to type. Drag text boxes to reposition them."
                : "Navigate mode: click tabs, index links, and calendar links — just like the PDF."}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
