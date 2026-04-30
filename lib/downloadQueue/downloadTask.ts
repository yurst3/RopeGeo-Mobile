import * as FileSystem from "expo-file-system/legacy";
import { offlineManager } from "@rnmapbox/maps";
import {
  ImageVersion,
  ImageVersions,
  MapDataTileKeysResults,
  MiniMapType,
  PageViewType,
  PaginationResults,
  Result,
  RouteGeoJsonFeature,
  RoutesGeojson,
  SavedPage,
  type OfflineCenteredRegionMiniMap,
  type OfflinePageMiniMap,
  type OnlineCenteredRegionMiniMap,
  type OnlinePageMiniMap,
  type OfflinePageView,
  type OfflinePagePreview,
  type OnlinePagePreview,
  type OnlinePageView,
} from "ropegeo-common/models";
import { Method, SERVICE_BASE_URL, Service } from "ropegeo-common/components";
import {
  isAbortError,
  mergeParentSignalWithDeadline,
  NETWORK_REQUEST_TIMED_OUT_MESSAGE,
} from "ropegeo-common/helpers/network";
import {
  DownloadCancelledError,
  isDownloadCancelledError,
} from "@/lib/downloadQueue/downloadCancelled";
import { deleteOfflineBundleFiles } from "@/lib/offline/deleteOfflineBundle";
import { setDownloadedRoutePreviewsForPage } from "@/lib/offline/downloadedRoutePreviewsStorage";
import { NO_NETWORK_MESSAGE } from "@/lib/network/messages";
import { REQUEST_TIMEOUT_SECONDS } from "@/lib/network/requestTimeout";
import {
  getOfflineMapDataRootUri,
  getOfflinePageJsonUri,
  getOfflinePageRootUri,
  getOfflineRegionRoutesGeojsonUri,
} from "@/lib/offline/paths";
import { mapboxPackName } from "@/lib/downloadQueue/util/downloadUtils";
import { ensureParentDir, extFromUrl } from "@/lib/downloadQueue/util/downloadUtils";
import { fetchMapDataTileKeys } from "@/lib/downloadQueue/util/fetchMapDataTileKeys";
import { relativePathFromTileUrl } from "@/lib/offline/tileUrlPaths";
import {
  DownloadPhase,
  PHASE_TITLE,
  type ActiveDownloadPhase,
  type DownloadProgressPayload,
} from "@/lib/downloadQueue/downloadPhase";

export {
  DownloadPhase,
  PHASE_TITLE,
  type ActiveDownloadPhase,
  type DownloadProgressPayload,
} from "@/lib/downloadQueue/downloadPhase";

export type DownloadTaskState =
  | "queued"
  | "running"
  | "success"
  | "error"
  | "cancelled";

export type DownloadTaskSnapshot = {
  pageId: string;
  phase: DownloadPhase;
  phaseTitle: string;
  phaseProgress: number;
  /** 1-based step in the visible plan; 0 while queued before the first progress tick. */
  displayStep: number;
  /** Total visible steps; 0 while queued. */
  displayTotal: number;
  state: DownloadTaskState;
  errorMessage: string | null;
};

const WEB_BASE = SERVICE_BASE_URL[Service.WEBSCRAPER];
const TILE_DOWNLOAD_BATCH_SIZE = 25;
const TILE_DOWNLOAD_PAGE_LIMIT = 100;

type MiniMapCapableOnlinePageView = OnlinePageView & {
  miniMap: OnlinePageMiniMap | OnlineCenteredRegionMiniMap | null;
};

type ImageDownloadSource = {
  bannerUrl: string | null;
  fullUrl: string | null;
};

/**
 * Sequential offline download task: page JSON → images → Mapbox pack → RopeGeo `.pbf` tiles.
 * Tracks current phase and reports phase progress through the provided callback.
 */
export class DownloadTask {
  readonly pageId: string;
  readonly pageViewType: PageViewType;

  phase: DownloadPhase = DownloadPhase.Queued;

  phaseProgress = 0;

  state: DownloadTaskState = "queued";

