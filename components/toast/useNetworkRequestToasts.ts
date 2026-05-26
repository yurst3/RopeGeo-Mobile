import { NETWORK_REQUEST_SLOW_THRESHOLD_MS } from "@/constants/toasts";
import {
  TOAST_KEY_NETWORK_OFFLINE,
  TOAST_KEY_NETWORK_RETRY,
} from "@/constants/toasts/toastArchetypes";
import { getToastArchetypeForKey } from "@/constants/toasts/helpers";
import { useNetworkStatus } from "@/context/NetworkStatusContext";
import { useToast } from "@/context/ToastContext";
import { NO_NETWORK_MESSAGE } from "@/lib/network/messages";
import { useIsFocused } from "@react-navigation/native";
import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";

const RETRY_ICON = require("@/assets/images/icons/buttons/retry.png");

const SLOW_THRESHOLD_SEC = Math.ceil(NETWORK_REQUEST_SLOW_THRESHOLD_MS / 1000);

export type UseNetworkRequestToastsArgs = {
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
 * Slow-network and timeout pill toasts for screens using ropegeo-common data loaders (`timeoutCountdown`
 * is numeric only while an online fetch is in flight when `timeoutAfterSeconds` is set).
 * Pills and the shared slow-warning path only upsert while the host screen is focused (`useIsFocused`);
 * when blurred, this hook dismisses its `errorToastKey` and `slowToastKey` so stacked routes do not
 * inherit another screen’s request UI. The global `TOAST_KEY_NETWORK_RETRY` action toast is not
 * dismissed on blur here (multiple hook instances share it; the focused surface may upsert it).
 * Error pills are suppressed while offline; {@link NO_NETWORK_MESSAGE} uses the same path.
 */
export function useNetworkRequestToasts(args: UseNetworkRequestToastsArgs): void {
  const { isOnline } = useNetworkStatus();
  const { upsertPill, upsertActionToast, dismiss, incrementMultiple } = useToast();
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
  const prevResetKeyForErrorBumpRef = useRef<string | number | undefined>(undefined);

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

    const slowInRange =
      args.timeoutCountdown != null &&
      args.timeoutCountdown <= SLOW_THRESHOLD_SEC &&
      args.timeoutCountdown >= 1;

    if (isOnline && slowInRange) {
      const message = `Waiting for network response ${args.timeoutCountdown}s`;
      upsertPill({
        key: slowToastKey,
        message,
        durationMs: null,
        allowedRoutes: [pathname],
      });
    } else {
      dismiss(slowToastKey);
    }

    if (args.errors != null) {
      if (!isOnline) {
        dismiss(TOAST_KEY_NETWORK_RETRY);
        return;
      }
      const message = args.errorToastTitle ?? "Error";
      const trimmed = args.errors.message?.trim() ?? "";
      const subtitle = trimmed === "" ? undefined : trimmed;
      const resetNow = args.resetKey ?? "default";
      const priorReset = prevResetKeyForErrorBumpRef.current;
      prevResetKeyForErrorBumpRef.current = resetNow;
      upsertPill({
        key: errorToastKey,
        message,
        subtitle,
        durationMs: null,
        allowedRoutes: [pathname],
      });
      if (
        args.incrementErrorMultipleOnCollision === true &&
        priorReset !== undefined &&
        priorReset !== resetNow
      ) {
        queueMicrotask(() => {
          try {
            incrementMultiple(errorToastKey);
          } catch {
            // No existing pill for this key (e.g. first paint).
          }
        });
      }
      if (args.onRetryRequest != null) {
        upsertActionToast({
          key: TOAST_KEY_NETWORK_RETRY,
          message: "Retry",
          icon: RETRY_ICON,
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
      prevResetKeyForErrorBumpRef.current = undefined;
      dismiss(errorToastKey);
      dismiss(TOAST_KEY_NETWORK_RETRY);
    }
  }, [
    isFocused,
    isOnline,
    pathname,
    args.timeoutCountdown,
    errorMessageKey,
    args.errorToastTitle,
    args.onRetryRequest,
    dismiss,
    upsertPill,
    upsertActionToast,
    slowToastKey,
    errorToastKey,
    incrementMultiple,
    args.resetKey,
    args.incrementErrorMultipleOnCollision,
  ]);

  useEffect(() => {
    if (!watchOffline || !offlineSurfaceActive || !isFocused) {
      return;
    }
    const wasOnline = prevOnlineRef.current;
    prevOnlineRef.current = isOnline;
    if (wasOnline === isOnline) {
      return;
    }
    if (!isOnline) {
      const defaultAllowed = getToastArchetypeForKey(offlineToastKey)?.allowedRoutes;
      if (wasOnline === true) {
        upsertPill({
          key: offlineToastKey,
          message: NO_NETWORK_MESSAGE,
          durationMs: null,
          allowedRoutes: defaultAllowed,
        });
      } else if (wasOnline === null) {
        upsertPill({
          key: offlineToastKey,
          message: NO_NETWORK_MESSAGE,
          durationMs: null,
          allowedRoutes: defaultAllowed,
        });
      } else {
        upsertPill({
          key: offlineToastKey,
          message: NO_NETWORK_MESSAGE,
          durationMs: null,
          allowedRoutes: defaultAllowed,
        });
      }
    } else {
      dismiss(offlineToastKey);
    }
  }, [isFocused, isOnline, watchOffline, offlineSurfaceActive, dismiss, offlineToastKey, upsertPill]);
}
