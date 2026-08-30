/** Serialize pdf.js calls so background index scans do not starve the visible page. */
let backgroundTail: Promise<unknown> = Promise.resolve();

export function enqueuePdfBackgroundTask<T>(task: () => Promise<T>): Promise<T> {
  const run = backgroundTail.then(() => task());
  backgroundTail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Visible-page link extraction runs immediately, not behind the background queue. */
export function runPdfPageTask<T>(task: () => Promise<T>): Promise<T> {
  return task();
}

export function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      window.setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

export async function loadPdfAnnotations(
  getAnnotations: () => Promise<unknown[]>,
  attempts = 4,
): Promise<unknown[]> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const result = await runPdfPageTask(() =>
      withTimeout(getAnnotations(), 45_000, []),
    );
    if (result.length > 0 || attempt === attempts - 1) return result;
    await new Promise((resolve) => window.setTimeout(resolve, 1500 * (attempt + 1)));
  }
  return [];
}
