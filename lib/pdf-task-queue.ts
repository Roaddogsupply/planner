/** Serialize pdf.js calls — concurrent getAnnotations across 597 pages starves the active page. */
let tail: Promise<unknown> = Promise.resolve();

export function enqueuePdfTask<T>(task: () => Promise<T>): Promise<T> {
  const run = tail.then(() => task());
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
