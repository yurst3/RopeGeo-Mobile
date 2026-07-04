import {
  ensureDownloadBackgroundTaskDefined,
  registerDownloadBackgroundTask,
} from "@/utils/download/downloadBackgroundTask";
import {
  mobileDownloadJobQueue,
  mobileDownloadPlatformHarness,
} from "@/utils/download/mobileDownloadJobQueue";
import { savedPageFromCompletedJob } from "@/utils/download/savedPageFromCompletedJob";
import { MAPBOX_STYLE_URL } from "@/constants/mapbox";
import { useNetworkStatus } from "@/context/app/NetworkStatusContext";
import { useSavedPages } from "@/context/data/SavedPagesContext";
import { SERVICE_BASE_URL, Service } from "ropegeo-common/components";
import type { OnlinePageView } from "ropegeo-common/models";
import type { DownloadJob, DownloadJobUISnapshot } from "ropegeo-common/download";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

type EnqueuePageDownloadInput = {
  pageId: string;
  data: OnlinePageView;
};

export type EnqueueSavedPageDownloadInput = {
  pageId: string;
};

type DownloadJobQueueContextValue = {
  enqueuePageDownload: (input: EnqueuePageDownloadInput) => void;
  enqueueSavedPageDownload: (input: EnqueueSavedPageDownloadInput) => void;
  getJobUISnapshot: (pageId: string) => DownloadJobUISnapshot | null;
  abortJob: (pageId: string) => void;
  takeInvalidStoredDownloadPageId: (pageId: string) => boolean;
};

const DownloadJobQueueContext = createContext<DownloadJobQueueContextValue | null>(
  null,
);

function abortAllJobs(): void {
  for (const pageId of Object.keys(mobileDownloadJobQueue.getSnapshots())) {
    mobileDownloadJobQueue.abort(pageId);
  }
}

export function abortAllDownloadJobs(): void {
  abortAllJobs();
}

export function DownloadJobQueueProvider({ children }: { children: ReactNode }) {
  const queue = mobileDownloadJobQueue;
  const { isOnline } = useNetworkStatus();
  const { savedEntries, addSaved, replaceSaved, refreshFromStorage } = useSavedPages();
  const savedEntriesRef = useRef(savedEntries);
  const [snapshots, setSnapshots] = useState<Record<string, DownloadJobUISnapshot>>(
    queue.getSnapshots(),
  );
  const pendingInvalidPageIdsRef = useRef<string[]>([]);

  useEffect(() => {
    savedEntriesRef.current = savedEntries;
  }, [savedEntries]);

  useEffect(() => queue.subscribe(setSnapshots), [queue]);

  const makeOnSuccess = useCallback(
    () => async (job: DownloadJob) => {
      const savedPage = await savedPageFromCompletedJob(job, mobileDownloadPlatformHarness);
      replaceSaved(savedPage);
    },
    [replaceSaved],
  );

  useEffect(() => {
    ensureDownloadBackgroundTaskDefined();
    void (async () => {
      await registerDownloadBackgroundTask();
      await queue.restoreFromStorage();
      pendingInvalidPageIdsRef.current = queue.consumeInvalidStoredDownloadPageIds();
      await queue.runForegroundTicksWhileActive();
    })();
  }, [queue]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        setSnapshots(queue.getSnapshots());
        void (async () => {
          await refreshFromStorage();
          pendingInvalidPageIdsRef.current = [
            ...pendingInvalidPageIdsRef.current,
            ...queue.consumeInvalidStoredDownloadPageIds(),
          ];
          await queue.runForegroundTicksWhileActive();
        })();
      }
    });
    return () => sub.remove();
  }, [queue, refreshFromStorage]);

  const downloadConfig = useMemo(
    () => ({
      mapboxStyleUrl: MAPBOX_STYLE_URL,
      webScraperBaseUrl: SERVICE_BASE_URL[Service.WEBSCRAPER],
    }),
    [],
  );

  const enqueuePageDownload = useCallback(
    (input: EnqueuePageDownloadInput) => {
      if (!isOnline || input.data.fetchType !== "online") {
        return;
      }
      const existingAtEnqueue = savedEntriesRef.current.find(
        (entry) => entry.preview.id === input.pageId,
      );
      const baseAtEnqueue = existingAtEnqueue ?? input.data.toSavedPage();
      if (existingAtEnqueue == null) {
        addSaved(baseAtEnqueue);
      }

      const job = input.data.toDownloadJob({
        savedAt: baseAtEnqueue.savedAt,
        ...downloadConfig,
      });
      queue.enqueue(job, makeOnSuccess());
      void queue.runForegroundTicksWhileActive();
    },
    [addSaved, downloadConfig, isOnline, makeOnSuccess, queue],
  );

  const enqueueSavedPageDownload = useCallback(
    (input: EnqueueSavedPageDownloadInput) => {
      if (!isOnline) {
        return;
      }
      const saved = savedEntriesRef.current.find(
        (entry) => entry.preview.id === input.pageId,
      );
      if (saved == null) {
        return;
      }

      const job = saved.preview.toDownloadJob({
        savedAt: saved.savedAt,
        ...downloadConfig,
      });
      queue.enqueue(job, makeOnSuccess());
      void queue.runForegroundTicksWhileActive();
    },
    [downloadConfig, isOnline, makeOnSuccess, queue],
  );

  const abortJob = useCallback(
    (pageId: string) => {
      queue.abort(pageId);
    },
    [queue],
  );

  const getJobUISnapshot = useCallback(
    (pageId: string) => snapshots[pageId] ?? null,
    [snapshots],
  );

  const takeInvalidStoredDownloadPageId = useCallback((pageId: string) => {
    const idx = pendingInvalidPageIdsRef.current.indexOf(pageId);
    if (idx === -1) {
      return false;
    }
    pendingInvalidPageIdsRef.current.splice(idx, 1);
    return true;
  }, []);

  const value = useMemo<DownloadJobQueueContextValue>(
    () => ({
      enqueuePageDownload,
      enqueueSavedPageDownload,
      getJobUISnapshot,
      abortJob,
      takeInvalidStoredDownloadPageId,
    }),
    [
      abortJob,
      enqueuePageDownload,
      enqueueSavedPageDownload,
      getJobUISnapshot,
      takeInvalidStoredDownloadPageId,
    ],
  );

  return (
    <DownloadJobQueueContext.Provider value={value}>
      {children}
    </DownloadJobQueueContext.Provider>
  );
}

export function useDownloadJobQueue(): DownloadJobQueueContextValue {
  const ctx = useContext(DownloadJobQueueContext);
  if (ctx == null) {
    throw new Error("useDownloadJobQueue must be used within DownloadJobQueueProvider");
  }
  return ctx;
}

/** @deprecated Use {@link useDownloadJobQueue}. */
export const useDownloadQueue = useDownloadJobQueue;
