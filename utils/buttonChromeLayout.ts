import { getSearchBarMetrics } from "@/components/SearchBar";
import {
  HEADER_BUTTON_SIZE,
  MAP_BUTTON_SIZE,
  MAP_HEADER_ROW_TOP_INSET,
} from "@/components/minimap/shared/fullScreenMapLayout";
import { useText } from "@/context/TextContext";
import type { UiScaleProfile } from "@/constants/uiScale/types";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
  resolveButtonBackgroundScale,
  resolveButtonDimensions,
} from "./resolvers/resolveUiScale";

/** Base gap between adjacent chrome buttons (multiplied by resolved button `background`). */
export const BASE_CHROME_GAP = 8;

export function resolveChromeGap(
  backgroundScale: number,
  baseGap = BASE_CHROME_GAP,
): number {
  return Math.round(baseGap * backgroundScale);
}

export function resolveChromeGapFromSpec(
  uiScale: UiScaleProfile,
  buttonKey: keyof UiScaleProfile["common"]["buttons"],
  fontScale: number,
  baseGap = BASE_CHROME_GAP,
): number {
  const spec = uiScale.common.buttons[buttonKey];
  return resolveChromeGap(
    resolveButtonBackgroundScale(spec, uiScale.global, fontScale),
    baseGap,
  );
}

export type HeaderChromeLayout = {
  buttonSize: number;
  gap: number;
  sideSlotWidth: number;
  rowTopInset: number;
  buttonWrapHeight: number;
};

export function resolveHeaderChromeLayout(
  uiScale: UiScaleProfile,
  fontScale: number,
): HeaderChromeLayout {
  const spec = uiScale.common.buttons.back;
  const backgroundScale = resolveButtonBackgroundScale(
    spec,
    uiScale.global,
    fontScale,
  );
  const buttonSize = Math.round(HEADER_BUTTON_SIZE * backgroundScale);
  const gap = resolveChromeGap(backgroundScale);
  return {
    buttonSize,
    gap,
    sideSlotWidth: buttonSize + gap,
    rowTopInset: resolveChromeGap(backgroundScale, MAP_HEADER_ROW_TOP_INSET),
    buttonWrapHeight: buttonSize,
  };
}

export type MapButtonChromeLayout = {
  buttonSize: number;
  gap: number;
  stackMinWidth: number;
  topOffsetBelowHeader: number;
};

export function resolveMapButtonChromeLayout(
  uiScale: UiScaleProfile,
  fontScale: number,
): MapButtonChromeLayout {
  const headerSpec = uiScale.common.buttons.back;
  const mapSpec = uiScale.map.buttons.resetCameraToPosition;
  const headerBg = resolveButtonBackgroundScale(
    headerSpec,
    uiScale.global,
    fontScale,
  );
  const mapBg = resolveButtonBackgroundScale(mapSpec, uiScale.global, fontScale);
  const headerSize = Math.round(HEADER_BUTTON_SIZE * headerBg);
  const mapSize = Math.round(MAP_BUTTON_SIZE * mapBg);
  const headerGap = resolveChromeGap(headerBg);
  const mapGap = resolveChromeGap(mapBg);
  const rowTopInset = resolveChromeGap(headerBg, MAP_HEADER_ROW_TOP_INSET);
  return {
    buttonSize: mapSize,
    gap: mapGap,
    stackMinWidth: mapSize,
    topOffsetBelowHeader: rowTopInset + headerSize + headerGap,
  };
}

export type ExploreHeaderLayout = HeaderChromeLayout & {
  searchBarRightClearance: number;
  stackMinWidth: number;
};

export function resolveExploreHeaderLayout(
  uiScale: UiScaleProfile,
  fontScale: number,
): ExploreHeaderLayout {
  const header = resolveHeaderChromeLayout(uiScale, fontScale);
  const map = resolveMapButtonChromeLayout(uiScale, fontScale);
  return {
    ...header,
    stackMinWidth: map.stackMinWidth,
    searchBarRightClearance: map.stackMinWidth + map.gap,
  };
}

