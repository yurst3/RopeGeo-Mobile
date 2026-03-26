import * as FileSystem from "expo-file-system/legacy";
import { offlineManager } from "@rnmapbox/maps";
import { mapboxPackName } from "@/lib/downloadQueue/util/downloadUtils";
import { getOfflinePageRootUri } from "@/lib/offline/paths";

/**
 * Deletes on-disk offline data for a page (page JSON, images, vector tiles). Idempotent.
 */
export async function deleteOfflineBundleFiles(pageId: string): Promise<void> {
  const root = getOfflinePageRootUri(pageId);
  const info = await FileSystem.getInfoAsync(root);
  if (info.exists) {
    await FileSystem.deleteAsync(root, { idempotent: true });
  }
  try {
    await offlineManager.deletePack(mapboxPackName(pageId));
  } catch {
    /* pack may not exist */
  }
}
