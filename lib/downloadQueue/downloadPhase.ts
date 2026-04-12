export enum DownloadPhase {
  Queued = 0,
  DownloadPage = 1,
  DownloadImages = 2,
  DownloadMapbox = 3,
  DownloadTiles = 4,
  DownloadRegion = 5,
  Complete = 6,
}

export const PHASE_TITLE: Record<DownloadPhase, string> = {
  [DownloadPhase.Queued]: "Download queued",
  [DownloadPhase.DownloadPage]: "Downloading page",
  [DownloadPhase.DownloadImages]: "Downloading images",
  [DownloadPhase.DownloadMapbox]: "Downloading Mapbox data",
  [DownloadPhase.DownloadTiles]: "Downloading trail data",
  [DownloadPhase.DownloadRegion]: "Downloading route markers",
  [DownloadPhase.Complete]: "Complete",
};

export type ActiveDownloadPhase =
  | DownloadPhase.DownloadPage
  | DownloadPhase.DownloadImages
  | DownloadPhase.DownloadMapbox
  | DownloadPhase.DownloadTiles
  | DownloadPhase.DownloadRegion;

export type DownloadProgressPayload = {
  phase: ActiveDownloadPhase;
  /** 0–1 progress within the current phase. */
  phaseProgress: number;
};
