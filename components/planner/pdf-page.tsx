"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import type { TextAnnotation } from "@/lib/annotations";
import { cn } from "@/lib/utils";

type PdfPageProps = {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  editMode: boolean;
  annotations: TextAnnotation[];
  selectedId: string | null;
  fontSize: number;
  onPageNavigate: (page: number) => void;
  onAddAnnotation: (annotation: TextAnnotation) => void;
  onUpdateAnnotation: (id: string, patch: Partial<TextAnnotation>) => void;
  onSelectAnnotation: (id: string | null) => void;
};

type LinkOverlay = {
  left: number;
  top: number;
  width: number;
  height: number;
  page?: number;
  uri?: string;
};

export function PdfPage({
  pdf,
  pageNumber,
  scale,
  editMode,
  annotations,
  selectedId,
  fontSize,
  onPageNavigate,
  onAddAnnotation,
  onUpdateAnnotation,
  onSelectAnnotation,
}: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [links, setLinks] = useState<LinkOverlay[]>([]);
  const [loading, setLoading] = useState(true);
  const dragState = useRef<{ id: string; offsetX: number; offsetY: number } | null>(
    null,
  );

  const renderPage = useCallback(async () => {
    setLoading(true);
    let page: PDFPageProxy | null = null;

    try {
      page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setPageSize({ width: viewport.width, height: viewport.height });

      await page.render({ canvas, canvasContext: context, viewport }).promise;

      const pageLinks: LinkOverlay[] = [];
      for (const annotation of await page.getAnnotations()) {
        if (annotation.subtype !== "Link") continue;

        const rect = annotation.rect as [number, number, number, number];
        const [vx1, vy1] = viewport.convertToViewportPoint(rect[0], rect[1]);
        const [vx2, vy2] = viewport.convertToViewportPoint(rect[2], rect[3]);
        const left = Math.min(vx1, vx2);
        const top = Math.min(vy1, vy2);
        const width = Math.abs(vx2 - vx1);
        const height = Math.abs(vy2 - vy1);

        if (annotation.url) {
          pageLinks.push({ left, top, width, height, uri: annotation.url });
        } else if (annotation.dest) {
          const dest =
            typeof annotation.dest === "string"
              ? await pdf.getDestination(annotation.dest)
              : annotation.dest;
          if (dest) {
            const ref = dest[0];
            if (ref) {
              const targetPage = (await pdf.getPageIndex(ref)) + 1;
              pageLinks.push({ left, top, width, height, page: targetPage });
            }
          }
        }
      }

      setLinks(pageLinks);
    } finally {
      setLoading(false);
    }
  }, [pdf, pageNumber, scale]);

  useEffect(() => {
    void renderPage();
  }, [renderPage]);

  const handleCanvasClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!editMode || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const annotation = {
      id: crypto.randomUUID(),
      page: pageNumber,
      x,
      y,
      text: "",
      fontSize,
      width: 35,
    };

    onAddAnnotation(annotation);
    onSelectAnnotation(annotation.id);
  };

  const handleLinkClick = (link: LinkOverlay) => {
    if (editMode) return;

    if (link.page) {
      onPageNavigate(link.page);
      return;
    }

    if (link.uri) {
      if (link.uri.startsWith("shortcuts://")) {
        window.alert(
          "Calendar shortcuts only work in the PDF on iPhone/iPad. On the web, use the planner pages directly.",
        );
        return;
      }
      window.open(link.uri, "_blank", "noopener,noreferrer");
    }
  };

  const handleAnnotationMouseDown = (
    event: ReactMouseEvent,
    annotation: TextAnnotation,
  ) => {
    if (!editMode || !containerRef.current) return;
    event.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const pointerX = ((event.clientX - rect.left) / rect.width) * 100;
    const pointerY = ((event.clientY - rect.top) / rect.height) * 100;

    dragState.current = {
      id: annotation.id,
      offsetX: pointerX - annotation.x,
      offsetY: pointerY - annotation.y,
    };
    onSelectAnnotation(annotation.id);
  };

  useEffect(() => {
    const handleMouseMove = (event: globalThis.MouseEvent) => {
      if (!dragState.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const pointerX = ((event.clientX - rect.left) / rect.width) * 100;
      const pointerY = ((event.clientY - rect.top) / rect.height) * 100;

      onUpdateAnnotation(dragState.current.id, {
        x: Math.max(0, Math.min(100, pointerX - dragState.current.offsetX)),
        y: Math.max(0, Math.min(100, pointerY - dragState.current.offsetY)),
      });
    };

    const handleMouseUp = () => {
      dragState.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onUpdateAnnotation]);

  const pageAnnotations = annotations.filter((item) => item.page === pageNumber);

  return (
    <div className="relative mx-auto w-fit">
      <div
        ref={containerRef}
        className={cn(
          "planner-page relative shadow-2xl",
          editMode ? "cursor-text" : "cursor-default",
          loading && "opacity-70",
        )}
        onClick={handleCanvasClick}
      >
        <canvas ref={canvasRef} className="block max-w-full" />

        {!editMode &&
          links.map((link, index) => (
            <button
              key={`${pageNumber}-link-${index}`}
              type="button"
              aria-label="Navigate planner link"
              className="absolute cursor-pointer bg-transparent hover:bg-primary/10"
              style={{
                left: link.left,
                top: link.top,
                width: link.width,
                height: link.height,
              }}
              onClick={() => handleLinkClick(link)}
            />
          ))}

        {pageAnnotations.map((annotation) => {
          const isSelected = selectedId === annotation.id;
          return (
            <div
              key={annotation.id}
              className={cn(
                "absolute min-h-[1.25rem] rounded-sm border border-transparent px-0.5",
                editMode && "border-dashed",
                isSelected && editMode && "border-primary bg-primary/5",
              )}
              style={{
                left: `${annotation.x}%`,
                top: `${annotation.y}%`,
                width: `${annotation.width}%`,
                fontSize: `${annotation.fontSize}px`,
                lineHeight: 1.25,
              }}
              onMouseDown={(event) => handleAnnotationMouseDown(event, annotation)}
              onClick={(event) => event.stopPropagation()}
            >
              {editMode && isSelected ? (
                <textarea
                  autoFocus
                  value={annotation.text}
                  onChange={(event) =>
                    onUpdateAnnotation(annotation.id, { text: event.target.value })
                  }
                  className="field-sizing-content w-full resize-none bg-transparent text-foreground outline-none"
                  rows={1}
                />
              ) : (
                <span className="whitespace-pre-wrap break-words text-foreground">
                  {annotation.text}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {pageSize.width > 0 && (
        <p className="sr-only">
          Page {pageNumber} rendered at {Math.round(pageSize.width)} by{" "}
          {Math.round(pageSize.height)} pixels
        </p>
      )}
    </div>
  );
}
