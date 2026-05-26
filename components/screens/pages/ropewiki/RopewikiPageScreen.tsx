import {
  Method,
  RopeGeoDataLoader,
  Service,
} from "ropegeo-common/components";
import { deleteOfflineBundleFiles } from "@/lib/offline/deleteOfflineBundle";
import { RopewikiPagePlaceholder } from "./RopewikiPagePlaceholder";
import {
  HEADER_ROW_TOP,
  RopewikiPageScreenBody,
} from "./RopewikiPageScreenBody";
import {
  TOAST_HORIZONTAL_INSET,
} from "@/constants/toasts";
import { TOAST_KEY_PAGE_ERROR } from "@/constants/toasts/toastArchetypes";
import { useNetworkRequestToasts } from "@/components/toast/useNetworkRequestToasts";
import { ToastKeyCollisionError, useToast } from "@/context/ToastContext";
import { useNetworkStatus } from "@/context/NetworkStatusContext";
import { useSavedPages } from "@/context/SavedPagesContext";
import { REQUEST_TIMEOUT_SECONDS } from "@/lib/network/requestTimeout";
import { usePathname } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  PageDataSource,
  RopewikiPageView,
  OfflineRopewikiPageView,
  SavedPage,
} from "ropegeo-common/models";

export type RopewikiPageScreenProps = {
  pageId: string;
  source: PageDataSource;
};

function RopewikiPageScreenInner({
  pageId,
  source,
  backTop,
  data,
  errors,
  timeoutCountdown,
  onRetryRequest,
}: {
  pageId: string;
  source: PageDataSource;
  backTop: number;
  data: RopewikiPageView | null;
  errors: Error | null;
  timeoutCountdown: number | null;
  onRetryRequest: () => void;
}) {
  useNetworkRequestToasts({
    errors,
    timeoutCountdown,
    resetKey: pageId,
    errorToastKey: TOAST_KEY_PAGE_ERROR,
    errorToastTitle: "Error loading page",
    incrementErrorMultipleOnCollision: true,
    onRetryRequest,
  });

  if (data == null) {
    return <RopewikiPagePlaceholder
      backTop={backTop}
      source={source}
      errorMessage={errors?.message}
    />;
  }
  return <RopewikiPageScreenBody pageId={pageId} data={data} />;
}

export function RopewikiPageScreen({
  pageId,
  source,
}: RopewikiPageScreenProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { isOnline } = useNetworkStatus();
  const { upsertPill } = useToast();
  const { savedEntries, replaceSaved, isLoading: savedPagesLoading } = useSavedPages();
  const savedEntry = savedEntries.find((e) => e.preview.id === pageId) ?? null;
  const [preferOfflineForSession, setPreferOfflineForSession] = useState(false);
  const shouldUseOffline =
    preferOfflineForSession && savedEntry?.downloadedPageViewPath != null;

  const downloadedPath = savedEntry?.downloadedPageViewPath ?? null;
  const [offlineBundleView, setOfflineBundleView] =
    useState<OfflineRopewikiPageView | null>(null);
  const [offlineReadFailedTryOnline, setOfflineReadFailedTryOnline] =
    useState(false);

  useEffect(() => {
    setOfflineReadFailedTryOnline(false);
  }, [pageId, downloadedPath]);

  useEffect(() => {
    // Lock source mode when entering a page so finishing a download in-place
    // does not switch from HTTP -> offline until the next visit.
    if (savedPagesLoading) return;
    setPreferOfflineForSession(savedEntry?.downloadedPageViewPath != null);
    // Intentionally omit savedEntry from deps: source mode is chosen on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, savedPagesLoading]);

  useEffect(() => {
    if (downloadedPath == null) {
      setOfflineBundleView(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        let info: Awaited<ReturnType<typeof FileSystem.getInfoAsync>> | null = null;
        try {
          info = await FileSystem.getInfoAsync(downloadedPath);
        } catch {
          info = null;
        }
        if (info != null && !info.exists) {
          if (savedEntry != null) {
            replaceSaved(
              new SavedPage(savedEntry.preview, savedEntry.savedAt, null),
            );
          }
          void deleteOfflineBundleFiles(pageId);
          return;
        }
        const text = await FileSystem.readAsStringAsync(downloadedPath);
        const raw = JSON.parse(text) as unknown;
        const view = OfflineRopewikiPageView.fromResult(raw);
        if (!cancelled) {
          setOfflineBundleView(view);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const staleOffline =
          /not readable|no such file|does not exist|ENOENT|not found/i.test(msg);
        if (staleOffline) {
          if (savedEntry != null) {
            replaceSaved(
              new SavedPage(savedEntry.preview, savedEntry.savedAt, null),
            );
          }
          void deleteOfflineBundleFiles(pageId);
          if (!cancelled) {
            setOfflineBundleView(null);
          }
        } else if (!cancelled) {
          const err = e instanceof Error ? e : new Error(String(e));
          setOfflineReadFailedTryOnline(true);
          setOfflineBundleView(null);
          const subtitle = err.message.trim();
          try {
            upsertPill({
              key: `${TOAST_KEY_PAGE_ERROR}-offline-bundle`,
              message: "Couldn't open saved page",
              subtitle: subtitle !== "" ? subtitle : undefined,
              durationMs: null,
              horizontalInset: TOAST_HORIZONTAL_INSET,
              allowedRoutes: [pathname],
            });
          } catch (toastErr) {
            if (!(toastErr instanceof ToastKeyCollisionError)) {
              throw toastErr;
            }
            upsertPill({
              key: `${TOAST_KEY_PAGE_ERROR}-offline-bundle`,
              message: "Couldn't open saved page",
              subtitle: subtitle !== "" ? subtitle : undefined,
              durationMs: null,
              horizontalInset: TOAST_HORIZONTAL_INSET,
              allowedRoutes: [pathname],
            });
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  // savedEntry is read for stale-bundle cleanup; effect is keyed by downloadedPath.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- savedEntry, pathname, upsertPill
  }, [pageId, downloadedPath, replaceSaved, pathname, upsertPill]);

  const backTop = insets.top + HEADER_ROW_TOP;

  const loaderOfflineData: RopewikiPageView | null | undefined = (() => {
    if (!shouldUseOffline || offlineReadFailedTryOnline) {
      return undefined;
    }
    if (offlineBundleView != null) {
      return offlineBundleView as unknown as RopewikiPageView;
    }
    return null;
  })();

  return (
    <RopeGeoDataLoader<RopewikiPageView>
      key={pageId}
      service={Service.WEBSCRAPER}
      method={Method.GET}
      onlinePath="/ropewiki/page/:id"
      onlinePathParams={{ id: pageId }}
      timeoutAfterSeconds={REQUEST_TIMEOUT_SECONDS}
      isOnline={isOnline}
      offlineData={loaderOfflineData}
    >
      {({ data, errors, timeoutCountdown, reload }) => (
          <RopewikiPageScreenInner
            pageId={pageId}
            source={source}
            backTop={backTop}
            data={data}
            errors={errors}
            timeoutCountdown={timeoutCountdown}
            onRetryRequest={reload}
          />
        )}
    </RopeGeoDataLoader>
  );
}
