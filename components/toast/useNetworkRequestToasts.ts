import {
  DOWNLOAD_TOAST_BG,
  DOWNLOAD_TOAST_TEXT,
  NETWORK_REQUEST_SLOW_THRESHOLD_MS,
} from "@/constants/toast";
import {
  TOAST_KEY_NETWORK_OFFLINE,
  TOAST_KEY_NETWORK_RETRY,
  getToastArchetypeForKey,
} from "@/constants/toastArchetypes";
import { useNetworkStatus } from "@/context/NetworkStatusContext";
import { useToast } from "@/context/ToastContext";
import { NO_NETWORK_MESSAGE } from "@/lib/network/messages";
import { useIsFocused } from "@react-navigation/native";
import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";

const RETRY_ICON = require("@/assets/images/icons/buttons/retry.png");

const SLOW_THRESHOLD_SEC = Math.ceil(NETWORK_REQUEST_SLOW_THRESHOLD_MS / 1000);

export type UseNetworkRequestToastsArgs = {
  loading: boolean;
  errors: Error | null;
  timeoutCountdown: number | null;
  resetKey?: string | number;
  /**
   * When false, suppress the offline connectivity pill for this hook instance (e.g. a nested HTTP
   * surface while a parent already shows offline for the same screen). Defaults to true.
   */
  watchOffline?: boolean;
  /**
   * When false, suppress the offline pill (e.g. tab not focused while the screen stays mounted).
   * Defaults to true.
   */
  offlineSurfaceActive?: boolean;
  /** Optional explicit key for non-offline request errors. */
  errorToastKey?: string;
  /** Optional explicit key for "slow response" warnings. */
  slowToastKey?: string;
  /** Optional explicit key for offline connectivity pills. Defaults to global `network-offline`. */
  offlineToastKey?: string;
  /**
   * When true, an error toast key collision increments the existing toast's `multiple` counter.
   * Useful for repeated data-loading errors across screens.
   */
  incrementErrorMultipleOnCollision?: boolean;
  /** Optional specific title for this request surface (e.g. "Error getting search results"). */
  errorToastTitle?: string;
  /**
   * When in-flight request errors occur while online, shows one global "Retry" action toast
   * (deduped). Invoked when the user taps Retry (after the toast is dismissed).
   */
  onRetryRequest?: () => void;
};

/**
 * Slow-network and timeout pill toasts for screens using ropegeo-common HTTP wrappers (`timeoutCountdown`).
 * Pills and the shared slow-warning path only upsert while the host screen is focused (`useIsFocused`);
 * when blurred, this hook dismisses its `errorToastKey` and `slowToastKey` so stacked routes do not
 * inherit another screen’s request UI. The global `TOAST_KEY_NETWORK_RETRY` action toast is not
 * dismissed on blur here (multiple hook instances share it; the focused surface may upsert it).
 */
