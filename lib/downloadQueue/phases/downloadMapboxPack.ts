import { offlineManager } from "@rnmapbox/maps";
import { MiniMapType, type PageMiniMap, type RopewikiPageView } from "ropegeo-common/classes";
import { mapboxPackName } from "@/lib/downloadQueue/util/downloadUtils";
import type { DownloadContext } from "@/lib/downloadQueue/downloadTask";

function getTilesMiniMap(view: RopewikiPageView): PageMiniMap | null {
  const m = view.miniMap;
  if (m == null || m.miniMapType !== MiniMapType.TilesTemplate) return null;
  return m as PageMiniMap;
}

export async function downloadMapboxPack(
  ctx: DownloadContext,
  view: RopewikiPageView,
): Promise<void> {
  const mm = getTilesMiniMap(view);
  if (mm == null) {
    ctx.onProgress({ phase: 3, phaseProgress: 1 });
    return;
  }

  const packName = mapboxPackName(ctx.pageId);
  const b = mm.bounds;
  ctx.onProgress({ phase: 3, phaseProgress: 0 });

  try {
    await offlineManager.deletePack(packName);
  } catch {
    /* pack may not exist */
  }

  await new Promise<void>((resolve, reject) => {
    let done = false;
    offlineManager
      .createPack(
        {
          name: packName,
          styleURL: "mapbox://styles/mapbox/outdoors-v12",
          bounds: [
            [b.east, b.north],
            [b.west, b.south],
          ],
          minZoom: 10,
          maxZoom: 20,
        },
        (_pack, status) => {
          ctx.onProgress({
            phase: 3,
            phaseProgress: Math.min(1, status.percentage / 100),
          });
          if (status.percentage >= 100 && !done) {
            done = true;
            try {
              offlineManager.unsubscribe(packName);
            } catch {
              /* ignore */
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

  ctx.onProgress({ phase: 3, phaseProgress: 1 });
}
