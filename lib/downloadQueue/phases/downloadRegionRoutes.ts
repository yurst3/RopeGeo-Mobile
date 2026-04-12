import * as FileSystem from "expo-file-system/legacy";
import {
  CenteredRegionMiniMap,
  DownloadedCenteredRegionMiniMap,
  MiniMapType,
  PaginationResults,
  RouteGeoJsonFeature,
  RoutesGeojson,
  type RopewikiPageView,
} from "ropegeo-common/models";
import { Method, Service, SERVICE_BASE_URL } from "ropegeo-common/components";
import { ensureParentDir } from "@/lib/downloadQueue/util/downloadUtils";
import type { DownloadContext } from "@/lib/downloadQueue/downloadTask";
import { getOfflineRegionRoutesGeojsonUri } from "@/lib/offline/paths";
import { DownloadPhase } from "@/lib/downloadQueue/downloadPhase";

function getResponseBody(raw: unknown): unknown {
  if (
    raw != null &&
    typeof raw === "object" &&
    "data" in raw &&
    (raw as { data: unknown }).data != null
  ) {
    return (raw as { data: unknown }).data;
  }
  return raw;
}

function sumReceived(pagesByNum: Map<number, PaginationResults>): number {
  let sum = 0;
  for (const p of pagesByNum.values()) {
    sum += p.results.length;
  }
  return sum;
}

function concatPaginationSorted(pagesByNum: Map<number, PaginationResults>): RouteGeoJsonFeature[] {
  const keys = [...pagesByNum.keys()].sort((a, b) => a - b);
  const out: RouteGeoJsonFeature[] = [];
  for (const k of keys) {
    const p = pagesByNum.get(k);
    if (p != null) out.push(...(p.results as RouteGeoJsonFeature[]));
  }
  return out;
}

function getCenteredMiniMap(view: RopewikiPageView): CenteredRegionMiniMap | null {
  const m = view.miniMap;
  if (m == null || m.miniMapType !== MiniMapType.CenteredGeojson) return null;
  return m as CenteredRegionMiniMap;
}

/**
 * Fetches all GET /routes pages for the centered minimap scope and writes a FeatureCollection
 * next to the offline bundle, unless the file already exists.
 */
export async function downloadRegionRoutes(
  ctx: DownloadContext,
  view: RopewikiPageView,
): Promise<DownloadedCenteredRegionMiniMap | null> {
  const mm = getCenteredMiniMap(view);
  if (mm == null) {
    ctx.onProgress({ phase: DownloadPhase.DownloadRegion, phaseProgress: 1 });
    return null;
  }

  const reg = mm.routesParams.region;
  if (reg == null) {
    throw new Error("CenteredRegionMiniMap.routesParams.region is required");
  }

  const regionId = reg.id;
  const dest = getOfflineRegionRoutesGeojsonUri(ctx.pageId, regionId);
  const existing = await FileSystem.getInfoAsync(dest);
  if (existing.exists) {
    ctx.onProgress({ phase: DownloadPhase.DownloadRegion, phaseProgress: 1 });
    return new DownloadedCenteredRegionMiniMap(dest, mm.centeredRouteId, mm.title);
  }

  await ensureParentDir(dest);

  const baseUrl = SERVICE_BASE_URL[Service.WEBSCRAPER];
  const queryParams = mm.routesParams;
  const limit = queryParams.limit;
  const baseInit: RequestInit = {
    method: Method.GET,
    headers: { "Content-Type": "application/json" },
  };

  const fetchPage = async (pageNum: number): Promise<PaginationResults> => {
    const params = queryParams.withPage(pageNum);
    const queryString = params.toQueryString();
    const fullPath = queryString ? `/routes?${queryString}` : "/routes";
    const url = new URL(fullPath, baseUrl).toString();
    const res = await fetch(url, baseInit);
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    if (text.length === 0) {
      throw new Error("Empty response body");
    }
    const raw = JSON.parse(text) as unknown;
    return PaginationResults.fromResponseBody(getResponseBody(raw));
  };

  const pagesByNum = new Map<number, PaginationResults>();
  const first = await fetchPage(1);
  pagesByNum.set(1, first);
  const totalCount = first.total;
  let receivedCount = first.results.length;
  ctx.onProgress({
    phase: DownloadPhase.DownloadRegion,
    phaseProgress: Math.min(1, receivedCount / Math.max(totalCount, 1)),
  });

  const doneByTotal = receivedCount >= totalCount;
  const doneByShortPage = first.results.length < limit;
  const batchSize = 10;

  if (!doneByTotal && !doneByShortPage) {
    const lastPage = Math.max(1, Math.ceil(totalCount / limit));
    const toFetch: number[] = [];
    for (let p = 2; p <= lastPage; p++) {
      toFetch.push(p);
    }

    for (let i = 0; i < toFetch.length; i += batchSize) {
      if (sumReceived(pagesByNum) >= totalCount) break;
      const chunk = toFetch.slice(i, i + batchSize);
      await Promise.all(
        chunk.map(async (pageNum) => {
          const parsed = await fetchPage(pageNum);
          pagesByNum.set(pageNum, parsed);
        }),
      );
      receivedCount = sumReceived(pagesByNum);
      ctx.onProgress({
        phase: DownloadPhase.DownloadRegion,
        phaseProgress: Math.min(1, receivedCount / Math.max(totalCount, 1)),
      });
      if (sumReceived(pagesByNum) >= totalCount) break;
    }
  }

  const features = concatPaginationSorted(pagesByNum);
  const geojson = new RoutesGeojson(features);
  await FileSystem.writeAsStringAsync(
    dest,
    JSON.stringify({ type: geojson.type, features: geojson.features }),
  );

  ctx.onProgress({ phase: DownloadPhase.DownloadRegion, phaseProgress: 1 });
  return new DownloadedCenteredRegionMiniMap(dest, mm.centeredRouteId, mm.title);
}
