# Interactive Planner (PDF Webify)

Turn your interactive digital planner PDF into a fillable website. This app renders the planner **exactly as it appears in the PDF** and lets you navigate tabs, index links, and calendar pages the same way — then type directly on any page in **Write** mode.

## What you get

- **597 pages** — same layout, colors, and binder-style design as the original PDF
- **Navigate mode** — click tabs, index items, and internal links (just like the PDF)
- **Write mode** — click any line or box to type; drag text boxes to reposition them
- **Auto-save** — your notes are saved in your browser automatically
- **Export** — download your notes as a JSON backup file

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:4317](http://localhost:4317) in your browser.

## How to use

1. **Navigate** — Use the default mode to click planner tabs and index links.
2. **Write** — Switch to Write mode, then click where you want to type (on a line, in a box, on a calendar day, etc.).
3. **Move text** — Drag a text box to reposition it on the page.
4. **Zoom** — Use the zoom slider if the page is too small or large.
5. **Page arrows** — Use ← → keys or the toolbar to flip pages.

> **Note:** Some calendar links in the PDF use Apple Shortcuts (`shortcuts://`). Those only work on iPhone/iPad in the original PDF — on the web, use the planner pages directly.

## Project structure

| Path | Purpose |
|------|---------|
| `public/planner.pdf` | The original interactive planner PDF |
| `components/planner/` | PDF viewer, toolbar, and text overlay |
| `lib/annotations.ts` | Save/load typed notes in the browser |

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- PDF.js for exact PDF rendering
