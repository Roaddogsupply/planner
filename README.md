# Interactive Planner (PDF Webify)

Turn your interactive digital planner PDF into a fillable website. This app renders the planner **exactly as it appears in the PDF** and lets you navigate tabs, index links, and calendar pages the same way — then type directly on any page in **Write** mode.

## What you get

- **597 pages** — same layout, colors, and binder-style design as the original PDF
- **Navigate mode** — click tabs, index items, and internal links (just like the PDF)
- **Write mode** — click any line or box to type; drag text boxes to reposition them
- **Auto-save** — your notes save automatically to the cloud (and in your browser as a backup)
- **My link** — bookmark your personal link once; if browser data is cleared, open that link and everything comes back
- **Export** — optional download of your notes as a JSON file

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:4317](http://localhost:4317) in your browser.

## How to use

1. **Navigate** — Click planner tabs and index links.
2. **Type** — Click any line or box to type on it.
3. **Check** — Use Check mode for checklist marks.
4. **Calendar sync** — Click **Calendar** in the toolbar, paste your Apple iCal link, and events appear on monthly calendar pages.
5. **Zoom** — Use the zoom slider if the page is too small or large.

> **Note:** Some calendar links in the PDF use Apple Shortcuts (`shortcuts://`). Those only work on iPhone/iPad in the original PDF — on the web, use the planner pages directly.

## Project structure

| Path | Purpose |
|------|---------|
| `public/planner.pdf` | The original interactive planner PDF |
| `components/planner/` | PDF viewer, toolbar, and text overlay |
| `lib/annotations.ts` | Save/load typed notes in the browser |

## Put it online (GitHub + Railway)

See **[DEPLOY.md](./DEPLOY.md)** for a beginner-friendly step-by-step guide to publish your planner as a live website.

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- PDF.js for exact PDF rendering
