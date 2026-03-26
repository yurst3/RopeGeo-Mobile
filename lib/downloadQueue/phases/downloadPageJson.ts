import * as FileSystem from "expo-file-system/legacy";
import { Result, type RopewikiPageView } from "ropegeo-common";
import { SERVICE_BASE_URL, Service } from "@/components/RopeGeoHttpRequest";
import { getOfflinePageJsonUri } from "@/lib/offline/paths";
import { ensureParentDir } from "@/lib/downloadQueue/util/downloadUtils";
import type { DownloadContext } from "@/lib/downloadQueue/downloadTask";

const WEB_BASE = SERVICE_BASE_URL[Service.WEBSCRAPER];

export async function downloadPageJson(
  ctx: DownloadContext,
): Promise<{ pageJsonUri: string; view: RopewikiPageView }> {
  const pageJsonUri = getOfflinePageJsonUri(ctx.pageId);
  await ensureParentDir(pageJsonUri);

  const pageUrl = `${WEB_BASE}/ropewiki/page/${encodeURIComponent(ctx.apiPageId)}`;
  ctx.onProgress({ phase: 1, phaseProgress: 0 });

  const res = await fetch(pageUrl, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Page request failed: HTTP ${res.status}`);
  }
  const pageText = await res.text();
  ctx.onProgress({ phase: 1, phaseProgress: 0.5 });

  await FileSystem.writeAsStringAsync(pageJsonUri, pageText);
  ctx.onProgress({ phase: 1, phaseProgress: 1 });

  const raw = JSON.parse(pageText) as unknown;
  const wrapped = Result.fromResponseBody(raw);
  const view = wrapped.result as RopewikiPageView;

  return { pageJsonUri, view };
}
