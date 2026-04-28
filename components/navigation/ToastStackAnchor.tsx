import { STACKED_TOAST_BASE_OFFSET_BELOW_SAFE_TOP } from "@/components/minimap/shared/fullScreenMapLayout";
import { useToast } from "@/context/ToastContext";
import { usePathname } from "expo-router";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Matches ropewiki header row / back button inset for compact chrome. */
const ROPEWIKI_HEADER_ROW_TOP = 8;

export function computeToastStackAnchorY(pathname: string, insetsTop: number): number {
  const stacked = insetsTop + STACKED_TOAST_BASE_OFFSET_BELOW_SAFE_TOP;
  const compact = insetsTop + ROPEWIKI_HEADER_ROW_TOP;
  if (pathname.includes("/page")) return compact;
  if (pathname.includes("/region")) return compact;
  return stacked;
}

/**
 * Syncs the global toast stack anchor from the current route (must render under `ToastProvider`).
 */
export function ToastStackAnchor(): null {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { setToastStackTopPosition, dismissUnallowedToasts } = useToast();

  useEffect(() => {
    setToastStackTopPosition(computeToastStackAnchorY(pathname, insets.top));
    dismissUnallowedToasts(pathname);
  }, [pathname, insets.top, setToastStackTopPosition, dismissUnallowedToasts]);

  return null;
}
