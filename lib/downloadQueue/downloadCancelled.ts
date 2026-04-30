/** Message and error type for user- or queue-initiated download abort (not generic offline). */
export const DOWNLOAD_CANCELLED_MESSAGE = "Download cancelled";

export class DownloadCancelledError extends Error {
  constructor() {
    super(DOWNLOAD_CANCELLED_MESSAGE);
    this.name = "DownloadCancelledError";
  }
}

export function isDownloadCancelledError(e: unknown): boolean {
  return e instanceof DownloadCancelledError;
}
