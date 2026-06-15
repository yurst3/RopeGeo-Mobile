import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export const ROUTE_MARKER_DESIGN_TEXT_SIZE = 12;
export const ROUTE_MARKER_DESIGN_TEXT_HALO_WIDTH = 1.5;
export const ROUTE_MARKER_DESIGN_TEXT_OFFSET_Y = 0.2;
/** Max accessibility scale for explore route marker icons and labels. */
export const ROUTE_MARKER_MAX_FONT_SCALE = 1.75;

export type RouteMarkerMetrics = {
  fontScale: number;
  scaledFontScale: number;
  iconSizeScale: number;
  textSize: number;
  textHaloWidth: number;
  textOffsetY: number;
};

export function getRouteMarkerMetrics(fontScale = 1): RouteMarkerMetrics {
  const scaledFontScale = Math.min(fontScale, ROUTE_MARKER_MAX_FONT_SCALE);
  return {
    fontScale,
    scaledFontScale,
    iconSizeScale: scaledFontScale,
    textSize: ROUTE_MARKER_DESIGN_TEXT_SIZE * scaledFontScale,
    textHaloWidth: ROUTE_MARKER_DESIGN_TEXT_HALO_WIDTH * scaledFontScale,
    textOffsetY: ROUTE_MARKER_DESIGN_TEXT_OFFSET_Y * scaledFontScale,
  };
}

export function useRouteMarkerMetrics(): RouteMarkerMetrics {
  const { fontScale } = useWindowDimensions();
  return useMemo(() => getRouteMarkerMetrics(fontScale), [fontScale]);
}
