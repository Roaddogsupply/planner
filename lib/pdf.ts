"use client";

import * as pdfjs from "pdfjs-dist";

let workerConfigured = false;

export function configurePdfWorker() {
  if (workerConfigured || typeof window === "undefined") return;
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  workerConfigured = true;
}

export { pdfjs };

export const PDF_URL = "/planner.pdf";
