import {
  isAbortError,
  mergeParentSignalWithDeadline,
  NETWORK_REQUEST_TIMED_OUT_MESSAGE,
} from "ropegeo-common/helpers/network";
import { PaginationResults } from "ropegeo-common/models";
import { SERVICE_BASE_URL, Service } from "ropegeo-common/components";
import { DownloadCancelledError } from "@/lib/downloadQueue/downloadCancelled";
import { NO_NETWORK_MESSAGE } from "@/lib/network/messages";
import { REQUEST_TIMEOUT_SECONDS } from "@/lib/network/requestTimeout";

const WEB_BASE = SERVICE_BASE_URL[Service.WEBSCRAPER];

export async function fetchMapDataTileKeys<R>(
  mapDataId: string,
  page: number,
  limit: number,
  outerSignal: AbortSignal,
): Promise<R> {
  const url = new URL(
    `mapdata/${encodeURIComponent(mapDataId)}/tiles`,
    WEB_BASE,
  );
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  const merged = mergeParentSignalWithDeadline(
    outerSignal,
    REQUEST_TIMEOUT_SECONDS * 1000,
  );
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: merged.signal,
    });
    if (!res.ok) {
      throw new Error(`Tile list failed: HTTP ${res.status}`);
    }
    const body = (await res.json()) as unknown;
    return PaginationResults.fromResponseBody(body) as R;
  } catch (e) {
    if (merged.consumeDidTimeout()) {
      throw new Error(NETWORK_REQUEST_TIMED_OUT_MESSAGE);
    }
    if (isAbortError(e)) {
      if (outerSignal.aborted) {
        throw new DownloadCancelledError();
      }
      throw new Error(NO_NETWORK_MESSAGE);
    }
    throw e;
  } finally {
    merged.dispose();
  }
}
