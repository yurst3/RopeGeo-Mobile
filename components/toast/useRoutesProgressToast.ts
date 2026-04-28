import {
  formatRoutesLoadedSuccessTitle,
  formatRoutesLoadingTitle,
  formatRoutesRefreshingTitle,
  ROUTES_LOAD_SUCCESS_LINGER_MS,
  routesLoadingProgress01,
  type RoutesLoadToastSource,
} from "./routesLoading";
import { TOAST_HORIZONTAL_INSET } from "@/constants/toast";
import {
  TOAST_KEY_ROUTES_ERROR,
  TOAST_KEY_ROUTES_PROGRESS,
  getToastArchetypeForKey,
} from "@/constants/toastArchetypes";
import { ToastKeyNotFoundError, useToast } from "@/context/ToastContext";
import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";

const ROUTES_LOAD_ERROR_TOAST_TITLE = "Error loading routes";

export type RoutesProgressToastOptions = {
  resetKey?: string | number;
  horizontalInset?: number;
  /**
   * When false, dismiss the routes progress toast and skip syncing from this source (e.g. tab or
   * stack blur). Prevents "Loading routes" from staying visible on other tabs/screens.
   * @default true
   */
  surfaceActive?: boolean;
};

/**
 * Drives global toasts for paginated GET /routes: in-flight progress, then success/error linger.
 */
export function useRoutesProgressToast(
  state: RoutesLoadToastSource,
  options: RoutesProgressToastOptions,
): void {
  const { upsertProgress, updateToast, dismiss } = useToast();
  const pathname = usePathname();
  const prevRef = useRef<{ loading: boolean; errorMsg: string | null }>({
    loading: state.loading,
    errorMsg: state.errors?.message ?? null,
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  const surfaceActive = options.surfaceActive !== false;

  const resetKey = options.resetKey;
  useEffect(() => {
    dismiss(TOAST_KEY_ROUTES_PROGRESS);
    dismiss(TOAST_KEY_ROUTES_ERROR);
    const s = stateRef.current;
    prevRef.current = {
      loading: s.loading,
      errorMsg: s.errors?.message ?? null,
    };
  }, [resetKey, dismiss]);

  useEffect(() => {
    return () => {
      dismiss(TOAST_KEY_ROUTES_PROGRESS);
    };
  }, [dismiss]);

  const inset = options.horizontalInset ?? TOAST_HORIZONTAL_INSET;

  useEffect(() => {
    const { loading, errors, received } = state;
    const errorMsg = errors?.message ?? null;
    const prev = prevRef.current;

    if (!surfaceActive) {
      dismiss(TOAST_KEY_ROUTES_PROGRESS);
      prevRef.current = { loading, errorMsg };
      return;
    }

    if (loading) {
      dismiss(TOAST_KEY_ROUTES_ERROR);
      const title =
        state.refreshing === true
          ? formatRoutesRefreshingTitle(received, state.total)
          : formatRoutesLoadingTitle(received, state.total);
      const progress = routesLoadingProgress01(received, state.total);
      upsertProgress({
        key: TOAST_KEY_ROUTES_PROGRESS,
        progressKind: "progress",
        title,
        progress,
        horizontalInset: inset,
        durationMs: null,
        allowedRoutes: [pathname],
      });
      prevRef.current = { loading: true, errorMsg: null };
      return;
    }

    if (errors != null) {
      if (prev.loading) {
        dismiss(TOAST_KEY_ROUTES_PROGRESS);
        /** Same key may already exist from a prior error; `upsertProgress` replaces in place. */
        upsertProgress({
          key: TOAST_KEY_ROUTES_ERROR,
          progressKind: "error",
          title: ROUTES_LOAD_ERROR_TOAST_TITLE,
          progress: 0,
          horizontalInset: inset,
          durationMs: null,
          allowedRoutes: [pathname],
        });
      }
      prevRef.current = { loading: false, errorMsg };
      return;
    }

    dismiss(TOAST_KEY_ROUTES_ERROR);
    if (prev.loading) {
      try {
        updateToast(TOAST_KEY_ROUTES_PROGRESS, {
          mode: "progress",
          progressKind: "success",
          title: formatRoutesLoadedSuccessTitle(received),
          durationMs:
            getToastArchetypeForKey(TOAST_KEY_ROUTES_PROGRESS)?.durationMs ??
            ROUTES_LOAD_SUCCESS_LINGER_MS,
          allowedRoutes: [pathname],
        });
      } catch (error) {
        if (!(error instanceof ToastKeyNotFoundError)) {
          throw error;
        }
      }
    }
    prevRef.current = { loading: false, errorMsg: null };
  }, [
    resetKey,
    pathname,
    surfaceActive,
    state.loading,
    state.refreshing,
    state.errors,
    state.received,
    state.total,
    dismiss,
    upsertProgress,
    updateToast,
    inset,
  ]);
}
