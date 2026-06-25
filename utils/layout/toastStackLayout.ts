import { FontSizeStep } from "@/constants/uiScale/types";
import type { UiScaleProfile } from "@/constants/uiScale/types";
import { TOAST_STACK_GAP } from "@/constants/toasts";
import { resolveScalingBounds } from "@/utils/theme/resolvers";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useText } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";

/** {@link Toast} wrap `minHeight` at design scale. */
export const TOAST_WRAP_MIN_HEIGHT_DESIGN = 44;

export type ToastStackLayoutMetrics = {
  stackGap: number;
  /** Placeholder row height until {@link onLayout} reports an exact measurement. */
  unmeasuredRowHeight: number;
};

export function getToastStackLayoutMetrics(
  uiScale: UiScaleProfile,
  fontScale: number,
): ToastStackLayoutMetrics {
  const { global, toast } = uiScale;
  const messageCapSize = resolveScalingBounds(
    toast.text.message,
    global,
    fontScale,
  ).maxFontSize;
  const sizeScale = messageCapSize / FontSizeStep.MEDIUM;
  return {
    stackGap: Math.round(TOAST_STACK_GAP * sizeScale),
    unmeasuredRowHeight: Math.round(TOAST_WRAP_MIN_HEIGHT_DESIGN * sizeScale),
  };
}

export function useToastStackLayoutMetrics(): ToastStackLayoutMetrics {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => getToastStackLayoutMetrics(uiScale, fontScale),
    [uiScale, fontScale],
  );
}