  errorMessage: string | null = null;

  /** Phases shown in UI for the current run (set when download starts / after page JSON). */
  displayPlan: DownloadPhase[] = [];

  displayStep = 0;

  displayTotal = 0;

  private readonly pageRoot: string;

  private readonly onProgressCallback: (p: DownloadProgressPayload) => void;

  private readonly abortController = new AbortController();

  constructor(
    pageId: string,
    pageViewType: PageViewType,
    onProgress: (p: DownloadProgressPayload) => void,
  ) {
    this.pageId = pageId;
    this.pageViewType = pageViewType;
    this.pageRoot = getOfflinePageRootUri(pageId);
    this.onProgressCallback = (p) => {
      this.phase = p.phase;
      this.phaseProgress = p.phaseProgress;
      this.displayStep = p.displayStep;
      this.displayTotal = p.displayTotal;
      this.state = "running";
      this.errorMessage = null;
      onProgress(p);
    };
  }

  /** Aborts in-flight `fetch` work wired to this task’s signal; {@link DownloadQueue} removes the task from its maps. */
  abort(): void {
    this.abortController.abort();
  }

  getSnapshot(): DownloadTaskSnapshot {
    return {
      pageId: this.pageId,
      phase: this.phase,
      phaseTitle: PHASE_TITLE[this.phase],
      phaseProgress: this.phaseProgress,
      displayStep: this.displayStep,
      displayTotal: this.displayTotal,
      state: this.state,
      errorMessage: this.errorMessage,
    };
  }

  /** User-visible steps: page → optional images → optional mapbox (if any minimap) → tiles XOR region. */
  static buildDisplayPlanForView(view: OnlinePageView): DownloadPhase[] {
    const plan: DownloadPhase[] = [DownloadPhase.DownloadPage];
    if (view.getImageIdsToDownload().length > 0) {
      plan.push(DownloadPhase.DownloadImages);
    }
    const capable = DownloadTask.miniMapCapableViewOrNull(view);
    const mm = capable?.miniMap ?? null;
    if (mm != null) {
      plan.push(DownloadPhase.DownloadMapbox);
      if (mm.miniMapType === MiniMapType.Page && mm.fetchType === "online") {
        plan.push(DownloadPhase.DownloadTiles);
      } else if (
        mm.miniMapType === MiniMapType.CenteredRegion &&
        mm.fetchType === "online"
      ) {
        plan.push(DownloadPhase.DownloadRegion);
      }
    }
    return plan;
  }

  private static miniMapCapableViewOrNull(
    view: OnlinePageView,
  ): MiniMapCapableOnlinePageView | null {
    if (!("miniMap" in view)) {
      return null;
    }
    return view as MiniMapCapableOnlinePageView;
  }

  async run(savedPage: SavedPage, displayPlan: DownloadPhase[]): Promise<SavedPage> {
    try {
      this.displayPlan = [...displayPlan];
      this.displayStep = 0;
      this.displayTotal = this.displayPlan.length;
      await deleteOfflineBundleFiles(this.pageId);
      if (this.abortController.signal.aborted) {
        this.state = "cancelled";
        this.errorMessage = null;
        throw new DownloadCancelledError();
      }

      const view = await this.downloadPageJson();

      const downloadedImages = this.displayPlan.includes(DownloadPhase.DownloadImages)
        ? await this.downloadImages(view)
        : {};

      if (this.displayPlan.includes(DownloadPhase.DownloadMapbox)) {
        await this.downloadMapboxPack(view);
      }

      let offlineMiniMap: OfflinePageMiniMap | OfflineCenteredRegionMiniMap | null = null;
      if (this.displayPlan.includes(DownloadPhase.DownloadTiles)) {
        offlineMiniMap = await this.downloadTrailTiles(view);
      } else if (this.displayPlan.includes(DownloadPhase.DownloadRegion)) {
        offlineMiniMap = await this.downloadRegionRoutes(view);
      }

      if (this.getMiniMapCapableView(view)?.miniMap != null && offlineMiniMap == null) {
        throw new Error("Missing downloaded minimap for offline page save");
      }

      const offlineView = view.toOffline(downloadedImages, offlineMiniMap);
      const pageJsonUri = await this.saveOfflinePageJson(offlineView);
      const preview = offlineView.toPagePreview() as OfflinePagePreview;
      const finalSaved = new SavedPage(preview, savedPage.savedAt, pageJsonUri);
      await setDownloadedRoutePreviewsForPage(this.pageId, [preview]);

      this.phase = DownloadPhase.Complete;
      this.phaseProgress = 1;
      this.displayStep = this.displayPlan.length > 0 ? this.displayPlan.length : 1;
      this.displayTotal = this.displayPlan.length > 0 ? this.displayPlan.length : 1;
      this.state = "success";
      this.errorMessage = null;
      return finalSaved;
    } catch (e) {
      await deleteOfflineBundleFiles(this.pageId);
      if (isDownloadCancelledError(e)) {
        this.state = "cancelled";
        this.errorMessage = null;
      } else {
        this.state = "error";
        this.errorMessage = e instanceof Error ? e.message : String(e);
      }
      throw e;
    }
  }

