import { TOAST_KEY_MAP_FILE_UPLOAD } from "@/constants/toasts/toastArchetypes";
import type { ToastContextValue } from "@/context/ui/ToastContext";
import { updateSavedTripReport } from "@/utils/tripReport/tripReportStorage";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  MapFile,
  mapFileFormatFromFileName,
  TripReportMapBlock,
  type EnrichedGeoJsonMapFile,
  type MapFileImportFormat,
  type TripReportLineColor,
} from "ropegeo-common/models";

const SUCCESS_TOAST_DURATION_MS = 3000;
const FAILURE_TOAST_DURATION_MS = 5000;

const FORMAT_LABELS: Record<MapFileImportFormat, string> = {
  gpx: "GPX",
  kml: "KML",
  kmz: "KMZ",
  geojson: "GeoJSON",
};

/** A failure whose message is shown as the failed toast's subtitle. */
class MapFileUploadError extends Error {}

export type MapFileUploadTarget = {
  tripReportId: string;
  mapBlockId: string;
  /** Color for imported lines that don't carry their own. */
  newSegmentColor: TripReportLineColor;
};

type MapBlockUpdate = (block: TripReportMapBlock) => TripReportMapBlock;

/**
 * Upload state shared by every map block, plus finished imports waiting for their map block to
 * apply them. Memory only, like the waypoint recording store.
 */
class MapFileUploadStore {
  /** From opening the file picker until the upload finishes; blocks starting another. */
  busy = false;
  /** From picking a file until the upload finishes; disables every upload button. */
  uploading = false;
  private readonly pending = new Map<string, MapBlockUpdate[]>();
  private readonly mountedCounts = new Map<string, number>();
  private readonly listeners = new Set<() => void>();

  setUploading(uploading: boolean): void {
    this.uploading = uploading;
    this.notify();
  }

  isMounted(mapBlockId: string): boolean {
    return (this.mountedCounts.get(mapBlockId) ?? 0) > 0;
  }

  /** Marks a map block as on screen until the returned function is called. */
  mount(mapBlockId: string): () => void {
    this.mountedCounts.set(mapBlockId, (this.mountedCounts.get(mapBlockId) ?? 0) + 1);
    return () => {
      const count = (this.mountedCounts.get(mapBlockId) ?? 1) - 1;
      if (count > 0) this.mountedCounts.set(mapBlockId, count);
      else this.mountedCounts.delete(mapBlockId);
    };
  }

  deliver(mapBlockId: string, update: MapBlockUpdate): void {
    this.pending.set(mapBlockId, [...(this.pending.get(mapBlockId) ?? []), update]);
    this.notify();
  }

  /** Returns and clears the imports waiting for `mapBlockId`. */
  drain(mapBlockId: string): MapBlockUpdate[] {
    const updates = this.pending.get(mapBlockId) ?? [];
    this.pending.delete(mapBlockId);
    return updates;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

export const mapFileUploadStore = new MapFileUploadStore();

/** True while a picked map file is being processed (for any map block). */
export function useMapFileUploadInProgress(): boolean {
  return useSyncExternalStore(mapFileUploadStore.subscribe, () => mapFileUploadStore.uploading);
}

/**
 * Applies finished uploads for `mapBlockId` through `onChange` while the map block is mounted.
 * Uploads that finish while it isn't are saved straight into the stored trip report instead.
 */
export function useMapFileUploadDelivery(
  mapBlockId: string,
  onChange: (update: MapBlockUpdate) => void,
): void {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const unmount = mapFileUploadStore.mount(mapBlockId);
    const apply = () => {
      for (const update of mapFileUploadStore.drain(mapBlockId)) onChangeRef.current(update);
    };
    apply();
    const unsubscribe = mapFileUploadStore.subscribe(apply);
    return () => {
      unsubscribe();
      unmount();
    };
  }, [mapBlockId]);
}

/** Lets the in-progress toast render before the next chunk of synchronous parsing. */
function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function fileExtension(fileName: string): string | null {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 && dot < fileName.length - 1 ? fileName.slice(dot).toLowerCase() : null;
}

