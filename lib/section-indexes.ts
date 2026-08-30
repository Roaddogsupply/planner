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
  /** "+" button size — horizontal position is derived from the bar's right edge */
  addButton: { width: 3.6, height: 5.0, topOffset: 0.35 },
};

export type SectionBarLayout = { x: number; width: number };
export type SectionAddButtonLayout = {
  width: number;
  height: number;
  topOffset?: number;
};

export type SectionIndexConfig = {
  pageNumber: number;
  title: string;
  /** full = redraw bars (Education). addons = keep PDF bars, only show "+" buttons */
  variant: "full" | "addons";
  sections: SectionIndexEntry[];
  /** PDF bar column — used to anchor "+" on the right edge of each colored row */
  bar?: SectionBarLayout;
  /** Override "+" size/placement tweaks (e.g. Personal Growth has tighter rows). */
  addButton?: SectionAddButtonLayout;
};

export function sectionBarColor(index: number) {
  return INDEX_BAR_COLORS[index % INDEX_BAR_COLORS.length] ?? INDEX_BAR_COLORS[0];
}

/** Place "+" on the right end of the colored link bar, not over the binder rings. */
export function resolveAddButtonPlacement(
  config: SectionIndexConfig,
  section: SectionIndexEntry,
  index: number,
) {
  const bar = config.bar ?? { x: INDEX_LIST_LAYOUT.x, width: INDEX_LIST_LAYOUT.width };
  const btn = config.addButton ?? INDEX_LIST_LAYOUT.addButton;
  const barColor = sectionBarColor(index);

  return {
    left: bar.x + bar.width - btn.width,
    top: section.rowTop + (btn.topOffset ?? 0.35),
    width: btn.width,
    height: btn.height,
    barColor,
  };
}

/** Index pages for tab dashboards — left-side colored section links. */
export const SECTION_INDEX_PAGES: SectionIndexConfig[] = [
  {
    pageNumber: 2,
    title: "Personal Growth",
    variant: "addons",
    bar: { x: 7.56, width: 36.4 },
    addButton: { width: 3.1, height: 3.0, topOffset: 0.12 },
    sections: [
      { label: "Goal Setter", page: 3, rowTop: 18.1 },
      { label: "Know Yourself Journal", page: 4, rowTop: 22.9 },
      { label: "Inspiration Board", page: 5, rowTop: 27.7 },
      { label: "Passions & Hobbies Log", page: 6, rowTop: 32.4 },
      { label: "Milestone Map", page: 7, rowTop: 37.1 },
      { label: "Core Beliefs Tracker", page: 8, rowTop: 41.9 },
      { label: "Self-Awareness Matrix", page: 9, rowTop: 46.7 },
      { label: "People & Moments Tracker", page: 10, rowTop: 51.4 },
      { label: "Moments of Gratitude", page: 11, rowTop: 56.2 },
      { label: "Guiding Beliefs Page", page: 12, rowTop: 61.0 },
      { label: "Pet Care Log", page: 13, rowTop: 65.8 },
      { label: "Mood & Mind Log", page: 14, rowTop: 70.6 },
      { label: "Reading Journal", page: 15, rowTop: 75.2 },
      { label: "Dream Goals Log", page: 16, rowTop: 80.1 },
      { label: "Friendship Tracker", page: 17, rowTop: 84.8 },
    ],
  },
  {
    pageNumber: 53,
    title: "Vision",
    variant: "addons",
    sections: [
      { label: "Vision Board", page: 54, rowTop: 18.8 },
      { label: "Long Term Goals", page: 55, rowTop: 29.0 },
      { label: "Five-Year Roadmap", page: 56, rowTop: 39.2 },
      { label: "Monthly Reflection", page: 57, rowTop: 49.4 },
      { label: "Dream Journal", page: 58, rowTop: 59.7 },
      { label: "Career Vision", page: 59, rowTop: 69.8 },
      { label: "Relationship Vision", page: 60, rowTop: 79.9 },
    ],
  },
  {
    pageNumber: 61,
    title: "Planning",
    variant: "addons",
    sections: [
      { label: "Goal Setting", page: 62, rowTop: 18.5 },
      { label: "Top Priorities Tracker", page: 63, rowTop: 27.4 },
      { label: "To-Do List", page: 64, rowTop: 36.3 },
      { label: "Project Planning", page: 65, rowTop: 45.2 },
      { label: "Event Organizer", page: 66, rowTop: 54.4 },
      { label: "Weekly Layout", page: 67, rowTop: 63.1 },
      { label: "Daily Time Blocker", page: 68, rowTop: 72.1 },
      { label: "Goal Action Plan", page: 69, rowTop: 80.9 },
    ],
  },
  {
    pageNumber: 70,
    title: "Household",
    variant: "addons",
    sections: [
      { label: "Task & Chore", page: 71, rowTop: 18.7 },
      { label: "Meal Plan", page: 72, rowTop: 27.8 },
      { label: "Home Cleaning", page: 73, rowTop: 36.5 },
      { label: "Appointments", page: 74, rowTop: 45.7 },
      { label: "Maintenance Job", page: 75, rowTop: 54.6 },
      { label: "Recipe Planner", page: 76, rowTop: 63.3 },
      { label: "Family Event", page: 77, rowTop: 72.5 },
      { label: "Grocery", page: 78, rowTop: 81.4 },
    ],
  },
  {
    pageNumber: 79,
    title: "Work",
    variant: "addons",
    sections: [
      { label: "Daily Work", page: 80, rowTop: 18.6 },
      { label: "Work Planner", page: 81, rowTop: 27.5 },
      { label: "Project Planner", page: 82, rowTop: 36.6 },
      { label: "Inbox Tracker", page: 83, rowTop: 45.5 },
      { label: "Meeting Notes", page: 84, rowTop: 54.4 },
      { label: "Task List", page: 85, rowTop: 63.2 },
      { label: "Brainstorming", page: 86, rowTop: 72.2 },
      { label: "Contacts", page: 87, rowTop: 81.2 },
    ],
  },
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
