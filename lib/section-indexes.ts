export type SectionIndexEntry = {
  label: string;
  page: number;
};

export type SectionIndexConfig = {
  pageNumber: number;
  title: string;
  sections: SectionIndexEntry[];
  /** Region covering the duplicated PDF list (percent of page). */
  overlay: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

/** Section index pages where the PDF list text is duplicated / misaligned. */
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
    overlay: { x: 6.5, y: 13, width: 40, height: 76 },
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
  const config = getSectionIndex(pageNumber);
  if (!config) return false;

  const { overlay } = config;
  const linkCenterX = link.x + link.width / 2;
  const linkCenterY = link.y + link.height / 2;

  return (
    link.width > 8 &&
    linkCenterX >= overlay.x &&
    linkCenterX <= overlay.x + overlay.width &&
    linkCenterY >= overlay.y &&
    linkCenterY <= overlay.y + overlay.height
  );
}
