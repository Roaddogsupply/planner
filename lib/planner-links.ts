export type StoredPlannerLink = {
  x: number;
  y: number;
  width: number;
  height: number;
  page?: number;
  uri?: string;
};

type PlannerLinksFile = {
  version: number;
  pages: Record<string, StoredPlannerLink[]>;
};

let cached: PlannerLinksFile | null = null;
let loading: Promise<PlannerLinksFile | null> | null = null;

export function loadPlannerLinksFile() {
  if (cached) return Promise.resolve(cached);
  if (loading) return loading;

  loading = fetch("/planner-links.json")
    .then((response) => {
      if (!response.ok) return null;
      return response.json() as Promise<PlannerLinksFile>;
    })
    .then((data) => {
      cached = data;
      return data;
    })
    .catch(() => null);

  return loading;
}

export function getStoredLinksForPage(
  file: PlannerLinksFile | null,
  pageNumber: number,
): StoredPlannerLink[] {
  if (!file) return [];
  return file.pages[String(pageNumber)] ?? [];
}
