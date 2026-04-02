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
import { type RopewikiPageView, RouteType, SavedPage } from "ropegeo-common/classes";

type EnqueuePageDownloadInput = {
  pageId: string;
  apiPageId: string;
  data: RopewikiPageView;
  routeType: RouteType;
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
  const queue = useMemo(() => DownloadQueue.getInstance(), []);
  const { savedEntries, addSaved, replaceSaved } = useSavedPages();
  const savedEntriesRef = useRef(savedEntries);
  const [snapshots, setSnapshots] = useState<Record<string, DownloadTaskSnapshot>>(
    queue.getSnapshots(),
  );

  useEffect(() => {
    savedEntriesRef.current = savedEntries;
  }, [savedEntries]);

  useEffect(() => queue.subscribe(setSnapshots), [queue]);

  const enqueuePageDownload = useCallback(
    (input: EnqueuePageDownloadInput) => {
      const existingAtEnqueue = savedEntriesRef.current.find(
        (e) => e.preview.id === input.pageId,
      );
      const baseAtEnqueue =
        existingAtEnqueue ??
        SavedPage.fromRopewikiPageView(input.data, input.routeType, input.apiPageId);
      if (existingAtEnqueue == null) {
        addSaved(baseAtEnqueue);
      }

      queue.enqueue({
        pageId: input.pageId,
        apiPageId: input.apiPageId,
        onSuccess: async (out) => {
          const existing = savedEntriesRef.current.find(
            (e) => e.preview.id === input.pageId,
          );
          const base = existing ?? baseAtEnqueue;
          replaceSaved(
            new SavedPage(
              base.preview,
              base.routeType,
              base.savedAt,
              out.downloadedPageView,
              out.downloadedImages,
              out.downloadedMapData,
            ),
          );
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
      queue.enqueue({
        pageId: input.pageId,
        apiPageId: input.pageId,
        onSuccess: async (out) => {
          const existing = savedEntriesRef.current.find(
            (e) => e.preview.id === input.pageId,
          );
          const base = existing ?? saved;
          replaceSaved(
            new SavedPage(
              base.preview,
              base.routeType,
              base.savedAt,
              out.downloadedPageView,
              out.downloadedImages,
              out.downloadedMapData,
            ),
          );
        },
      });
    },
    [queue, replaceSaved],
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
