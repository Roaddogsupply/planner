"use client";

import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";

export const PDF_URL = "/planner.pdf";

export type LoadProgress = {
  phase: "starting" | "downloading" | "opening";
  percent: number;
};

function pdfWorkerSrc() {
  return `${window.location.origin}/pdf.worker.min.mjs`;
}

async function fetchPdfBytes(
  onProgress?: (progress: LoadProgress) => void,
): Promise<Uint8Array> {
  onProgress?.({ phase: "downloading", percent: 0 });

  const response = await fetch(PDF_URL);

  if (!response.ok) {
    throw new Error(`Could not download planner PDF (${response.status})`);
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  const reader = response.body?.getReader();

  if (!reader) {
    const buffer = await response.arrayBuffer();
    onProgress?.({ phase: "downloading", percent: 100 });
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
    } else if (received > 0) {
      onProgress?.({ phase: "downloading", percent: 50 });
    }
  }

  const data = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.length;
  }

  onProgress?.({ phase: "downloading", percent: 100 });
  return data;
}

async function openPdfBytes(
  data: Uint8Array,
  onProgress?: (progress: LoadProgress) => void,
): Promise<PDFDocumentProxy> {
  onProgress?.({ phase: "opening", percent: 0 });

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc();

  onProgress?.({ phase: "opening", percent: 50 });

  async function openDocument() {
    const loadingTask = pdfjs.getDocument({
      data,
      useWorkerFetch: false,
    });
    return Promise.race([
      loadingTask.promise,
      new Promise<never>((_, reject) => {
        window.setTimeout(
          () => reject(new Error("Timed out opening planner PDF")),
          120_000,
        );
      }),
    ]);
  }

  try {
    const doc = await openDocument();
    onProgress?.({ phase: "opening", percent: 100 });
    return doc;
  } catch (firstError) {
    console.warn("PDF open failed, retrying once:", firstError);
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc();
    const doc = await openDocument();
    onProgress?.({ phase: "opening", percent: 100 });
    return doc;
  }
}

export async function loadPlannerDocument(
  onProgress?: (progress: LoadProgress) => void,
): Promise<PDFDocumentProxy> {
  onProgress?.({ phase: "starting", percent: 0 });

  const data = await fetchPdfBytes(onProgress);
  return openPdfBytes(data, onProgress);
}
