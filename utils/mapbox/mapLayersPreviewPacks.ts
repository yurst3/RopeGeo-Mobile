import {
  MAP_LAYERS_PREVIEW_CENTER,
  MAP_LAYERS_PREVIEW_ZOOM,
  MAPBOX_STYLE_URLS,
} from "@/constants/mapbox";
import { MAP_BASEMAPS, type MapBasemap } from "@/constants/settings/mapLayersTypes";
import { MAPBOX_WORLD_SIZE } from "@/utils/minimap/zoomForBounds";
import { offlineManager } from "@rnmapbox/maps";

const PACK_NAME_PREFIX = "ropegeo-map-layers-preview-";

/**
 * CSS-pixel viewport the offline region must cover. Larger than any phone or
 * tablet thumbnail so the preview camera's tiles are inside the pack.
 */
const PACK_VIEWPORT_PX = 1024;

const PACK_DOWNLOAD_TIMEOUT_MS = 90_000;

/** Northeast, then southwest, as `[lng, lat]` — the order `createPack` expects. */
export function mapLayersPreviewPackBounds(): [[number, number], [number, number]] {
  const [lng, lat] = MAP_LAYERS_PREVIEW_CENTER;
  const worldPx = MAPBOX_WORLD_SIZE * 2 ** MAP_LAYERS_PREVIEW_ZOOM;
  const halfPx = PACK_VIEWPORT_PX / 2;
  const lngHalf = (halfPx / worldPx) * 360;
  const latHalf = lngHalf * Math.cos((lat * Math.PI) / 180);
  return [
    [lng + lngHalf, lat + latHalf],
    [lng - lngHalf, lat - latHalf],
  ];
}

export function mapLayersPreviewPackName(basemap: MapBasemap): string {
  const styleId = MAPBOX_STYLE_URLS[basemap].split("/").pop() ?? "style";
  const safeStyleId = styleId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${PACK_NAME_PREFIX}${basemap}-${safeStyleId}`;
}

function isPackComplete(percentage: number | undefined): boolean {
  return typeof percentage === "number" && percentage >= 100;
}

export async function isMapLayersPreviewPackReady(basemap: MapBasemap): Promise<boolean> {
  try {
    const pack = await offlineManager.getPack(mapLayersPreviewPackName(basemap));
    if (pack == null) return false;
    const status = await pack.status();
    return isPackComplete(status.percentage);
  } catch {
    return false;
  }
}

function finishPackWait(name: string, finish: () => void): void {
  offlineManager.unsubscribe(name);
  finish();
}

function waitForExistingPack(name: string): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      finishPackWait(name, resolve);
    };
    const timer = setTimeout(finish, PACK_DOWNLOAD_TIMEOUT_MS);
    void offlineManager
      .subscribe(
        name,
        (_pack, status) => {
          if (isPackComplete(status.percentage)) finish();
        },
        () => finish(),
      )
      .then(async () => {
        const pack = await offlineManager.getPack(name);
        if (pack == null) {
          finish();
          return;
        }
        await pack.resume();
        const status = await pack.status();
        if (isPackComplete(status.percentage)) finish();
      })
      .catch(() => finish());
  });
}

function createPreviewPack(basemap: MapBasemap): Promise<void> {
  const name = mapLayersPreviewPackName(basemap);
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      finishPackWait(name, resolve);
    };
    const timer = setTimeout(finish, PACK_DOWNLOAD_TIMEOUT_MS);
    void offlineManager
      .createPack(
        {
          name,
          styleURL: MAPBOX_STYLE_URLS[basemap],
          bounds: mapLayersPreviewPackBounds(),
          minZoom: MAP_LAYERS_PREVIEW_ZOOM,
          maxZoom: MAP_LAYERS_PREVIEW_ZOOM,
        },
        (_pack, status) => {
          if (isPackComplete(status.percentage)) finish();
        },
        () => finish(),
      )
      .catch(() => finish());
  });
}

async function deleteStalePreviewPacks(currentNames: ReadonlySet<string>): Promise<void> {
  const packs = await offlineManager.getPacks();
  for (const pack of packs) {
    const name = pack.name;
    if (typeof name !== "string" || !name.startsWith(PACK_NAME_PREFIX)) continue;
    if (currentNames.has(name)) continue;
    try {
      await offlineManager.deletePack(name);
    } catch {
      // Stale packs are unused; leaving one behind is harmless.
    }
  }
}

async function ensureOne(basemap: MapBasemap): Promise<void> {
  const name = mapLayersPreviewPackName(basemap);
  const existing = await offlineManager.getPack(name);
  if (existing != null) {
    const status = await existing.status();
    if (isPackComplete(status.percentage)) return;
    await waitForExistingPack(name);
    return;
  }
  await createPreviewPack(basemap);
}

let inFlight: Promise<void> | null = null;

/** Downloads both basemap preview regions once. Later calls no-op when the packs are complete. */
export function ensureMapLayersPreviewPacks(): Promise<void> {
  if (inFlight != null) return inFlight;
  inFlight = (async () => {
    const names = new Set(MAP_BASEMAPS.map((basemap) => mapLayersPreviewPackName(basemap)));
    try {
      await deleteStalePreviewPacks(names);
    } catch {
      // Pack listing can fail before the SDK is ready; the download attempt still proceeds.
    }
    for (const basemap of MAP_BASEMAPS) {
      try {
        await ensureOne(basemap);
      } catch {
        // Preview packs are optional. A failure just leaves the offline fallback in the sheet.
      }
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
