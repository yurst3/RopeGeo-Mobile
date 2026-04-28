import { TOAST_HORIZONTAL_INSET } from "@/constants/toast";
import {
  TOAST_KEY_DEV_NETWORK_INTERNET_REACHABLE,
  TOAST_KEY_DEV_NETWORK_IS_CONNECTED,
} from "@/constants/toastArchetypes";
import { useNetworkStatus } from "@/context/NetworkStatusContext";
import type { ToastVariant } from "@/components/toast/Toast";
import { useToast } from "@/context/ToastContext";
import { useEffect } from "react";

function formatNetworkFlag(
  value: boolean | null | undefined,
): "true" | "false" | "null" {
  if (value === true) return "true";
  if (value === false) return "false";
  return "null";
}

function variantForNetworkFlag(
  value: boolean | null | undefined,
): ToastVariant {
  if (value === true) return "success";
  if (value === false) return "error";
  return "warning";
}

/**
 * Renders nothing; when `SHOW_NETWORK_STATE` is true, drives two non-expiring pill toasts with
 * raw expo-network flags (must be mounted under `ToastProvider` and `NetworkStatusProvider`).
 */
export function NetworkStateDebugToasts(): null {
  const { networkState } = useNetworkStatus();
  const { upsertPill, dismiss } = useToast();

  useEffect(() => {
    return () => {
      dismiss(TOAST_KEY_DEV_NETWORK_IS_CONNECTED);
      dismiss(TOAST_KEY_DEV_NETWORK_INTERNET_REACHABLE);
    };
  }, [dismiss]);

  useEffect(() => {
    const connected = networkState?.isConnected;
    const reachable = networkState?.isInternetReachable;

    upsertPill({
      key: TOAST_KEY_DEV_NETWORK_IS_CONNECTED,
      variant: variantForNetworkFlag(connected),
      message: `isConnected: ${formatNetworkFlag(connected)}`,
      durationMs: null,
      horizontalInset: TOAST_HORIZONTAL_INSET,
    });
    upsertPill({
      key: TOAST_KEY_DEV_NETWORK_INTERNET_REACHABLE,
      variant: variantForNetworkFlag(reachable),
      message: `isInternetReachable: ${formatNetworkFlag(reachable)}`,
      durationMs: null,
      horizontalInset: TOAST_HORIZONTAL_INSET,
    });
  }, [networkState, upsertPill]);

  return null;
}