export function useNetworkRequestToasts(args: UseNetworkRequestToastsArgs): void {
  const { isOnline } = useNetworkStatus();
  const { upsertPill, upsertActionToast, dismiss } = useToast();
  const isFocused = useIsFocused();
  const pathname = usePathname();
  const prevOnlineRef = useRef<boolean | null>(null);
  /** Callers often pass an inline `onRetryRequest`; keep out of effect deps to avoid dismiss/upsert loops. */
  const onRetryRequestRef = useRef(args.onRetryRequest);
  onRetryRequestRef.current = args.onRetryRequest;
  const watchOffline = args.watchOffline !== false;
  const offlineSurfaceActive = args.offlineSurfaceActive !== false;
  const reset = String(args.resetKey ?? "default");
  const slowToastKey = args.slowToastKey ?? `${reset}-network-slow`;
  const errorToastKey = args.errorToastKey ?? `${reset}-network-error`;
  const offlineToastKey = args.offlineToastKey ?? TOAST_KEY_NETWORK_OFFLINE;
  /** Avoid effect churn when HTTP wrappers pass a new `Error` instance each render with the same message. */
  const errorMessageKey = args.errors?.message ?? null;

  useEffect(() => {
    dismiss(slowToastKey);
    dismiss(errorToastKey);
    dismiss(TOAST_KEY_NETWORK_RETRY);
  }, [args.resetKey, dismiss, errorToastKey, slowToastKey]);

  useEffect(() => {
    return () => {
      dismiss(slowToastKey);
      dismiss(errorToastKey);
      dismiss(TOAST_KEY_NETWORK_RETRY);
    };
  }, [dismiss, slowToastKey, errorToastKey]);

  useEffect(() => {
    if (!isFocused) {
      dismiss(slowToastKey);
      dismiss(errorToastKey);
      return;
    }

    if (!args.loading) {
      dismiss(slowToastKey);
      if (args.errors != null) {
        if (!isOnline) {
          dismiss(TOAST_KEY_NETWORK_RETRY);
          return;
        }
        const message = args.errorToastTitle ?? "Error";
        const trimmed = args.errors.message?.trim() ?? "";
        const subtitle = trimmed === "" ? undefined : trimmed;
        /** `upsertPill` updates the error pill in place when the key already exists. */
        upsertPill({
          key: errorToastKey,
          variant: "error",
          message,
          subtitle,
          durationMs: null,
          allowedRoutes: [pathname],
        });
        if (args.onRetryRequest != null) {
          upsertActionToast({
            key: TOAST_KEY_NETWORK_RETRY,
            message: "Retry",
            icon: RETRY_ICON,
            color: DOWNLOAD_TOAST_TEXT,
            backgroundColor: DOWNLOAD_TOAST_BG,
            durationMs: null,
            allowedRoutes: [pathname],
            onPress: () => {
              dismiss(TOAST_KEY_NETWORK_RETRY);
              onRetryRequestRef.current?.();
            },
          });
        } else {
          dismiss(TOAST_KEY_NETWORK_RETRY);
        }
      } else {
        dismiss(errorToastKey);
        dismiss(TOAST_KEY_NETWORK_RETRY);
      }
      return;
    }

    dismiss(errorToastKey);
    // Do not dismiss `TOAST_KEY_NETWORK_RETRY` here: other mounted hooks also run while `loading`
    // and share that global key; dismissing from every instance causes retry to flicker / exit-loop.
    if (
      args.timeoutCountdown != null &&
      args.timeoutCountdown <= SLOW_THRESHOLD_SEC &&
      args.timeoutCountdown >= 1
    ) {
      const message = `Waiting for network response ${args.timeoutCountdown}s`;
      upsertPill({
        key: slowToastKey,
        variant: "warning",
        message,
        durationMs: null,
        allowedRoutes: [pathname],
      });
    } else {
      dismiss(slowToastKey);
    }
  }, [
    isFocused,
    isOnline,
    pathname,
    args.loading,
    errorMessageKey,
    args.timeoutCountdown,
    dismiss,
    args.errorToastTitle,
    errorToastKey,
    upsertPill,
    upsertActionToast,
    slowToastKey,
  ]);

  useEffect(() => {
    if (!watchOffline) {
      dismiss(offlineToastKey);
      prevOnlineRef.current = null;
      return;
    }

    if (prevOnlineRef.current === null) {
      prevOnlineRef.current = isOnline;
      if (!isOnline && offlineSurfaceActive && isFocused) {
        const defaultAllowed = getToastArchetypeForKey(offlineToastKey)?.allowedRoutes;
        upsertPill({
          key: offlineToastKey,
          variant: "error",
          message: NO_NETWORK_MESSAGE,
          durationMs: null,
          allowedRoutes: defaultAllowed,
        });
      }
      return;
    }

    const wasOnline = prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (isOnline && !wasOnline) {
      dismiss(offlineToastKey);
    }

    if (!offlineSurfaceActive) {
      dismiss(offlineToastKey);
      return;
    }

    if (!isOnline && wasOnline) {
      dismiss(offlineToastKey);
      if (isFocused) {
        const defaultAllowed = getToastArchetypeForKey(offlineToastKey)?.allowedRoutes;
        upsertPill({
          key: offlineToastKey,
          variant: "error",
          message: NO_NETWORK_MESSAGE,
          durationMs: null,
          allowedRoutes: defaultAllowed,
        });
      }
    } else if (!isOnline) {
      if (isFocused) {
        const defaultAllowed = getToastArchetypeForKey(offlineToastKey)?.allowedRoutes;
        upsertPill({
          key: offlineToastKey,
          variant: "error",
          message: NO_NETWORK_MESSAGE,
          durationMs: null,
          allowedRoutes: defaultAllowed,
        });
      }
    }
  }, [isFocused, isOnline, watchOffline, offlineSurfaceActive, dismiss, offlineToastKey, upsertPill]);
}
