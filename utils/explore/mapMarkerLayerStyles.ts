import type { MarkerColors } from "@/constants/colors/types";
import { MAPBOX_EMISSIVE_STRENGTH } from "@/constants/mapbox";
import { ROUTE_MARKER_CLUSTER_IMAGE } from "@/utils/mapbox/nativeMarkerImages";
import type { SymbolLayerStyle } from "@rnmapbox/maps";
import type { RouteMarkerMetrics } from "@/utils/layout/routeMarkerLayout";
import { ROUTE_MARKER_SDF_PADDING, routeMarkerIconSizeInterpolate } from "./routeMarkerIcons";

export const MAP_MARKER_ICON_OPACITY = 1;
/** Outline around marker icons, in points. */
export const MAP_MARKER_ICON_HALO_WIDTH = 1;
/**
 * Moves bottom-anchored markers down by the SDF image's bottom padding (`iconOffset` is in image
 * pixels), so the pin's tip, not the padding, sits on the point.
 */
const BOTTOM_ANCHOR_ICON_OFFSET: [number, number] = [0, ROUTE_MARKER_SDF_PADDING];

function mapMarkerIconPaint(iconColor: string, haloColor: string) {
  return {
    iconColor,
    iconOpacity: MAP_MARKER_ICON_OPACITY,
    iconEmissiveStrength: MAPBOX_EMISSIVE_STRENGTH,
    iconHaloColor: haloColor,
    iconHaloWidth: MAP_MARKER_ICON_HALO_WIDTH,
  };
}

export function unclusteredRouteMarkerSymbolStyle(
  marker: MarkerColors,
  iconImage: SymbolLayerStyle["iconImage"],
  iconSize: SymbolLayerStyle["iconSize"],
  markerMetrics: RouteMarkerMetrics,
  textFont: readonly string[],
): SymbolLayerStyle {
  return {
    iconImage,
    iconSize,
    ...mapMarkerIconPaint(marker.defaultIcon, marker.iconHalo),
    iconAllowOverlap: true,
    iconIgnorePlacement: true,
    iconAnchor: "bottom",
    iconOffset: BOTTOM_ANCHOR_ICON_OFFSET,
    textField: ["get", "name"],
    textFont: [...textFont],
    textSize: markerMetrics.textSize,
    textColor: marker.text,
    textEmissiveStrength: MAPBOX_EMISSIVE_STRENGTH,
    textHaloColor: marker.textHalo,
    textHaloWidth: markerMetrics.textHaloWidth,
    textOffset: [0, markerMetrics.textOffsetY],
    textAnchor: "top",
    textAllowOverlap: true,
    textIgnorePlacement: true,
  };
}

export function clusterRouteMarkerSymbolStyle(
  marker: MarkerColors,
  markerMetrics: RouteMarkerMetrics,
  textFont: readonly string[],
): SymbolLayerStyle {
  return {
    iconImage: ROUTE_MARKER_CLUSTER_IMAGE,
    iconSize: routeMarkerIconSizeInterpolate(markerMetrics.iconSizeScale),
    ...mapMarkerIconPaint(marker.clusterIcon, marker.iconHalo),
    iconAllowOverlap: true,
    iconIgnorePlacement: true,
    iconAnchor: "bottom",
    iconOffset: BOTTOM_ANCHOR_ICON_OFFSET,
    textField: [
      "concat",
      "(",
      ["to-string", ["get", "point_count"]],
      ")",
    ],
    textFont: [...textFont],
    textSize: markerMetrics.textSize,
    textColor: marker.text,
    textEmissiveStrength: MAPBOX_EMISSIVE_STRENGTH,
    textHaloColor: marker.textHalo,
    textHaloWidth: markerMetrics.textHaloWidth,
    textOffset: [0, markerMetrics.textOffsetY],
    textAnchor: "top",
    textAllowOverlap: true,
    textIgnorePlacement: true,
  };
}

export function pagePointIconSymbolStyle(
  marker: MarkerColors,
  iconImage: SymbolLayerStyle["iconImage"],
  iconSize: SymbolLayerStyle["iconSize"],
): SymbolLayerStyle {
  return {
    iconImage,
    iconSize,
    ...mapMarkerIconPaint(marker.defaultIcon, marker.iconHalo),
    iconAllowOverlap: true,
    iconIgnorePlacement: true,
    iconAnchor: "center",
  };
}

/** Vector-tile point labels on page minimaps (smaller type than route markers). */
export function pagePointLabelSymbolStyle(
  marker: MarkerColors,
  markerMetrics: RouteMarkerMetrics,
  textFont: readonly string[],
): SymbolLayerStyle {
  return {
    textField: ["coalesce", ["get", "name"], " "],
    textFont: [...textFont],
    textSize: markerMetrics.textSize,
    textColor: marker.text,
    textEmissiveStrength: MAPBOX_EMISSIVE_STRENGTH,
    textHaloColor: marker.textHalo,
    textHaloWidth: markerMetrics.textHaloWidth,
    textOffset: [0, markerMetrics.pageMiniMapTextOffsetY],
    textAnchor: "top",
    textPadding: markerMetrics.textPadding,
    textAllowOverlap: false,
    textIgnorePlacement: false,
    textMaxWidth: 8,
  };
}
