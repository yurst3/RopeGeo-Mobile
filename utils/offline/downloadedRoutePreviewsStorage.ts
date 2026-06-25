import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DOWNLOADED_ROUTE_PREVIEWS_STORAGE_KEY,
  type DownloadedRoutePreviewsStorageMap,
} from "ropegeo-common/models";
import {
  OfflinePagePreview,
  PagePreview,
} from "ropegeo-common/models";

function previewToStorable(preview: OfflinePagePreview): unknown {
  return JSON.parse(JSON.stringify(preview)) as unknown;
}

async function loadRaw(): Promise<DownloadedRoutePreviewsStorageMap> {
  const raw = await AsyncStorage.getItem(DOWNLOADED_ROUTE_PREVIEWS_STORAGE_KEY);
  if (raw == null || raw === "") return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return {};
  }
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }
  return parsed as DownloadedRoutePreviewsStorageMap;
}

async function persist(map: DownloadedRoutePreviewsStorageMap): Promise<void> {
  await AsyncStorage.setItem(
    DOWNLOADED_ROUTE_PREVIEWS_STORAGE_KEY,
    JSON.stringify(map),
  );
}

/**
 * After a successful offline page download, store previews for route lookup (e.g. RoutePreview offline).
 */
export async function setDownloadedRoutePreviewsForPage(
  routeId: string,
  previews: OfflinePagePreview[],
): Promise<void> {
  const filtered = previews.filter((p) => p != null);
  if (filtered.length === 0) {
    await removeDownloadedRoutePreviewsForPage(routeId);
    return;
  }
  const map = await loadRaw();
  map[routeId] = filtered.map((p) => previewToStorable(p));
  await persist(map);
}

export async function removeDownloadedRoutePreviewsForPage(
  routeId: string,
): Promise<void> {
  const map = await loadRaw();
  if (!(routeId in map)) return;
  delete map[routeId];
  await persist(map);
}

export async function loadDownloadedRoutePreviewsForPage(
  routeId: string,
): Promise<OfflinePagePreview[]> {
  const map = await loadRaw();
  const rows = map[routeId];
  if (rows == null || !Array.isArray(rows) || rows.length === 0) {
    return [];
  }
  const out: OfflinePagePreview[] = [];
  for (const row of rows) {
    try {
      out.push(PagePreview.fromResult(row) as OfflinePagePreview);
    } catch {
      /* skip invalid row */
    }
  }
  return out;
}
