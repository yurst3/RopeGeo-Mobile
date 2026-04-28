import { TOAST_HORIZONTAL_INSET } from "@/constants/toast";
import {
  TOAST_KEY_DOWNLOAD_PROGRESS,
  getToastArchetypeForKey,
} from "@/constants/toastArchetypes";
import { useToast } from "@/context/ToastContext";
import type { DownloadTaskSnapshot } from "@/lib/downloadQueue/downloadQueue";
import { useEffect, useMemo } from "react";

/**
 * Normalized page-offline download UI for any page view backed by {@link DownloadQueue}.
 * Matches queue phases (page JSON → images → Mapbox → tiles) and task states.
 */
export type PageDownloadUi =
  | { kind: "idle" }
  | {
      kind: "progress";
      phaseTitle: string;
      phaseProgress: number;
      displayStep: number;
      displayTotal: number;
    }
  | { kind: "success"; displayTotal: number }
  | { kind: "error" };

export type UseDownloadProgressToastsArgs = {
  downloadUi: PageDownloadUi;
  /** Clears the download toast when this identity changes (e.g. `pageId`). */
  resetKey: string;
  /** When false, the download progress toast is dismissed (e.g. full-screen map expanded). */
  toastVisible: boolean;
  horizontalInset?: number;
  zIndex?: number;
};

/**
 * Maps the shared download-queue snapshot to {@link PageDownloadUi} for any page view type.
 */
export function pageDownloadUiFromTaskSnapshot(
  task: DownloadTaskSnapshot | null,
): PageDownloadUi {
  if (task == null) return { kind: "idle" };
  if (task.state === "queued" || task.state === "running") {
    return {
      kind: "progress",
      phaseTitle: task.phaseTitle,
      phaseProgress: task.phaseProgress,
      displayStep: task.displayStep,
      displayTotal: task.displayTotal,
    };
  }
  if (task.state === "success") {
    return { kind: "success", displayTotal: task.displayTotal };
  }
  return { kind: "error" };
}

function downloadTitle(downloadUi: PageDownloadUi): string {
  if (downloadUi.kind === "progress") {
    return downloadUi.displayTotal > 0
      ? `(${downloadUi.displayStep}/${downloadUi.displayTotal}) ${downloadUi.phaseTitle}`
      : downloadUi.phaseTitle;
  }
  if (downloadUi.kind === "success") {
    return downloadUi.displayTotal > 0
      ? `(${downloadUi.displayTotal}/${downloadUi.displayTotal}) Download complete`
      : "Download complete";
  }
  return "Download failed";
}

function downloadProgress(downloadUi: PageDownloadUi): number {
  return downloadUi.kind === "progress" ? downloadUi.phaseProgress : 0;
}

/**
 * Syncs {@link PageDownloadUi} from the app-wide download queue to global {@link ProgressToast} entries.
 */
export function useDownloadProgressToasts({
  downloadUi,
  resetKey,
  toastVisible,
  horizontalInset = TOAST_HORIZONTAL_INSET,
  zIndex,
}: UseDownloadProgressToastsArgs): void {
  const { upsertProgress, dismiss } = useToast();
  const toastKey = `${TOAST_KEY_DOWNLOAD_PROGRESS}-${resetKey}`;
  const allowedRoutes = useMemo(
    () => [`/explore/${resetKey}/page`, `/saved/${resetKey}/page`],
    [resetKey],
  );

  useEffect(() => {
    dismiss(toastKey);
  }, [toastKey, dismiss]);

  useEffect(() => {
    if (!toastVisible) {
      dismiss(toastKey);
    }
  }, [toastVisible, dismiss, toastKey]);

  useEffect(() => {
    if (!toastVisible) return;
    if (downloadUi.kind === "idle") {
      dismiss(toastKey);
      return;
    }
    const title = downloadTitle(downloadUi);
    const progress = downloadProgress(downloadUi);
    const progressKind =
      downloadUi.kind === "progress"
        ? "progress"
        : downloadUi.kind === "success"
          ? "success"
          : "error";
    upsertProgress({
      key: toastKey,
      progressKind,
      title,
      progress,
      horizontalInset,
      zIndex,
      durationMs:
        downloadUi.kind === "success"
          ? (getToastArchetypeForKey(toastKey)?.durationMs ?? null)
          : null,
      allowedRoutes,
    });
  }, [
    toastVisible,
    downloadUi,
    dismiss,
    upsertProgress,
    toastKey,
    horizontalInset,
    zIndex,
    allowedRoutes,
  ]);
}
