export type SectionIndexEntry = {
  label: string;
  page: number;
  /** Top edge of the row bar, as % of page height */
  rowTop: number;
  /** Height of the row bar, as % of page height */
  rowHeight: number;
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

export type SectionBarLayout = { x: number; width: number };
export type SectionMaskLayout = { x: number; y: number; width: number; height: number };

/** Shared defaults — individual tabs override bar/mask when the PDF layout differs. */
export const INDEX_LIST_LAYOUT = {
  bar: { x: 7.5, width: 37.13 },
  mask: { x: 6, y: 16.5, width: 41, height: 69 },
  addColumnWidth: 14,
};

export type SectionIndexConfig = {
  pageNumber: number;
  title: string;
  sections: SectionIndexEntry[];
  bar?: SectionBarLayout;
  mask?: SectionMaskLayout;
};

export function sectionBarColor(index: number) {
  return INDEX_BAR_COLORS[index % INDEX_BAR_COLORS.length] ?? INDEX_BAR_COLORS[0];
}

export function resolveSectionLayout(config: SectionIndexConfig) {
  return {
    bar: config.bar ?? INDEX_LIST_LAYOUT.bar,
    mask: config.mask ?? INDEX_LIST_LAYOUT.mask,
  };
}

/** Index pages for tab dashboards — left-side colored section links. */
export const SECTION_INDEX_PAGES: SectionIndexConfig[] = [
  {
    pageNumber: 2,
    title: "Personal Growth",
    bar: { x: 7.56, width: 36.4 },
    mask: { x: 6, y: 16.5, width: 41, height: 72 },
    sections: [
      { label: "Goal Setter", page: 3, rowTop: 18.13, rowHeight: 3.4 },
      { label: "Know Yourself Journal", page: 4, rowTop: 22.85, rowHeight: 3.4 },
      { label: "Inspiration Board", page: 5, rowTop: 27.68, rowHeight: 3.4 },
      { label: "Passions & Hobbies Log", page: 6, rowTop: 32.42, rowHeight: 3.4 },
      { label: "Milestone Map", page: 7, rowTop: 37.08, rowHeight: 3.4 },
      { label: "Core Beliefs Tracker", page: 8, rowTop: 41.91, rowHeight: 3.4 },
      { label: "Self-Awareness Matrix", page: 9, rowTop: 46.72, rowHeight: 3.4 },
      { label: "People & Moments Tracker", page: 10, rowTop: 51.45, rowHeight: 3.4 },
      { label: "Moments of Gratitude", page: 11, rowTop: 56.21, rowHeight: 3.4 },
      { label: "Guiding Beliefs Page", page: 12, rowTop: 60.99, rowHeight: 3.4 },
      { label: "Pet Care Log", page: 13, rowTop: 65.83, rowHeight: 3.4 },
      { label: "Mood & Mind Log", page: 14, rowTop: 70.64, rowHeight: 3.4 },
      { label: "Reading Journal", page: 15, rowTop: 75.21, rowHeight: 3.4 },
      { label: "Dream Goals Log", page: 16, rowTop: 80.1, rowHeight: 3.4 },
      { label: "Friendship Tracker", page: 17, rowTop: 84.78, rowHeight: 3.4 },
    ],
  },
  {
    pageNumber: 53,
    title: "Vision",
    bar: { x: 8.09, width: 36.58 },
    sections: [
      { label: "Vision Board", page: 54, rowTop: 18.84, rowHeight: 7.55 },
      { label: "Long Term Goals", page: 55, rowTop: 28.97, rowHeight: 7.55 },
      { label: "Five-Year Roadmap", page: 56, rowTop: 39.24, rowHeight: 7.55 },
      { label: "Monthly Reflection", page: 57, rowTop: 49.43, rowHeight: 7.55 },
      { label: "Dream Journal", page: 58, rowTop: 59.71, rowHeight: 7.55 },
      { label: "Career Vision", page: 59, rowTop: 69.83, rowHeight: 7.55 },
      { label: "Relationship Vision", page: 60, rowTop: 79.92, rowHeight: 7.55 },
    ],
  },
  {
    pageNumber: 61,
    title: "Planning",
    bar: { x: 8.21, width: 36.4 },
    sections: [
      { label: "Goal Setting", page: 62, rowTop: 18.51, rowHeight: 6.92 },
      { label: "Top Priorities Tracker", page: 63, rowTop: 27.44, rowHeight: 6.92 },
      { label: "To-Do List", page: 64, rowTop: 36.28, rowHeight: 6.92 },
      { label: "Project Planning", page: 65, rowTop: 45.23, rowHeight: 6.92 },
      { label: "Event Organizer", page: 66, rowTop: 54.42, rowHeight: 6.92 },
      { label: "Weekly Layout", page: 67, rowTop: 63.11, rowHeight: 6.92 },
      { label: "Daily Time Blocker", page: 68, rowTop: 72.07, rowHeight: 6.92 },
      { label: "Goal Action Plan", page: 69, rowTop: 80.93, rowHeight: 6.92 },
    ],
  },
  {
    pageNumber: 70,
    title: "Household",
    bar: { x: 8.33, width: 36.21 },
    sections: [
      { label: "Task & Chore", page: 71, rowTop: 18.69, rowHeight: 6.29 },
      { label: "Meal Plan", page: 72, rowTop: 27.76, rowHeight: 6.29 },
      { label: "Home Cleaning", page: 73, rowTop: 36.52, rowHeight: 6.29 },
      { label: "Appointments", page: 74, rowTop: 45.72, rowHeight: 6.29 },
      { label: "Maintenance Job", page: 75, rowTop: 54.65, rowHeight: 6.29 },
      { label: "Recipe Planner", page: 76, rowTop: 63.35, rowHeight: 6.29 },
      { label: "Family Event", page: 77, rowTop: 72.51, rowHeight: 6.29 },
      { label: "Grocery", page: 78, rowTop: 81.35, rowHeight: 6.29 },
    ],
  },
  {
    pageNumber: 79,
    title: "Work",
    bar: { x: 8.09, width: 36.49 },
    sections: [
      { label: "Daily Work", page: 80, rowTop: 18.56, rowHeight: 6.67 },
      { label: "Work Planner", page: 81, rowTop: 27.5, rowHeight: 6.67 },
      { label: "Project Planner", page: 82, rowTop: 36.63, rowHeight: 6.67 },
      { label: "Inbox Tracker", page: 83, rowTop: 45.48, rowHeight: 6.67 },
      { label: "Meeting Notes", page: 84, rowTop: 54.44, rowHeight: 6.67 },
      { label: "Task List", page: 85, rowTop: 63.15, rowHeight: 6.67 },
      { label: "Brainstorming", page: 86, rowTop: 72.17, rowHeight: 6.67 },
      { label: "Contacts", page: 87, rowTop: 81.17, rowHeight: 6.67 },
    ],
  },
  {
    pageNumber: 18,
    title: "Self-care",
    bar: { x: 7.44, width: 37.22 },
    sections: [
      { label: "Sleep & Rest Tracker", page: 19, rowTop: 18.73, rowHeight: 6.29 },
      { label: "Fitness & Activity Log", page: 20, rowTop: 27.71, rowHeight: 6.29 },
      { label: "Daily Mindful Moments", page: 21, rowTop: 36.65, rowHeight: 6.29 },
      { label: "Uplifting Affirmations", page: 22, rowTop: 45.61, rowHeight: 6.29 },
      { label: "Gratitude Reflection", page: 23, rowTop: 54.54, rowHeight: 6.29 },
      { label: "Habit Tracker", page: 24, rowTop: 63.54, rowHeight: 6.29 },
      { label: "Emotional Wellness Log", page: 25, rowTop: 72.58, rowHeight: 6.29 },
      { label: "Mind & Body Checklist", page: 26, rowTop: 81.32, rowHeight: 6.29 },
    ],
  },
  {
    pageNumber: 27,
    title: "Education",
    bar: { x: 7.5, width: 37.13 },
    sections: [
      { label: "Study Planner", page: 28, rowTop: 18.31, rowHeight: 7.18 },
      { label: "Assignment Planner", page: 29, rowTop: 27.03, rowHeight: 7.18 },
      { label: "Class Details", page: 30, rowTop: 36.19, rowHeight: 7.18 },
      { label: "Revision Tracker", page: 31, rowTop: 45.26, rowHeight: 7.18 },
      { label: "Project Outline", page: 32, rowTop: 54.2, rowHeight: 7.18 },
      { label: "Progress & Grades", page: 33, rowTop: 63.13, rowHeight: 7.18 },
      { label: "Lesson Planning", page: 34, rowTop: 72, rowHeight: 7.18 },
      { label: "Reading List", page: 35, rowTop: 80.94, rowHeight: 7.18 },
    ],
  },
  {
    pageNumber: 36,
    title: "Finance",
    bar: { x: 7.5, width: 37.13 },
    sections: [
      { label: "Monthly Budget Planner", page: 37, rowTop: 18.31, rowHeight: 7.18 },
      { label: "Bill Organizer", page: 39, rowTop: 36.19, rowHeight: 7.18 },
      { label: "Debt Payment Tracker", page: 40, rowTop: 45.26, rowHeight: 7.18 },
      { label: "Daily Expense", page: 41, rowTop: 54.2, rowHeight: 7.18 },
      { label: "Savings Goal", page: 42, rowTop: 63.13, rowHeight: 7.18 },
      { label: "Investment Overview", page: 43, rowTop: 72, rowHeight: 7.18 },
      { label: "Subscription Tracker", page: 44, rowTop: 80.94, rowHeight: 7.18 },
    ],
  },
  {
    pageNumber: 45,
    title: "Budget",
    bar: { x: 8.0, width: 36.86 },
    sections: [
      { label: "Weekly Budget Template", page: 46, rowTop: 18.64, rowHeight: 7.81 },
      { label: "Food & Grocery", page: 47, rowTop: 28.93, rowHeight: 7.81 },
      { label: "Vacation & Travel", page: 48, rowTop: 39.16, rowHeight: 7.81 },
      { label: "Event Cost Organizer", page: 49, rowTop: 49.32, rowHeight: 7.81 },
      { label: "Gift Giving Budget", page: 50, rowTop: 59.53, rowHeight: 7.81 },
      { label: "Pet Expense Log", page: 51, rowTop: 69.68, rowHeight: 7.81 },
      { label: "Clothing & Accessories", page: 52, rowTop: 80.0, rowHeight: 7.81 },
    ],
  },
  {
    pageNumber: 88,
    title: "Travel",
    bar: { x: 8.31, width: 36.4 },
    sections: [
      { label: "Travel Brainstorm", page: 89, rowTop: 18.5, rowHeight: 6.8 },
      { label: "Packing List", page: 90, rowTop: 27.3, rowHeight: 6.8 },
      { label: "Budget Travel", page: 91, rowTop: 36.25, rowHeight: 6.8 },
      { label: "Travel Overview", page: 92, rowTop: 45.42, rowHeight: 6.8 },
      { label: "Weekly Travel", page: 93, rowTop: 54.33, rowHeight: 6.8 },
      { label: "Accommodation", page: 94, rowTop: 63.3, rowHeight: 6.8 },
      { label: "Places to Visit", page: 95, rowTop: 72.3, rowHeight: 6.8 },
      { label: "Road Trip", page: 96, rowTop: 80.98, rowHeight: 6.8 },
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
  if (!config) return false;

  const { mask } = resolveSectionLayout(config);
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
