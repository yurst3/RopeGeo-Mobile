import { useToast } from "@/context/ToastContext";
import { usePathname } from "expo-router";
import { useCallback, useMemo, useRef } from "react";

/**
 * Tab navigator listeners that dismiss route-scoped toasts when a tab gains focus.
 * Defer one microtask so `usePathname()` reflects the newly focused tab.
 */
export function useTabFocusToastScreenListeners() {
  const pathname = usePathname();
  const { dismissUnallowedToasts } = useToast();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const dismissForCurrentRoute = useCallback(() => {
    dismissUnallowedToasts(pathnameRef.current);
  }, [dismissUnallowedToasts]);

  return useMemo(
    () => ({
      focus: () => {
        queueMicrotask(dismissForCurrentRoute);
      },
    }),
    [dismissForCurrentRoute],
  );
}
