import type { ImageVersions, RopewikiPageView } from "ropegeo-common/classes";
import { deleteOfflineBundleFiles } from "@/lib/offline/deleteOfflineBundle";
import { getOfflinePageRootUri } from "@/lib/offline/paths";
import { downloadPageJson } from "@/lib/downloadQueue/phases/downloadPageJson";
import { downloadImages } from "@/lib/downloadQueue/phases/downloadImages";
import { downloadMapboxPack } from "@/lib/downloadQueue/phases/downloadMapboxPack";
import { downloadTrailTiles } from "@/lib/downloadQueue/phases/downloadTrailTiles";

export enum DownloadPhase {
  Queued = 0,
  DownloadPage = 1,
  DownloadImages = 2,
  DownloadMapbox = 3,
  DownloadTiles = 4,
  Complete = 5,
}

export const PHASE_TITLE: Record<DownloadPhase, string> = {
  [DownloadPhase.Queued]: "Download queued",
  [DownloadPhase.DownloadPage]: "Downloading page",
  [DownloadPhase.DownloadImages]: "Downloading images",
  [DownloadPhase.DownloadMapbox]: "Downloading Mapbox data",
  [DownloadPhase.DownloadTiles]: "Downloading trail data",
  [DownloadPhase.Complete]: "Complete",
};

type ActiveDownloadPhase =
  | DownloadPhase.DownloadPage
  | DownloadPhase.DownloadImages
  | DownloadPhase.DownloadMapbox
  | DownloadPhase.DownloadTiles;

export type DownloadTaskState =
  | "queued"
  | "running"
  | "success"
  | "error";

export type DownloadTaskSnapshot = {
  pageId: string;
  apiPageId: string;
  phase: DownloadPhase;
  phaseTitle: string;
  phaseProgress: number;
  state: DownloadTaskState;
  errorMessage: string | null;
};

export type DownloadProgressPayload = {
  phase: ActiveDownloadPhase;
  /** 0–1 progress within the current phase. */
  phaseProgress: number;
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
  downloadedMapData: string | null;
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
    let downloadedMapData: string | null = null;

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
            downloadedMapData = await downloadTrailTiles(ctx, view!);
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
        downloadedMapData,
      };
    } catch (e) {
      await deleteOfflineBundleFiles(pageId);
      this.state = "error";
      this.errorMessage = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }
}