async function readMapFile(asset: DocumentPicker.DocumentPickerAsset): Promise<EnrichedGeoJsonMapFile> {
  const format = mapFileFormatFromFileName(asset.name);
  if (format == null) {
    const extension = fileExtension(asset.name);
    throw new MapFileUploadError(
      extension != null
        ? `${extension} files aren't supported`
        : "Files without an extension aren't supported",
    );
  }

  let bytes: Uint8Array;
  try {
    bytes = await new File(asset.uri).bytes();
  } catch {
    throw new MapFileUploadError("The file couldn't be read");
  }
  await yieldToUi();

  let file: EnrichedGeoJsonMapFile;
  try {
    const geoJson = MapFile.fromContent(asset.name, bytes, format).toGeoJson();
    await yieldToUi();
    file = geoJson.enrich();
  } catch {
    throw new MapFileUploadError(`This isn't a valid ${FORMAT_LABELS[format]} file`);
  }
  if (Object.keys(file.legend).length === 0) {
    throw new MapFileUploadError("The file has no points, lines, or areas");
  }
  return file;
}

/** Adds `update` to the map block on screen, or to the saved trip report when it isn't. */
async function applyToMapBlock(target: MapFileUploadTarget, update: MapBlockUpdate): Promise<void> {
  if (mapFileUploadStore.isMounted(target.mapBlockId)) {
    mapFileUploadStore.deliver(target.mapBlockId, update);
    return;
  }
  try {
    await updateSavedTripReport(target.tripReportId, (report) => {
      const block = report.blocks.find((b) => b.id === target.mapBlockId);
      if (!(block instanceof TripReportMapBlock)) {
        throw new MapFileUploadError("The map was removed from the trip report");
      }
      return report.withBlockUpdated(target.mapBlockId, (b) =>
        b instanceof TripReportMapBlock ? update(b) : b,
      );
    });
  } catch (error) {
    if (error instanceof MapFileUploadError) throw error;
    throw new MapFileUploadError("The trip report was deleted");
  }
}

function deleteQuietly(uri: string): void {
  try {
    new File(uri).delete();
  } catch {
    /* the picker's cache copy is cleaned up by the OS eventually */
  }
}

type UploadToast = Pick<ToastContextValue, "upsertPill" | "dismiss">;

/** Replaces any earlier upload toast outright, so no subtitle or timer carries over. */
function showUploadToast(
  toast: UploadToast,
  options: Omit<Parameters<UploadToast["upsertPill"]>[0], "key">,
): void {
  toast.dismiss(TOAST_KEY_MAP_FILE_UPLOAD, { immediate: true });
  toast.upsertPill({ key: TOAST_KEY_MAP_FILE_UPLOAD, ...options });
}

/**
 * Lets the user pick a map file and imports it into the target map block. Runs in the
 * background: the user can keep editing or leave the trip report while it's processed, with
 * progress and the result shown as a toast. Does nothing while another upload is running.
 */
export async function uploadMapFile(target: MapFileUploadTarget, toast: UploadToast): Promise<void> {
  if (mapFileUploadStore.busy) return;
  mapFileUploadStore.busy = true;
  let asset: DocumentPicker.DocumentPickerAsset | undefined;
  try {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      asset = result.assets[0];
    } catch {
      throw new MapFileUploadError("The file picker couldn't be opened");
    }
    if (asset == null) return;

    mapFileUploadStore.setUploading(true);
    showUploadToast(toast, {
      style: "warning",
      message: "Map file upload in progress...",
      durationMs: null,
    });
    await yieldToUi();
    const file = await readMapFile(asset);
    await applyToMapBlock(target, (block) =>
      block.withMapFileImported(file, { newSegmentColor: target.newSegmentColor }),
    );
    showUploadToast(toast, {
      style: "success",
      message: "Map file upload finished",
      durationMs: SUCCESS_TOAST_DURATION_MS,
    });
  } catch (error) {
    if (!(error instanceof MapFileUploadError)) {
      console.warn("[mapFileUpload] upload failed", error);
    }
    showUploadToast(toast, {
      style: "error",
      message: "Map file upload failed",
      subtitle:
        error instanceof MapFileUploadError
          ? error.message
          : "Something went wrong while processing the file",
      durationMs: FAILURE_TOAST_DURATION_MS,
    });
  } finally {
    if (asset != null) deleteQuietly(asset.uri);
    mapFileUploadStore.busy = false;
    if (mapFileUploadStore.uploading) mapFileUploadStore.setUploading(false);
  }
}
