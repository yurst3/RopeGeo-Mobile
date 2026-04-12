import type {
  DownloadedCenteredRegionMiniMap,
  DownloadedPageMiniMap,
  ImageVersions,
  RopewikiPageView,
} from "ropegeo-common/models";
import { deleteOfflineBundleFiles } from "@/lib/offline/deleteOfflineBundle";
import { getOfflinePageRootUri } from "@/lib/offline/paths";
import { downloadPageJson } from "@/lib/downloadQueue/phases/downloadPageJson";
import { downloadImages } from "@/lib/downloadQueue/phases/downloadImages";
import { downloadMapboxPack } from "@/lib/downloadQueue/phases/downloadMapboxPack";
import { downloadTrailTiles } from "@/lib/downloadQueue/phases/downloadTrailTiles";
import { downloadRegionRoutes } from "@/lib/downloadQueue/phases/downloadRegionRoutes";
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

export type DownloadTaskState = "queued" | "running" | "success" | "error";

export type DownloadTaskSnapshot = {
  pageId: string;
  apiPageId: string;
  phase: DownloadPhase;
  phaseTitle: string;
  phaseProgress: number;
  state: DownloadTaskState;
  errorMessage: string | null;
};

export type DownloadContext = {
  pageId: string;
  apiPageId: string;
  pageRoot: string;
  onProgress: (p: DownloadProgressPayload) => void;
};

export type DownloadTaskResult = {
  downloadedPageView: string;
  downloadedImages: Record<string, ImageVersions>;
  downloadedMiniMap: DownloadedPageMiniMap | DownloadedCenteredRegionMiniMap | null;
};

/**
 * Sequential offline download task: page JSON → images → Mapbox pack → RopeGeo `.pbf` tiles.
 * Tracks current phase and reports phase progress through the provided callback.
 */
export class DownloadTask {
  readonly pageId: string;

  readonly apiPageId: string;

  phase: DownloadPhase = DownloadPhase.Queued;

  phaseProgress = 0;

  state: DownloadTaskState = "queued";

  errorMessage: string | null = null;

  private readonly ctx: DownloadContext;

  constructor(
    pageId: string,
    apiPageId: string,
    onProgress: (p: DownloadProgressPayload) => void,
  ) {
    this.pageId = pageId;
    this.apiPageId = apiPageId;
    this.ctx = {
      pageId,
      apiPageId,
      pageRoot: getOfflinePageRootUri(pageId),
      onProgress: (p) => {
        this.phase = p.phase;
        this.phaseProgress = p.phaseProgress;
        this.state = "running";
        this.errorMessage = null;
        onProgress(p);
      },
    };
  }

  getSnapshot(): DownloadTaskSnapshot {
    return {
      pageId: this.pageId,
      apiPageId: this.apiPageId,
      phase: this.phase,
      phaseTitle: PHASE_TITLE[this.phase],
      phaseProgress: this.phaseProgress,
      state: this.state,
      errorMessage: this.errorMessage,
    };
  }

  async run(): Promise<DownloadTaskResult> {
    const ctx = this.ctx;
    const pageId = this.pageId;
    let phase: DownloadPhase = DownloadPhase.DownloadPage;
    let pageJsonUri: string | null = null;
    let view: RopewikiPageView | null = null;
    let downloadedImages: Record<string, ImageVersions> | null = null;
    let downloadedMiniMap: DownloadedPageMiniMap | DownloadedCenteredRegionMiniMap | null =
      null;

    const setPhase = (p: ActiveDownloadPhase): void => {
      this.phase = p;
      this.phaseProgress = 0;
      this.state = "running";
      this.errorMessage = null;
    };

    try {
      this.phase = DownloadPhase.DownloadPage;
      this.phaseProgress = 0;
      this.state = "running";
      this.errorMessage = null;
      await deleteOfflineBundleFiles(pageId);
      while (phase !== DownloadPhase.Complete) {
        switch (phase) {
          case DownloadPhase.DownloadPage: {
            setPhase(DownloadPhase.DownloadPage);
            const result = await downloadPageJson(ctx);
            pageJsonUri = result.pageJsonUri;
            view = result.view;
            phase = DownloadPhase.DownloadImages;
            break;
          }
          case DownloadPhase.DownloadImages: {
            setPhase(DownloadPhase.DownloadImages);
            downloadedImages = await downloadImages(ctx, view!);
            phase = DownloadPhase.DownloadMapbox;
            break;
          }
          case DownloadPhase.DownloadMapbox: {
            setPhase(DownloadPhase.DownloadMapbox);
            await downloadMapboxPack(ctx, view!);
            phase = DownloadPhase.DownloadTiles;
            break;
          }
          case DownloadPhase.DownloadTiles: {
            setPhase(DownloadPhase.DownloadTiles);
            const tilesOut = await downloadTrailTiles(ctx, view!);
            if (tilesOut != null) {
              downloadedMiniMap = tilesOut;
            }
            phase = DownloadPhase.DownloadRegion;
            break;
          }
          case DownloadPhase.DownloadRegion: {
            setPhase(DownloadPhase.DownloadRegion);
            const regionOut = await downloadRegionRoutes(ctx, view!);
            if (regionOut != null) {
              downloadedMiniMap = regionOut;
            }
            phase = DownloadPhase.Complete;
            this.phase = DownloadPhase.Complete;
            this.phaseProgress = 1;
            this.state = "success";
            this.errorMessage = null;
            break;
          }
          default:
            break;
        }
      }

      return {
        downloadedPageView: pageJsonUri!,
        downloadedImages: downloadedImages!,
        downloadedMiniMap,
      };
    } catch (e) {
      await deleteOfflineBundleFiles(pageId);
      this.state = "error";
      this.errorMessage = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }
}
