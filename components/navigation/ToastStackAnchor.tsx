import { useToastChromeLayout } from "@/utils/buttonChromeLayout";
import { routePathFromSegments } from "@/constants/toasts/helpers";
import { useToast } from "@/context/ToastContext";
import { usePathname, useSegments } from "expo-router";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function computeToastStackAnchorY(
  pathname: string,
  insetsTop: number,
  stackedOffsetBelowSafeTop: number,
  compactHeaderRowTop: number,
): number {
  const stacked = insetsTop + stackedOffsetBelowSafeTop;
  const compact = insetsTop + compactHeaderRowTop;
  if (pathname.includes("/page")) return compact;
  if (pathname.includes("/region")) return compact;
  return stacked;
}

/**
 * Syncs the global toast stack anchor from the current route (must render under `ToastProvider`).
 */
export function ToastStackAnchor(): null {
  const pathname = usePathname();
  const segments = useSegments();
  const segmentPath = routePathFromSegments(segments);
  const insets = useSafeAreaInsets();
  const toastChrome = useToastChromeLayout();
  const { setToastStackTopPosition, dismissUnallowedToasts } = useToast();

  useEffect(() => {
    setToastStackTopPosition(
      computeToastStackAnchorY(
        pathname,
        insets.top,
        toastChrome.stackedOffsetBelowSafeTop,
        toastChrome.compactHeaderRowTop,
      ),
    );
    dismissUnallowedToasts(segmentPath);
  }, [
    pathname,
    segmentPath,
    insets.top,
    toastChrome.stackedOffsetBelowSafeTop,
    toastChrome.compactHeaderRowTop,
    setToastStackTopPosition,
    dismissUnallowedToasts,
  ]);

  return null;
}
