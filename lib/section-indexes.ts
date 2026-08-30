export type SectionIndexEntry = {
  label: string;
  page: number;
  /** Top edge of the row bar, as % of page height */
  rowTop: number;
};

/** Pastel bar colors — same sequence used on Travel, Finance, and other index tabs in the PDF. */
export const INDEX_BAR_COLORS = [
  "#b5cde0", /* light blue */
  "#b5bdd8", /* periwinkle */
  "#c8bdd4", /* lavender */
  "#d4bfc8", /* dusty pink */
  "#e0c4b8", /* peach */
  "#d8cfc0", /* beige */
  "#e8dcb8", /* yellow */
  "#c8dbbf", /* mint */
] as const;

/** Shared geometry for section index lists (matches Travel / Finance tabs in the PDF). */
export const INDEX_LIST_LAYOUT = {
  x: 7.5,
  width: 37.13,
  rowHeight: 7.18,
  /** Top edge of each row bar, as % of page height */
  rowTops: [18.31, 27.03, 36.19, 45.26, 54.2, 63.13, 72, 80.94],
  /** Mask over the list column — hides duplicated PDF text underneath */
  mask: { x: 6, y: 16.5, width: 41, height: 69 },
  /** Where the "+" add-copy button sits on each row */
  addButton: { x: 45.5, width: 4.2, height: 5.5 },
};

export type SectionIndexConfig = {
  pageNumber: number;
  title: string;
  /** full = redraw bars (Education). addons = keep PDF bars, only show "+" buttons */
  variant: "full" | "addons";
  sections: SectionIndexEntry[];
};

/** Index pages for tab dashboards — left-side colored section links. */
export const SECTION_INDEX_PAGES: SectionIndexConfig[] = [
  {
    pageNumber: 18,
    title: "Self-care",
    variant: "addons",
    sections: [
      { label: "Sleep & Rest Tracker", page: 19, rowTop: 18.7 },
      { label: "Fitness & Activity Log", page: 20, rowTop: 27.7 },
      { label: "Daily Mindful Moments", page: 21, rowTop: 36.7 },
      { label: "Uplifting Affirmations", page: 22, rowTop: 45.6 },
      { label: "Gratitude Reflection", page: 23, rowTop: 54.5 },
      { label: "Habit Tracker", page: 24, rowTop: 63.5 },
      { label: "Emotional Wellness Log", page: 25, rowTop: 72.6 },
      { label: "Mind & Body Checklist", page: 26, rowTop: 81.3 },
    ],
  },
  {
    pageNumber: 27,
    title: "Education",
    variant: "full",
    sections: [
      { label: "Study Planner", page: 28, rowTop: 18.31 },
      { label: "Assignment Planner", page: 29, rowTop: 27.03 },
      { label: "Class Details", page: 30, rowTop: 36.19 },
      { label: "Revision Tracker", page: 31, rowTop: 45.26 },
      { label: "Project Outline", page: 32, rowTop: 54.2 },
      { label: "Progress & Grades", page: 33, rowTop: 63.13 },
      { label: "Lesson Planning", page: 34, rowTop: 72 },
      { label: "Reading List", page: 35, rowTop: 80.94 },
    ],
  },
  {
    pageNumber: 36,
    title: "Finance",
    variant: "addons",
    sections: [
      { label: "Monthly Budget Planner", page: 37, rowTop: 18.3 },
      { label: "Bill Organizer", page: 39, rowTop: 36.2 },
      { label: "Debt Payment Tracker", page: 40, rowTop: 45.3 },
      { label: "Daily Expense", page: 41, rowTop: 54.2 },
      { label: "Savings Goal", page: 42, rowTop: 63.1 },
      { label: "Investment Overview", page: 43, rowTop: 72.0 },
      { label: "Subscription Tracker", page: 44, rowTop: 80.9 },
    ],
  },
  {
    pageNumber: 45,
    title: "Budget",
    variant: "addons",
    sections: [
      { label: "Weekly Budget Template", page: 46, rowTop: 18.6 },
      { label: "Food & Grocery", page: 47, rowTop: 28.9 },
      { label: "Vacation & Travel", page: 48, rowTop: 39.2 },
      { label: "Event Cost Organizer", page: 49, rowTop: 49.3 },
      { label: "Gift Giving Budget", page: 50, rowTop: 59.5 },
      { label: "Pet Expense Log", page: 51, rowTop: 69.7 },
      { label: "Clothing & Accessories", page: 52, rowTop: 80.0 },
    ],
  },
  {
    pageNumber: 88,
    title: "Travel",
    variant: "addons",
    sections: [
      { label: "Travel Brainstorm", page: 89, rowTop: 18.5 },
      { label: "Packing List", page: 90, rowTop: 27.3 },
      { label: "Budget Travel", page: 91, rowTop: 36.3 },
      { label: "Travel Overview", page: 92, rowTop: 45.4 },
      { label: "Weekly Travel", page: 93, rowTop: 54.3 },
      { label: "Accommodation", page: 94, rowTop: 63.3 },
      { label: "Places to Visit", page: 95, rowTop: 72.3 },
      { label: "Road Trip", page: 96, rowTop: 81.0 },
    ],
  },
];

const SECTION_PAGE_MAP = new Map<number, SectionIndexEntry>();

for (const config of SECTION_INDEX_PAGES) {
  for (const section of config.sections) {
    SECTION_PAGE_MAP.set(section.page, section);
  }
}

export function getSectionIndex(pageNumber: number) {
  return SECTION_INDEX_PAGES.find((entry) => entry.pageNumber === pageNumber) ?? null;
}

export function getSectionForPage(pageNumber: number) {
  return SECTION_PAGE_MAP.get(pageNumber) ?? null;
}

export function isSectionTargetPage(pageNumber: number) {
  return SECTION_PAGE_MAP.has(pageNumber);
}

export function isSectionIndexOverlayLink(pageNumber: number, link: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const config = getSectionIndex(pageNumber);
  if (!config || config.variant !== "full") return false;

  const { mask } = INDEX_LIST_LAYOUT;
  const linkCenterX = link.x + link.width / 2;
  const linkCenterY = link.y + link.height / 2;

  return (
    link.width > 8 &&
    linkCenterX >= mask.x &&
    linkCenterX <= mask.x + mask.width &&
    linkCenterY >= mask.y &&
    linkCenterY <= mask.y + mask.height
  );
}
