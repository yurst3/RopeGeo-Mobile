import * as FileSystem from "expo-file-system/legacy";
import {
  MiniMapType,
  type PageMiniMap,
  type RopewikiPageView,
  type MapDataTileKeysResults,
} from "ropegeo-common";
import { getOfflineMapDataRootUri } from "@/lib/offline/paths";
import { ensureParentDir } from "@/lib/downloadQueue/util/downloadUtils";
import { fetchMapDataTileKeys } from "@/lib/downloadQueue/util/fetchMapDataTileKeys";
import { relativePathFromTileUrl } from "@/lib/offline/tileUrlPaths";
import type { DownloadContext } from "@/lib/downloadQueue/downloadTask";

const TILE_DOWNLOAD_BATCH_SIZE = 25;

function getTilesMiniMap(view: RopewikiPageView): PageMiniMap | null {
  const m = view.miniMap;
  if (m == null || m.miniMapType !== MiniMapType.TilesTemplate) return null;
  return m as PageMiniMap;
}

type TileBytesProgress = { bytesDone: number };

/**
 * Downloads each tile URL to disk under `mapRoot`, running up to
 * {@link TILE_DOWNLOAD_BATCH_SIZE} downloads in parallel per batch.
 */
async function getTiles(
  tileUrls: string[],
  mapRoot: string,
  ctx: DownloadContext,
  totalBytesForTiles: number,
  progress: TileBytesProgress,
): Promise<void> {
  for (let i = 0; i < tileUrls.length; i += TILE_DOWNLOAD_BATCH_SIZE) {
    const batch = tileUrls.slice(i, i + TILE_DOWNLOAD_BATCH_SIZE);
    await Promise.all(
      batch.map(async (tileUrl) => {
        const rel = relativePathFromTileUrl(tileUrl);
        const dest = `${mapRoot}${rel}`;
        await ensureParentDir(dest);
        await FileSystem.downloadAsync(tileUrl, dest);
        const info = await FileSystem.getInfoAsync(dest);
        if (info.exists && typeof info.size === "number") {
          progress.bytesDone += info.size;
        }
        ctx.onProgress({
          phase: 4,
          phaseProgress: Math.min(1, progress.bytesDone / totalBytesForTiles),
        });
      }),
    );
  }
}

export async function downloadTrailTiles(
  ctx: DownloadContext,
  view: RopewikiPageView,
): Promise<string | null> {
  const mm = getTilesMiniMap(view);
  if (mm == null) {
    ctx.onProgress({ phase: 4, phaseProgress: 1 });
    return null;
  }

  const mapDataId = mm.layerId;
  const mapRoot = getOfflineMapDataRootUri(ctx.pageId);
  await FileSystem.makeDirectoryAsync(mapRoot, { intermediates: true });

  ctx.onProgress({ phase: 4, phaseProgress: 0 });
  const limit = 100;
  let page = 1;
  const progress: TileBytesProgress = { bytesDone: 0 };
  let totalBytesForTiles = 1;

  for (;;) {
    const parsed = await fetchMapDataTileKeys<MapDataTileKeysResults>(
      mapDataId,
      page,
      limit,
    );
    if (page === 1) {
      totalBytesForTiles = Math.max(parsed.totalBytes, 1);
    }
    if (parsed.results.length === 0) break;

    await getTiles(parsed.results, mapRoot, ctx, totalBytesForTiles, progress);

    if (parsed.results.length < limit || page * limit >= parsed.total) {
      break;
    }
    page += 1;
  }

  ctx.onProgress({ phase: 4, phaseProgress: 1 });
  return mapRoot;
}
