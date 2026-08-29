/** Right-side CUSTOM tab pages in the planner PDF (tabs 1–10 + header page). */
export const CUSTOM_PAGE_START = 97;
export const CUSTOM_PAGE_END = 107;

export function isCustomPage(pageNumber: number) {
  return pageNumber >= CUSTOM_PAGE_START && pageNumber <= CUSTOM_PAGE_END;
}

export function customTabLabel(pageNumber: number) {
  if (pageNumber === CUSTOM_PAGE_START) return "Custom · Notes";
  if (isCustomPage(pageNumber)) return `Custom ${pageNumber - CUSTOM_PAGE_START}`;
  return null;
}
