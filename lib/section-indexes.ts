export type SectionIndexEntry = {
  label: string;
  page: number;
};

/** Shared geometry for section index lists (matches Finance / Self-Care tabs in the PDF). */
export const INDEX_LIST_LAYOUT = {
  x: 7.5,
  width: 37.13,
  rowHeight: 7.18,
  /** Top edge of each row bar, as % of page height */
  rowTops: [18.31, 27.03, 36.19, 45.26, 54.2, 63.13, 72, 80.94],
  /** Mask over the list column — hides duplicated PDF text underneath */
  mask: { x: 6, y: 16.5, width: 41, height: 69 },
};

export type SectionIndexConfig = {
  pageNumber: number;
  title: string;
  sections: SectionIndexEntry[];
};

/** Index pages where the PDF text is duplicated — we redraw the list to match other tabs. */
export const SECTION_INDEX_PAGES: SectionIndexConfig[] = [
  {
    pageNumber: 27,
    title: "Education",
    sections: [
      { label: "Study Planner", page: 28 },
      { label: "Assignment Planner", page: 29 },
      { label: "Class Details", page: 30 },
      { label: "Revision Tracker", page: 31 },
      { label: "Project Outline", page: 32 },
      { label: "Progress & Grades", page: 33 },
      { label: "Lesson Planning", page: 34 },
      { label: "Reading List", page: 35 },
    ],
  },
];

export function getSectionIndex(pageNumber: number) {
  return SECTION_INDEX_PAGES.find((entry) => entry.pageNumber === pageNumber) ?? null;
}

export function isSectionIndexOverlayLink(pageNumber: number, link: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  if (!getSectionIndex(pageNumber)) return false;

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
