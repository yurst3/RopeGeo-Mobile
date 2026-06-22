import { FontSizeStep } from "@/constants/uiScale/types";
import { useText } from "@/context/TextContext";
import { resolveConstantSize } from "@/utils/resolvers";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export const ROUTE_MARKER_DESIGN_TEXT_HALO_WIDTH = 1.5;
export const ROUTE_MARKER_DESIGN_TEXT_OFFSET_Y = 0.2;
/** Mapbox `ShapeSource` cluster radius at medium profile / fontScale 1. */
export const ROUTE_MARKER_DESIGN_CLUSTER_RADIUS = 50;
/** Baseline route marker label size (medium profile `markerLabel` default). */
export const ROUTE_MARKER_DESIGN_LABEL_TEXT_SIZE = FontSizeStep.SMALL;
/** Symbol collision padding around marker labels at baseline scale. */
export const ROUTE_MARKER_DESIGN_TEXT_PADDING = 2;
/** Page minimap vector-tile label offset below point (baseline). */
export const PAGE_MINIMAP_DESIGN_TEXT_OFFSET_Y = 2.1;
/** Max accessibility scale for explore route marker icons and labels. */
export const ROUTE_MARKER_MAX_FONT_SCALE = 1.75;

export type RouteMarkerMetrics = {
  fontScale: number;
  scaledFontScale: number;
  iconSizeScale: number;
  textSize: number;
  textHaloWidth: number;
  textOffsetY: number;
  textPadding: number;
  pageMiniMapTextOffsetY: number;
  clusterRadius: number;
};

export function resolveRouteMarkerClusterRadius(
  textSize: number,
  iconSizeScale: number,
): number {
  const textScale = textSize / ROUTE_MARKER_DESIGN_LABEL_TEXT_SIZE;
  return Math.round(
    ROUTE_MARKER_DESIGN_CLUSTER_RADIUS * Math.max(textScale, iconSizeScale),
  );
}

export function resolveRouteMarkerTextPadding(textSize: number): number {
  return Math.max(
    1,
    Math.round(
      ROUTE_MARKER_DESIGN_TEXT_PADDING *
        (textSize / ROUTE_MARKER_DESIGN_LABEL_TEXT_SIZE),
    ),
  );
}

export function resolvePageMiniMapTextOffsetY(textSize: number): number {
  return (
    PAGE_MINIMAP_DESIGN_TEXT_OFFSET_Y *
    (textSize / ROUTE_MARKER_DESIGN_LABEL_TEXT_SIZE)
  );
}

export function useRouteMarkerMetrics(): RouteMarkerMetrics {
  const { uiScale } = useText();
  const { fontScale } = useWindowDimensions();
  return useMemo(() => {
    const scaledFontScale = Math.min(fontScale, ROUTE_MARKER_MAX_FONT_SCALE);
    const textSize = resolveConstantSize(
      uiScale.map.text.markerLabel,
      uiScale.global,
      fontScale,
    );
    const textPadding = resolveRouteMarkerTextPadding(textSize);
    return {
      fontScale,
      scaledFontScale,
      iconSizeScale: scaledFontScale,
      textSize,
      textHaloWidth: ROUTE_MARKER_DESIGN_TEXT_HALO_WIDTH * scaledFontScale,
      textOffsetY: ROUTE_MARKER_DESIGN_TEXT_OFFSET_Y * scaledFontScale,
      textPadding,
      pageMiniMapTextOffsetY: resolvePageMiniMapTextOffsetY(textSize),
      clusterRadius: resolveRouteMarkerClusterRadius(textSize, scaledFontScale),
    };
  }, [fontScale, uiScale]);
}
