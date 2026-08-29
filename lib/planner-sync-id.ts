const PLANNER_ID_KEY = "road-dog-planner-id";
const URL_PARAM = "planner";

export function buildRestoreLink(plannerId: string) {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.searchParams.set(URL_PARAM, plannerId);
  return url.toString();
}

export function resolvePlannerId() {
  if (typeof window === "undefined") return "";

  const fromUrl = new URL(window.location.href).searchParams.get(URL_PARAM);
  if (fromUrl) {
    localStorage.setItem(PLANNER_ID_KEY, fromUrl);
    return fromUrl;
  }

  const stored = localStorage.getItem(PLANNER_ID_KEY);
  if (stored) {
    window.history.replaceState(null, "", buildRestoreLink(stored));
    return stored;
  }

  const created = crypto.randomUUID();
  localStorage.setItem(PLANNER_ID_KEY, created);
  window.history.replaceState(null, "", buildRestoreLink(created));
  return created;
}
