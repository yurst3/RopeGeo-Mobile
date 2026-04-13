export enum DownloadPhase {
  Queued = 0,
  DeleteDownloaded = 1,
  DownloadPage = 2,
  DownloadImages = 3,
  DownloadMapbox = 4,
  DownloadTiles = 5,
  DownloadRegion = 6,
  SaveOfflinePage = 7,
  Complete = 8,
}

export const PHASE_TITLE: Record<DownloadPhase, string> = {
  [DownloadPhase.Queued]: "Download queued",
  [DownloadPhase.DeleteDownloaded]: "Clearing previous download",
  [DownloadPhase.DownloadPage]: "Downloading page",
  [DownloadPhase.DownloadImages]: "Downloading images",
  [DownloadPhase.DownloadMapbox]: "Downloading Mapbox data",
  [DownloadPhase.DownloadTiles]: "Downloading trail data",
  [DownloadPhase.DownloadRegion]: "Downloading route markers",
  [DownloadPhase.SaveOfflinePage]: "Saving offline page",
  [DownloadPhase.Complete]: "Complete",
};

export type ActiveDownloadPhase =
  | DownloadPhase.DeleteDownloaded
  | DownloadPhase.DownloadPage
  | DownloadPhase.DownloadImages
  | DownloadPhase.DownloadMapbox
  | DownloadPhase.DownloadTiles
  | DownloadPhase.DownloadRegion
  | DownloadPhase.SaveOfflinePage;

export type DownloadProgressPayload = {
  phase: ActiveDownloadPhase;
  /** 0–1 progress within the current phase. */
  phaseProgress: number;
  /** 1-based index among user-visible phases (excludes delete/save; tiles XOR region). */
  displayStep: number;
  /** Total user-visible phases for this run. */
  displayTotal: number;
};