export function resolveStackedToastBaseOffsetBelowSafeTop(
  uiScale: UiScaleProfile,
  fontScale: number,
): number {
  const searchMetrics = getSearchBarMetrics(fontScale, uiScale);
  const header = resolveHeaderChromeLayout(uiScale, fontScale);
  return Math.round(searchMetrics.height + header.gap);
}

export function resolveToastHorizontalInset(
  uiScale: UiScaleProfile,
  fontScale: number,
  edgeMargin = 16,
): number {
  const header = resolveHeaderChromeLayout(uiScale, fontScale);
  return edgeMargin + header.sideSlotWidth;
}

export type RoutePreviewFloaterLayout = {
  floaterSize: number;
  floaterGap: number;
  floaterTopOffset: number;
};

export function resolveRoutePreviewFloaterLayout(
  uiScale: UiScaleProfile,
  fontScale: number,
): RoutePreviewFloaterLayout {
  const spec = uiScale.common.buttons.externalLink;
  const { size } = resolveButtonDimensions(
    spec,
    MAP_BUTTON_SIZE,
    uiScale.global,
    fontScale,
  );
  const gap = resolveChromeGapFromSpec(uiScale, "externalLink", fontScale);
  return {
    floaterSize: size,
    floaterGap: gap,
    floaterTopOffset: -(size + gap),
  };
}

export function expandedMiniMapButtonStackTopScaled(
  safeTop: number,
  boundsResetButtonVisible: boolean,
  uiScale: UiScaleProfile,
  fontScale: number,
  options?: { otherHeaderRowActionVisible?: boolean },
): number {
  const header = resolveHeaderChromeLayout(uiScale, fontScale);
  const map = resolveMapButtonChromeLayout(uiScale, fontScale);
  const shiftUpWhenBoundsHidden =
    !boundsResetButtonVisible && !options?.otherHeaderRowActionVisible;
  return (
    safeTop +
    (shiftUpWhenBoundsHidden ? header.rowTopInset : map.topOffsetBelowHeader)
  );
}

export function boundsPaddingForFullScreenMapScaled(
  insets: { top: number; bottom: number },
  uiScale: UiScaleProfile,
  fontScale: number,
) {
  const map = resolveMapButtonChromeLayout(uiScale, fontScale);
  return {
    paddingTop: insets.top + map.topOffsetBelowHeader + 24,
    paddingBottom: insets.bottom + 40,
    paddingLeft: 20,
    paddingRight: 20,
  } as const;
}

export function resolvePageHeaderStackLayout(
  uiScale: UiScaleProfile,
  fontScale: number,
) {
  const header = resolveHeaderChromeLayout(uiScale, fontScale);
  return {
    rowTop: header.rowTopInset,
    circleSize: header.buttonSize,
    stackGap: header.gap,
  };
}

export function useHeaderChromeLayout(): HeaderChromeLayout {
  const { uiScale } = useText();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveHeaderChromeLayout(uiScale, fontScale),
    [uiScale, fontScale],
  );
}

export function useMapButtonChromeLayout(): MapButtonChromeLayout {
  const { uiScale } = useText();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveMapButtonChromeLayout(uiScale, fontScale),
    [uiScale, fontScale],
  );
}

export function useExploreHeaderLayout(): ExploreHeaderLayout {
  const { uiScale } = useText();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveExploreHeaderLayout(uiScale, fontScale),
    [uiScale, fontScale],
  );
}

export function useRoutePreviewFloaterLayout(): RoutePreviewFloaterLayout {
  const { uiScale } = useText();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveRoutePreviewFloaterLayout(uiScale, fontScale),
    [uiScale, fontScale],
  );
}

export function useToastChromeLayout() {
  const { uiScale } = useText();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => ({
      horizontalInset: resolveToastHorizontalInset(uiScale, fontScale),
      stackedOffsetBelowSafeTop: resolveStackedToastBaseOffsetBelowSafeTop(
        uiScale,
        fontScale,
      ),
      compactHeaderRowTop: resolveHeaderChromeLayout(uiScale, fontScale)
        .rowTopInset,
    }),
    [uiScale, fontScale],
  );
}
