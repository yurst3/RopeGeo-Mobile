import type {
  ButtonScaleSpec,
  ConstantTextSizeSpec,
  ScalingTextSizeSpec,
} from "@/constants/uiScale/types";
import type { TypographySpec } from "@/constants/text/style/types";
import { TEXT_STYLE } from "@/constants/text/style";
import { useText, useFontProfileKey } from "@/context/TextContext";
import { useUiScale, useUiScaleProfileKey } from "@/context/UIScaleContext";
import { useMemo } from "react";
import { useWindowDimensions, type TextStyle } from "react-native";

import {
  resolveButtonBackgroundScale,
  resolveButtonConstantSubtextSize,
  resolveButtonConstantTextSize,
  resolveButtonDimensions,
  resolveButtonIconScale,
  resolveButtonSelectableScale,
  resolveButtonSubtextBounds,
  resolveButtonTextBounds,
  resolveGlobalIconSizeScale,
  resolveMultiSliderThumbScale,
  resolveConstantTextSize,
  resolveScalingTextBounds,
  resolveTypographyStyle,
  resolveMapTextFontStack,
} from "./resolveUiScale";

export function useResolvedIconSizeScale(): number {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveGlobalIconSizeScale(uiScale.global, fontScale),
    [uiScale.global, fontScale],
  );
}

export function useResolvedMultiSliderThumbScale(): number {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveMultiSliderThumbScale(uiScale.filter, uiScale.global, fontScale),
    [uiScale.filter, uiScale.global, fontScale],
  );
}

export function useResolvedButtonBackgroundScale(spec: ButtonScaleSpec): number {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveButtonBackgroundScale(spec, uiScale.global, fontScale),
    [spec, uiScale.global, fontScale],
  );
}

export function useResolvedButtonIconScale(spec: ButtonScaleSpec): number {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveButtonIconScale(spec, uiScale.global, fontScale),
    [spec, uiScale.global, fontScale],
  );
}

export function useResolvedButtonSelectableScale(spec: ButtonScaleSpec): number {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveButtonSelectableScale(spec, uiScale.global, fontScale),
    [spec, uiScale.global, fontScale],
  );
}

export function useResolvedButtonDimensions(
  spec: ButtonScaleSpec,
  baseSize: number,
  designIconScale = 1,
): { size: number; iconScale: number } {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () =>
      resolveButtonDimensions(
        spec,
        baseSize,
        uiScale.global,
        fontScale,
        designIconScale,
      ),
    [spec, baseSize, uiScale.global, fontScale, designIconScale],
  );
}

export function useResolvedButtonConstantTextSize(
  spec: ButtonScaleSpec,
): number | undefined {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveButtonConstantTextSize(spec, uiScale.global, fontScale),
    [spec, uiScale.global, fontScale],
  );
}

export function useResolvedButtonSubtextBounds(
  spec: ButtonScaleSpec,
): { maxFontSize: number; minFontSize: number } | undefined {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveButtonSubtextBounds(spec, uiScale.global, fontScale),
    [spec, uiScale.global, fontScale],
  );
}

export function useResolvedButtonConstantSubtextSize(
  spec: ButtonScaleSpec,
): number | undefined {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveButtonConstantSubtextSize(spec, uiScale.global, fontScale),
    [spec, uiScale.global, fontScale],
  );
}

export function useResolvedButtonTextBounds(
  spec: ButtonScaleSpec,
): { maxFontSize: number; minFontSize: number } | undefined {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveButtonTextBounds(spec, uiScale.global, fontScale),
    [spec, uiScale.global, fontScale],
  );
}

export function useResolvedConstantTextSize(spec: ConstantTextSizeSpec): number {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveConstantTextSize(spec, uiScale.global, fontScale),
    [spec, uiScale.global, fontScale],
  );
}

export function useResolvedScalingTextBounds(spec: ScalingTextSizeSpec): {
  maxFontSize: number;
  minFontSize: number;
} {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveScalingTextBounds(spec, uiScale.global, fontScale),
    [spec, uiScale.global, fontScale],
  );
}

export function useResolvedTypography(typography: TypographySpec): TextStyle {
  const { font } = useText();
  return useMemo(
    () => resolveTypographyStyle(typography, font),
    [typography, font],
  );
}

export function useMapMarkerTextFont(
  typography: TypographySpec = TEXT_STYLE.map.markerLabel,
): readonly string[] {
  const { font } = useText();
  return useMemo(
    () => resolveMapTextFontStack(typography, font),
    [typography, font],
  );
}

export function useTextMeasureKey(): string {
  const uiScaleProfileKey = useUiScaleProfileKey();
  const fontProfileKey = useFontProfileKey();
  const { fontScale } = useWindowDimensions();
  return `${uiScaleProfileKey}-${fontProfileKey}-${fontScale}`;
}

/** @deprecated use {@link useResolvedConstantTextSize} */
export const useResolvedConstantSize = useResolvedConstantTextSize;
/** @deprecated use {@link useResolvedScalingTextBounds} */
export const useResolvedScalingBounds = useResolvedScalingTextBounds;
