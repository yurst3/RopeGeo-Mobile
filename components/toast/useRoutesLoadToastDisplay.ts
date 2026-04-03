import { useEffect, useRef, useState } from "react";
import type { ProgressToastKind } from "./ProgressToast";
import {
  ROUTES_LOAD_ERROR_LINGER_MS,
  ROUTES_LOAD_SUCCESS_LINGER_MS,
  formatRoutesLoadedSuccessTitle,
  formatRoutesLoadingTitle,
  routesLoadingProgress01,
} from "./routesLoading";

const ROUTES_LOAD_ERROR_TOAST_TITLE = "Error loading routes";

export type RoutesLoadToastSource = {
  loading: boolean;
  errors: Error | null;
  received: number;
  total: number | null;
};

export type RoutesLoadToastView =
  | { visible: false }
  | {
      visible: true;
      kind: ProgressToastKind;
      title: string;
      progress?: number;
    };

type Linger =
  | { phase: "success"; title: string }
  | { phase: "error"; title: string };

/**
 * Drives {@link ProgressToast} for paginated routes: in-flight progress, then success/error linger.
 * Pass `resetKey` (e.g. region id or params fingerprint) to cancel linger when the fetch context changes.
 */
export function useRoutesLoadToastDisplay(
  state: RoutesLoadToastSource,
  options?: { resetKey?: string | number },
): RoutesLoadToastView {
  const [linger, setLinger] = useState<Linger | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRef = useRef<{ loading: boolean; errorMsg: string | null }>({
    loading: state.loading,
    errorMsg: state.errors?.message ?? null,
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  const clearTimer = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const resetKey = options?.resetKey;
  useEffect(() => {
    clearTimer();
    setLinger(null);
    const s = stateRef.current;
    prevRef.current = {
      loading: s.loading,
      errorMsg: s.errors?.message ?? null,
    };
  }, [resetKey]);

  useEffect(() => {
    const { loading, errors, received } = state;
    const errorMsg = errors?.message ?? null;
    const prev = prevRef.current;

    if (loading) {
      clearTimer();
      setLinger(null);
      prevRef.current = { loading: true, errorMsg: null };
      return;
    }

    if (errors != null) {
      if (prev.loading) {
        clearTimer();
        setLinger({
          phase: "error",
          title: ROUTES_LOAD_ERROR_TOAST_TITLE,
        });
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          setLinger(null);
        }, ROUTES_LOAD_ERROR_LINGER_MS);
      }
      prevRef.current = { loading: false, errorMsg };
      return;
    }

    if (prev.loading) {
      clearTimer();
      setLinger({
        phase: "success",
        title: formatRoutesLoadedSuccessTitle(received),
      });
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setLinger(null);
      }, ROUTES_LOAD_SUCCESS_LINGER_MS);
    }
    prevRef.current = { loading: false, errorMsg: null };
  }, [state]);

  if (state.loading && state.errors == null) {
    return {
      visible: true,
      kind: "progress",
      title: formatRoutesLoadingTitle(state.received, state.total),
      progress: routesLoadingProgress01(state.received, state.total),
    };
  }

  if (linger != null) {
    return {
      visible: true,
      kind: linger.phase === "success" ? "success" : "error",
      title: linger.title,
    };
  }

  return { visible: false };
}