  private async fetchWithDeadline(url: string, init: RequestInit): Promise<Response> {
    const outer = this.abortController.signal;
    const merged = mergeParentSignalWithDeadline(
      outer,
      REQUEST_TIMEOUT_SECONDS * 1000,
    );
    try {
      return await fetch(url, { ...init, signal: merged.signal });
    } catch (e) {
      if (merged.consumeDidTimeout()) {
        throw new Error(NETWORK_REQUEST_TIMED_OUT_MESSAGE);
      }
      if (isAbortError(e)) {
        if (this.abortController.signal.aborted) {
          throw new DownloadCancelledError();
        }
        throw new Error(NO_NETWORK_MESSAGE);
      }
      throw e;
    } finally {
      merged.dispose();
    }
  }

  /** Emits progress only for phases in {@link displayPlan} (not delete/save). */
  private reportDisplayed(phase: ActiveDownloadPhase, phaseProgress: number): void {
    if (!this.displayPlan.includes(phase)) {
      return;
    }
    const displayStep = this.displayPlan.indexOf(phase) + 1;
    const displayTotal = this.displayPlan.length;
    this.onProgressCallback({
      phase,
      phaseProgress,
      displayStep,
      displayTotal,
    });
  }

  private async downloadPageJson(): Promise<OnlinePageView> {
    const pageUrl = `${WEB_BASE}/${encodeURIComponent(this.pageViewType)}/page/${encodeURIComponent(this.pageId)}`;
    if (this.displayPlan.length === 0) {
      this.displayPlan = [DownloadPhase.DownloadPage];
    }
    this.reportDisplayed(DownloadPhase.DownloadPage, 0);
    const res = await this.fetchWithDeadline(pageUrl, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Page request failed: HTTP ${res.status}`);
    }
    const pageText = await res.text();
    const wrapped = Result.fromResponseBody(JSON.parse(pageText) as unknown);
    const view = wrapped.result as OnlinePageView;
    if (view.pageViewType !== this.pageViewType) {
      throw new Error(
        `Expected pageViewType ${this.pageViewType} but received ${view.pageViewType}`,
      );
    }
    this.reportDisplayed(DownloadPhase.DownloadPage, 0.8);
    this.reportDisplayed(DownloadPhase.DownloadPage, 1);
    return view;
  }

  private async saveOfflinePageJson(view: OfflinePageView): Promise<string> {
    const pageJsonUri = getOfflinePageJsonUri(this.pageId);
    await ensureParentDir(pageJsonUri);
    await FileSystem.writeAsStringAsync(pageJsonUri, JSON.stringify(view));
    return pageJsonUri;
  }

  private async downloadImages(
    view: OnlinePageView,
  ): Promise<Record<string, ImageVersions>> {
    const downloads = view.getImageIdsToDownload();
    const imageSourceById = this.getImageSourceById(view);
    this.reportDisplayed(DownloadPhase.DownloadImages, 0);
    if (downloads.length === 0) {
      this.reportDisplayed(DownloadPhase.DownloadImages, 1);
      return {};
    }

    const out: Record<string, ImageVersions> = {};
    let completed = 0;
    for (const [id] of downloads) {
      const versions: Partial<Record<ImageVersion, string | null>> = {};
      for (const slot of [
        ImageVersion.preview,
        ImageVersion.banner,
        ImageVersion.full,
      ]) {
        const imageSource = imageSourceById[id] ?? null;
        const url =
          imageSource == null
            ? `${WEB_BASE}/images/${encodeURIComponent(id)}/${slot}.avif`
            : slot === ImageVersion.full
              ? imageSource.fullUrl
              : imageSource.bannerUrl;
        if (url == null) {
          versions[slot] = null;
          continue;
        }
        const dest = `${this.pageRoot}images/${id}-${slot}${extFromUrl(url)}`;
        await ensureParentDir(dest);
        const result = await FileSystem.downloadAsync(url, dest);
        if (result.status >= 400) {
          try {
            await FileSystem.deleteAsync(dest, { idempotent: true });
          } catch {
            // ignore cleanup failure
          }
          versions[slot] = null;
          continue;
        }
        versions[slot] = result.uri;
      }
      out[id] = new ImageVersions({
        [ImageVersion.preview]: versions[ImageVersion.preview] ?? null,
        [ImageVersion.banner]: versions[ImageVersion.banner] ?? null,
        [ImageVersion.full]: versions[ImageVersion.full] ?? null,
      });
      completed += 1;
      this.reportDisplayed(
        DownloadPhase.DownloadImages,
        Math.min(1, completed / downloads.length),
      );
    }
    this.reportDisplayed(DownloadPhase.DownloadImages, 1);
    return out;
  }

  private getImageSourceById(view: OnlinePageView): Record<string, ImageDownloadSource> {
    const out: Record<string, ImageDownloadSource> = {};
    const add = (image: unknown) => {
      if (image == null || typeof image !== "object") return;
      const candidate = image as {
        id?: unknown;
        fetchType?: unknown;
        bannerUrl?: unknown;
        fullUrl?: unknown;
      };
      if (
        typeof candidate.id !== "string" ||
        candidate.fetchType !== "online"
      ) {
        return;
      }
      out[candidate.id] = {
        bannerUrl: typeof candidate.bannerUrl === "string" ? candidate.bannerUrl : null,
        fullUrl: typeof candidate.fullUrl === "string" ? candidate.fullUrl : null,
      };
    };

    const maybeWithImages = view as {
      bannerImage?: unknown;
      betaSections?: Array<{ images?: unknown[] }>;
    };
    add(maybeWithImages.bannerImage);
    if (Array.isArray(maybeWithImages.betaSections)) {
      for (const section of maybeWithImages.betaSections) {
        if (!Array.isArray(section?.images)) continue;
        for (const image of section.images) {
          add(image);
        }
      }
    }
    return out;
  }

  private getOnlineTilesMiniMap(
    view: OnlinePageView,
  ): OnlinePageMiniMap | null {
    const miniMapCapable = this.getMiniMapCapableView(view);
    if (miniMapCapable == null) {
      return null;
    }
    const miniMap = miniMapCapable.miniMap;
    if (
      miniMap == null ||
      miniMap.miniMapType !== MiniMapType.Page ||
      miniMap.fetchType !== "online"
    ) {
      return null;
    }
    return miniMap as OnlinePageMiniMap;
  }

  private async downloadMapboxPack(view: OnlinePageView): Promise<void> {
    const miniMap = this.getOnlineTilesMiniMap(view);
    if (miniMap == null) {
      this.reportDisplayed(DownloadPhase.DownloadMapbox, 1);
      return;
    }

    const packName = mapboxPackName(this.pageId);
    const bounds = miniMap.bounds;
    this.reportDisplayed(DownloadPhase.DownloadMapbox, 0);
    try {
      await offlineManager.deletePack(packName);
    } catch {
      // pack may not exist
    }

    await new Promise<void>((resolve, reject) => {
      let done = false;
      offlineManager
        .createPack(
          {
            name: packName,
            styleURL: "mapbox://styles/mapbox/outdoors-v12",
            bounds: [
              [bounds.east, bounds.north],
              [bounds.west, bounds.south],
            ],
            minZoom: 10,
            maxZoom: 20,
          },
          (_pack, status) => {
            this.reportDisplayed(
              DownloadPhase.DownloadMapbox,
              Math.min(1, status.percentage / 100),
            );
            if (status.percentage >= 100 && !done) {
              done = true;
              try {
                offlineManager.unsubscribe(packName);
              } catch {
                // ignore
              }
              resolve();
            }
          },
          (_pack, err) => {
            if (!done) {
              done = true;
              reject(new Error(err.message));
            }
          },
        )
        .catch((e) => {
          if (!done) {
            done = true;
            reject(e instanceof Error ? e : new Error(String(e)));
          }
        });
    });
    this.reportDisplayed(DownloadPhase.DownloadMapbox, 1);
  }

  private async downloadTrailTiles(view: OnlinePageView): Promise<OfflinePageMiniMap | null> {
    const miniMap = this.getOnlineTilesMiniMap(view);
    if (miniMap == null) {
      this.reportDisplayed(DownloadPhase.DownloadTiles, 1);
      return null;
    }

    const mapRoot = getOfflineMapDataRootUri(this.pageId);
    await FileSystem.makeDirectoryAsync(mapRoot, { intermediates: true });
    this.reportDisplayed(DownloadPhase.DownloadTiles, 0);

    let page = 1;
    let totalBytesForTiles = 1;
    let bytesDone = 0;
    for (;;) {
      const parsed = await fetchMapDataTileKeys<MapDataTileKeysResults>(
        miniMap.layerId,
        page,
        TILE_DOWNLOAD_PAGE_LIMIT,
        this.abortController.signal,
      );
      if (page === 1) {
        totalBytesForTiles = Math.max(parsed.totalBytes, 1);
      }
      if (parsed.results.length === 0) {
        break;
      }
      for (let i = 0; i < parsed.results.length; i += TILE_DOWNLOAD_BATCH_SIZE) {
        const batch = parsed.results.slice(i, i + TILE_DOWNLOAD_BATCH_SIZE);
        await Promise.all(
          batch.map(async (tileUrl) => {
            const relPath = relativePathFromTileUrl(tileUrl);
            const dest = `${mapRoot}${relPath}`;
            await ensureParentDir(dest);
            await FileSystem.downloadAsync(tileUrl, dest);
            const info = await FileSystem.getInfoAsync(dest);
            if (info.exists && typeof info.size === "number") {
              bytesDone += info.size;
            }
            this.reportDisplayed(
              DownloadPhase.DownloadTiles,
              Math.min(1, bytesDone / totalBytesForTiles),
            );
          }),
        );
      }
      if (
        parsed.results.length < TILE_DOWNLOAD_PAGE_LIMIT ||
        page * TILE_DOWNLOAD_PAGE_LIMIT >= parsed.total
      ) {
        break;
      }
      page += 1;
    }

    this.reportDisplayed(DownloadPhase.DownloadTiles, 1);
    const base = mapRoot.endsWith("/") ? mapRoot : `${mapRoot}/`;
    const offlineMiniMap = miniMap.toOffline(`${base}tiles/${miniMap.layerId}/{z}/{x}/{y}.pbf`);
    return offlineMiniMap;
  }

  private getOnlineCenteredMiniMap(
    view: OnlinePageView,
  ): OnlineCenteredRegionMiniMap | null {
    const miniMapCapable = this.getMiniMapCapableView(view);
    if (miniMapCapable == null) {
      return null;
    }
    const miniMap = miniMapCapable.miniMap;
    if (
      miniMap == null ||
      miniMap.miniMapType !== MiniMapType.CenteredRegion ||
      miniMap.fetchType !== "online"
    ) {
      return null;
    }
    return miniMap as OnlineCenteredRegionMiniMap;
  }

  private getMiniMapCapableView(view: OnlinePageView): MiniMapCapableOnlinePageView | null {
    if (!("miniMap" in view)) {
      return null;
    }
    return view as MiniMapCapableOnlinePageView;
  }

  private getResponseBody(raw: unknown): unknown {
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

  private async downloadRegionRoutes(
    view: OnlinePageView,
  ): Promise<OfflineCenteredRegionMiniMap | null> {
    const miniMap = this.getOnlineCenteredMiniMap(view);
    if (miniMap == null) {
      this.reportDisplayed(DownloadPhase.DownloadRegion, 1);
      return null;
    }
    const region = miniMap.routesParams.region;
    if (region == null) {
      throw new Error("CenteredRegionMiniMap.routesParams.region is required");
    }
    const dest = getOfflineRegionRoutesGeojsonUri(this.pageId, region.id);
    const existing = await FileSystem.getInfoAsync(dest);
    if (existing.exists) {
      this.reportDisplayed(DownloadPhase.DownloadRegion, 1);
      return miniMap.toOffline(dest);
    }

    await ensureParentDir(dest);
    const limit = miniMap.routesParams.limit;
    const fetchPage = async (pageNum: number): Promise<PaginationResults> => {
      const params = miniMap.routesParams.withPage(pageNum);
      const queryString = params.toQueryString();
      const fullPath = queryString ? `/routes?${queryString}` : "/routes";
      const url = new URL(fullPath, WEB_BASE).toString();
      const res = await this.fetchWithDeadline(url, {
        method: Method.GET,
        headers: { "Content-Type": "application/json" },
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }
      if (text.length === 0) {
        throw new Error("Empty response body");
      }
      const raw = JSON.parse(text) as unknown;
      return PaginationResults.fromResponseBody(this.getResponseBody(raw));
    };

    const pagesByNum = new Map<number, PaginationResults>();
    const first = await fetchPage(1);
    pagesByNum.set(1, first);
    const totalCount = first.total;
    const sumReceived = (): number => {
      let sum = 0;
      for (const page of pagesByNum.values()) {
        sum += page.results.length;
      }
      return sum;
    };
    this.reportDisplayed(
      DownloadPhase.DownloadRegion,
      Math.min(1, first.results.length / Math.max(totalCount, 1)),
    );

    const doneByTotal = first.results.length >= totalCount;
    const doneByShortPage = first.results.length < limit;
    if (!doneByTotal && !doneByShortPage) {
      const batchSize = 10;
      const lastPage = Math.max(1, Math.ceil(totalCount / limit));
      const toFetch: number[] = [];
      for (let p = 2; p <= lastPage; p++) {
        toFetch.push(p);
      }
      for (let i = 0; i < toFetch.length; i += batchSize) {
        if (sumReceived() >= totalCount) {
          break;
        }
        const chunk = toFetch.slice(i, i + batchSize);
        await Promise.all(
          chunk.map(async (pageNum) => {
            const parsed = await fetchPage(pageNum);
            pagesByNum.set(pageNum, parsed);
          }),
        );
        this.reportDisplayed(
          DownloadPhase.DownloadRegion,
          Math.min(1, sumReceived() / Math.max(totalCount, 1)),
        );
      }
    }

    const keys = [...pagesByNum.keys()].sort((a, b) => a - b);
    const features: RouteGeoJsonFeature[] = [];
    for (const key of keys) {
      const page = pagesByNum.get(key);
      if (page != null) {
        features.push(...(page.results as RouteGeoJsonFeature[]));
      }
    }
    const geojson = new RoutesGeojson(features);
    await FileSystem.writeAsStringAsync(
      dest,
      JSON.stringify({ type: geojson.type, features: geojson.features }),
    );
    this.reportDisplayed(DownloadPhase.DownloadRegion, 1);
    return miniMap.toOffline(dest);
  }
}
