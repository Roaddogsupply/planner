"use client";

import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfjsModule: PdfJsModule | null = null;

export async function getPdfJs(): Promise<PdfJsModule> {
  if (pdfjsModule) return pdfjsModule;

  pdfjsModule = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsModule.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsModule.version}/legacy/build/pdf.worker.min.mjs`;

  return pdfjsModule;
}

export const PDF_URL = "/planner.pdf";

export type LoadProgress = {
  phase: "downloading" | "opening";
  percent: number;
};

async function fetchPdfBytes(
  onProgress?: (progress: LoadProgress) => void,
): Promise<Uint8Array> {
  const response = await fetch(PDF_URL);

  if (!response.ok) {
    throw new Error(`Could not download planner PDF (${response.status})`);
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  const reader = response.body?.getReader();

  if (!reader) {
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    received += value.length;

    if (contentLength > 0) {
      onProgress?.({
        phase: "downloading",
        percent: Math.min(99, Math.round((received / contentLength) * 100)),
      });
    }
  }

  const data = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.length;
  }

  return data;
}

export async function loadPlannerDocument(
  onProgress?: (progress: LoadProgress) => void,
): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfJs();
  const data = await fetchPdfBytes(onProgress);

  onProgress?.({ phase: "opening", percent: 100 });

  // Run on the main thread so a broken/missing worker cannot hang forever.
  const loadingTask = pdfjs.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableWorker: true,
  } as Parameters<typeof pdfjs.getDocument>[0]);

  return loadingTask.promise;
}
