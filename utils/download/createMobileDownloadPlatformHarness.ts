import { deleteOfflineBundleFiles } from "@/utils/offline/deleteOfflineBundle";
import { setDownloadedRoutePreviewsForPage } from "@/utils/offline/downloadedRoutePreviewsStorage";
import {
  getOfflineImageFileUri,
  getOfflineMapDataRootUri,
  getOfflinePageJsonUri,
  getOfflinePageRootUri,
  getOfflinePageZipTempUri,
  getOfflineRegionRoutesGeojsonUri,
} from "@/utils/offline/paths";
import { extractZipArchive } from "./extractZipArchive";
import { gunzipVectorTileFileIfNeeded } from "@/utils/offline/prepareOfflineVectorTiles";
import { offlineManager } from "@rnmapbox/maps";
import * as FileSystem from "expo-file-system/legacy";
import { FileSystemSessionType } from "expo-file-system/legacy";
import { AppState, type AppStateStatus } from "react-native";
import type { DownloadPlatformHarness } from "ropegeo-common/download";
import { ensureParentDir } from "./ensureParentDir";
import { loadDownloadJobStore, saveDownloadJobStore } from "./downloadJobStore";
import { mapboxPackName } from "./mapboxPackName";

const mapboxAppStateSubs = new Map<string, { remove: () => void }>();
/** Progress from createPack callbacks; avoids pack.status() before native groupID exists. */
const mapboxPackProgressByPageId = new Map<string, number>();

function clearMapboxListener(pageId: string): void {
  mapboxAppStateSubs.get(pageId)?.remove();
  mapboxAppStateSubs.delete(pageId);
}

function clearMapboxPackProgress(pageId: string): void {
  mapboxPackProgressByPageId.delete(pageId);
}

function attachMapboxResumeListener(pageId: string, packName: string): void {
  clearMapboxListener(pageId);
  const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
    if (next !== "active") {
      return;
    }
    void (async () => {
      try {
        const pack = await offlineManager.getPack(packName);
        if (pack == null) {
          return;
        }
        const status = await pack.status();
        if (status.percentage < 100) {
          await pack.resume();
        }
      } catch {
        // Pack may not exist yet.
      }
    })();
  });
  mapboxAppStateSubs.set(pageId, sub);
}

export function createMobileDownloadPlatformHarness(): DownloadPlatformHarness {
  return {
    async downloadFile({ url, destPath, background }) {
      await ensureParentDir(destPath);
      const options = background
        ? { sessionType: FileSystemSessionType.BACKGROUND }
        : undefined;
      const result = await FileSystem.downloadAsync(url, destPath, options);
      if (result.status >= 400) {
        try {
          await FileSystem.deleteAsync(destPath, { idempotent: true });
        } catch {
          // Ignore cleanup failure.
        }
        throw new Error(`Download failed: HTTP ${result.status}`);
      }
    },
    async fileExists(path) {
      const info = await FileSystem.getInfoAsync(path);
      return {
        exists: info.exists,
        size: info.exists && "size" in info ? info.size : undefined,
      };
    },
    readTextFile(path) {
      return FileSystem.readAsStringAsync(path);
    },
    async writeTextFile(path, content) {
      await ensureParentDir(path);
      await FileSystem.writeAsStringAsync(path, content);
    },
    ensureParentDir,
    deletePageBundle(pageId) {
      clearMapboxListener(pageId);
      clearMapboxPackProgress(pageId);
      return deleteOfflineBundleFiles(pageId);
    },
    async gunzipTileIfNeeded(path) {
      await gunzipVectorTileFileIfNeeded(path);
    },
    extractZipArchive,
    paths: {
      pageRoot: getOfflinePageRootUri,
      pageJson: getOfflinePageJsonUri,
      pageJsonTemp: (pageId) => `${getOfflinePageJsonUri(pageId)}.tmp`,
      zipTemp: getOfflinePageZipTempUri,
      imageDest(pageId, imageId, slot, ext) {
        return `${getOfflineImageFileUri(pageId, imageId, slot)}${ext}`;
      },
      tileDest(pageId, relativePath) {
        return `${getOfflineMapDataRootUri(pageId)}${relativePath}`;
      },
      regionGeojson: getOfflineRegionRoutesGeojsonUri,
    },
    mapbox: {
      async startPack({ pageId, styleUrl, bounds }) {
        const packName = mapboxPackName(pageId);
        const packBounds: [[number, number], [number, number]] = [
          [bounds.east, bounds.north],
          [bounds.west, bounds.south],
        ];
        clearMapboxListener(pageId);
        clearMapboxPackProgress(pageId);
        mapboxPackProgressByPageId.set(pageId, 0);
        try {
          await offlineManager.deletePack(packName);
        } catch {
          // Pack may not exist.
        }
        attachMapboxResumeListener(pageId, packName);
        try {
          await offlineManager.createPack(
            {
              name: packName,
              styleURL: styleUrl,
              bounds: packBounds,
              minZoom: 10,
              maxZoom: 20,
            },
            (_pack, status) => {
              const percentage =
                status != null && typeof status === "object"
                  ? (status as { percentage?: number }).percentage
                  : undefined;
              if (typeof percentage === "number") {
                mapboxPackProgressByPageId.set(pageId, percentage);
              }
            },
            (_pack, err) => {
              clearMapboxPackProgress(pageId);
              console.warn("[DownloadJob] Mapbox pack error", err.message);
            },
          );
        } catch (error) {
          console.warn("[DownloadJob] Mapbox createPack failed", error);
          throw error;
        }
      },
      async getPackProgress(pageId) {
        const packName = mapboxPackName(pageId);
        const cached = mapboxPackProgressByPageId.get(pageId);
        if (cached !== undefined) {
          return cached;
        }
        try {
          const pack = await offlineManager.getPack(packName);
          if (pack == null) {
            return 0;
          }
          const status = await pack.status();
          return status.percentage;
        } catch {
          return 0;
        }
      },
      async deletePack(pageId) {
        clearMapboxListener(pageId);
        clearMapboxPackProgress(pageId);
        try {
          await offlineManager.deletePack(mapboxPackName(pageId));
        } catch {
          // Pack may not exist.
        }
      },
    },
    loadJobStore: loadDownloadJobStore,
    saveJobStore: saveDownloadJobStore,
    setRoutePreviewsForPage: setDownloadedRoutePreviewsForPage,
  };
}
