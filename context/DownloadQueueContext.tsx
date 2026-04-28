import { useNetworkStatus } from "@/context/NetworkStatusContext";
import { useSavedPages } from "@/context/SavedPagesContext";
import {
  DownloadQueue,
  type DownloadTaskSnapshot,
} from "@/lib/downloadQueue/downloadQueue";
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
import {
  PageDataSource,
  PageViewType,
  Result,
  type OnlinePageView,
  SavedPage,
} from "ropegeo-common/models";
import { SERVICE_BASE_URL, Service } from "ropegeo-common/components";
import {
  isAbortError,
  mergeParentSignalWithDeadline,
  NETWORK_REQUEST_TIMED_OUT_MESSAGE,
} from "ropegeo-common/helpers/network";
import { NO_NETWORK_MESSAGE } from "@/lib/network/messages";
import { REQUEST_TIMEOUT_SECONDS } from "@/lib/network/requestTimeout";

type EnqueuePageDownloadInput = {
  pageId: string;
  data: OnlinePageView;
};

export type EnqueueSavedPageDownloadInput = {
  /** Must match an existing saved page row. */
  pageId: string;
};

type DownloadQueueContextValue = {
  enqueuePageDownload: (input: EnqueuePageDownloadInput) => void;
  /** Enqueue download using only saved-page metadata (no `RopewikiPageView` required). */
  enqueueSavedPageDownload: (input: EnqueueSavedPageDownloadInput) => void;
  getTaskSnapshot: (pageId: string) => DownloadTaskSnapshot | null;
};

const DownloadQueueContext = createContext<DownloadQueueContextValue | null>(null);

export function DownloadQueueProvider({ children }: { children: ReactNode }) {
  const webBase = SERVICE_BASE_URL[Service.WEBSCRAPER];
  const queue = useMemo(() => DownloadQueue.getInstance(), []);
  const { isOnline } = useNetworkStatus();
  const { savedEntries, addSaved, replaceSaved } = useSavedPages();
  const savedEntriesRef = useRef(savedEntries);
  const [snapshots, setSnapshots] = useState<Record<string, DownloadTaskSnapshot>>(
    queue.getSnapshots(),
  );

  useEffect(() => {
    savedEntriesRef.current = savedEntries;
  }, [savedEntries]);

  useEffect(() => queue.subscribe(setSnapshots), [queue]);

  useEffect(() => {
    queue.setOnline(isOnline);
  }, [isOnline, queue]);

  const pageViewTypeFromSavedPage = useCallback((savedPage: SavedPage): PageViewType => {
    switch (savedPage.preview.source) {
      case PageDataSource.Ropewiki:
        return PageViewType.Ropewiki;
      default:
        throw new Error(`Unsupported source for page view type: ${savedPage.preview.source}`);
    }
  }, []);

  const enqueuePageDownload = useCallback(
    (input: EnqueuePageDownloadInput) => {
      const existingAtEnqueue = savedEntriesRef.current.find(
        (e) => e.preview.id === input.pageId,
      );
      const baseAtEnqueue = existingAtEnqueue ?? input.data.toSavedPage();
      if (existingAtEnqueue == null) {
        addSaved(baseAtEnqueue);
      }

      queue.enqueue({
        data: input.data,
        savedAt: baseAtEnqueue.savedAt,
        onSuccess: async (updatedSavedPage) => {
          replaceSaved(updatedSavedPage);
        },
      });
    },
    [addSaved, queue, replaceSaved],
  );

  const enqueueSavedPageDownload = useCallback(
    (input: EnqueueSavedPageDownloadInput) => {
      const saved = savedEntriesRef.current.find(
        (e) => e.preview.id === input.pageId,
      );
      if (saved == null) {
        return;
      }
      const pageViewType = pageViewTypeFromSavedPage(saved);
      void (async () => {
        const pageUrl = `${webBase}/${encodeURIComponent(pageViewType)}/page/${encodeURIComponent(input.pageId)}`;
        const hold = new AbortController();
        const merged = mergeParentSignalWithDeadline(
          hold.signal,
          REQUEST_TIMEOUT_SECONDS * 1000,
        );
        let res: Response;
        try {
          res = await fetch(pageUrl, {
            headers: { Accept: "application/json" },
            signal: merged.signal,
          });
        } catch (e) {
          const timedOut = merged.consumeDidTimeout();
          if (timedOut) {
            throw new Error(NETWORK_REQUEST_TIMED_OUT_MESSAGE);
          }
          if (isAbortError(e)) {
            throw new Error(NO_NETWORK_MESSAGE);
          }
          throw e;
        } finally {
          merged.dispose();
        }
        if (!res.ok) {
          throw new Error(`Page request failed: HTTP ${res.status}`);
        }
        const pageText = await res.text();
        const wrapped = Result.fromResponseBody(JSON.parse(pageText) as unknown);
        const onlineView = wrapped.result as OnlinePageView;
        if (onlineView.fetchType !== "online") {
          throw new Error(`Expected online page view but got fetchType=${onlineView.fetchType}`);
        }
        if (onlineView.pageViewType !== pageViewType) {
          throw new Error(
            `Expected pageViewType ${pageViewType} but received ${onlineView.pageViewType}`,
          );
        }
        queue.enqueue({
          data: onlineView,
          savedAt: saved.savedAt,
          onSuccess: async (updatedSavedPage) => {
            replaceSaved(updatedSavedPage);
          },
        });
      })().catch((error: unknown) => {
        console.warn("[DownloadQueue] failed to enqueue saved-page download", error);
      });
    },
    [pageViewTypeFromSavedPage, queue, replaceSaved, webBase],
  );

  const getTaskSnapshot = useCallback(
    (pageId: string) => snapshots[pageId] ?? null,
    [snapshots],
  );

  const value = useMemo<DownloadQueueContextValue>(
    () => ({
      enqueuePageDownload,
      enqueueSavedPageDownload,
      getTaskSnapshot,
    }),
    [enqueuePageDownload, enqueueSavedPageDownload, getTaskSnapshot],
  );

  return (
    <DownloadQueueContext.Provider value={value}>
      {children}
    </DownloadQueueContext.Provider>
  );
}

export function useDownloadQueue(): DownloadQueueContextValue {
  const ctx = useContext(DownloadQueueContext);
  if (ctx == null) {
    throw new Error("useDownloadQueue must be used within DownloadQueueProvider");
  }
  return ctx;
}
