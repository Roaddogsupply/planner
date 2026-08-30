/**
 * Build-time script: extract PDF link hit areas for every page.
 * Run: node scripts/extract-planner-links.mjs
 * Output: public/planner-links.json
 */
import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pdfPath = join(root, "public", "planner.pdf");
const outPath = join(root, "public", "planner-links.json");

if (!existsSync(pdfPath)) {
  console.error("[extract-planner-links] missing public/planner.pdf");
  process.exit(1);
}

const pdfStat = statSync(pdfPath);
if (existsSync(outPath) && statSync(outPath).mtimeMs >= pdfStat.mtimeMs) {
  console.log("[extract-planner-links] planner-links.json is up to date");
  process.exit(0);
}

const { getDocument, GlobalWorkerOptions } = await import(
  "pdfjs-dist/legacy/build/pdf.mjs"
);
GlobalWorkerOptions.workerSrc = join(
  root,
  "node_modules",
  "pdfjs-dist",
  "build",
  "pdf.worker.min.mjs",
);

function toPercent(value, total) {
  return (value / total) * 100;
}

function expandLink(link, padding = 0.5) {
  return {
    ...link,
    x: Math.max(0, link.x - padding),
    y: Math.max(0, link.y - padding),
    width: link.width + padding * 2,
    height: link.height + padding * 2,
  };
}

function getLinkUrl(annotation) {
  return annotation.url || annotation.unsafeUrl || null;
}

/** Left sidebar month tabs on daily / week / month spreads. */
function isCalendarSidebarTab(link) {
  return link.x < 6 && link.width < 5 && link.y >= 6 && link.y <= 90;
}

function isCalendarPlannerSpread(pageNumber) {
  return (
    pageNumber >= 231 ||
    (pageNumber >= 200 && pageNumber <= 230) ||
    (pageNumber >= 129 && pageNumber <= 140)
  );
}

const buffer = readFileSync(pdfPath);
const pdf = await getDocument({ data: new Uint8Array(buffer), useWorkerFetch: false }).promise;

const pages = {};

console.log(`[extract-planner-links] scanning ${pdf.numPages} pages…`);

for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const pageLinks = [];

  for (const annotation of await page.getAnnotations()) {
    if (annotation.subtype !== "Link") continue;

    const rect = annotation.rect;
    const [vx1, vy1] = viewport.convertToViewportPoint(rect[0], rect[1]);
    const [vx2, vy2] = viewport.convertToViewportPoint(rect[2], rect[3]);
    const left = Math.min(vx1, vx2);
    const top = Math.min(vy1, vy2);
    const width = Math.abs(vx2 - vx1);
    const height = Math.abs(vy2 - vy1);

    const base = {
      x: toPercent(left, viewport.width),
      y: toPercent(top, viewport.height),
      width: toPercent(width, viewport.width),
      height: toPercent(height, viewport.height),
    };

    const linkUrl = getLinkUrl(annotation);

    if (linkUrl) {
      pageLinks.push(expandLink({ ...base, uri: linkUrl }));
    } else if (annotation.dest) {
      const dest =
        typeof annotation.dest === "string"
          ? await pdf.getDestination(annotation.dest)
          : annotation.dest;
      const ref = dest?.[0];
      if (ref) {
        const targetPage = (await pdf.getPageIndex(ref)) + 1;
        const expanded = expandLink({ ...base, page: targetPage });
        // Sidebar tabs on calendar spreads have broken PDF destinations — strip them.
        if (isCalendarPlannerSpread(pageNumber) && isCalendarSidebarTab(expanded)) {
          const { page: _broken, ...sidebarTab } = expanded;
          pageLinks.push(sidebarTab);
        } else {
          pageLinks.push(expanded);
        }
      }
    }
  }

  pages[String(pageNumber)] = pageLinks;

  if (pageNumber % 50 === 0) {
    console.log(`[extract-planner-links] ${pageNumber}/${pdf.numPages}`);
  }
}

writeFileSync(outPath, JSON.stringify({ version: 1, pages }));
const linkCount = Object.values(pages).reduce((sum, arr) => sum + arr.length, 0);
console.log(
  `[extract-planner-links] wrote ${outPath} (${linkCount} links across ${pdf.numPages} pages)`,
);
