import type { MarkerColors } from "@/constants/colors/types";
import { ROUTE_MARKER_CLUSTER_IMAGE } from "@/lib/mapbox/nativeMarkerImages";
import type { SymbolLayerStyle } from "@rnmapbox/maps";
import type { RouteMarkerMetrics } from "@/utils/routeMarkerLayout";
import { routeMarkerIconSizeInterpolate } from "./routeMarkerIcons";

export function unclusteredRouteMarkerSymbolStyle(
  marker: MarkerColors,
  iconImage: SymbolLayerStyle["iconImage"],
  iconSize: SymbolLayerStyle["iconSize"],
  markerMetrics: RouteMarkerMetrics,
): SymbolLayerStyle {
  return {
    iconImage,
    iconSize,
    iconColor: marker.defaultIcon,
    iconAllowOverlap: true,
    iconIgnorePlacement: true,
    iconAnchor: "bottom",
    textField: ["get", "name"],
    textSize: markerMetrics.textSize,
    textColor: marker.text,
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
): SymbolLayerStyle {
  return {
    iconImage: ROUTE_MARKER_CLUSTER_IMAGE,
    iconSize: routeMarkerIconSizeInterpolate(markerMetrics.iconSizeScale),
    iconColor: marker.clusterIcon,
    iconAllowOverlap: true,
    iconIgnorePlacement: true,
    iconAnchor: "bottom",
    textField: [
      "concat",
      "(",
      ["to-string", ["get", "point_count"]],
      ")",
    ],
    textSize: markerMetrics.textSize,
    textColor: marker.text,
    textHaloColor: marker.textHalo,
    textHaloWidth: markerMetrics.textHaloWidth,
    textOffset: [0, markerMetrics.textOffsetY],
    textAnchor: "top",
    textAllowOverlap: true,
    textIgnorePlacement: true,
  };
}

/** Vector-tile point labels on page minimaps (smaller type than route markers). */
export function pagePointLabelSymbolStyle(
  marker: MarkerColors,
  markerMetrics: RouteMarkerMetrics,
): SymbolLayerStyle {
  return {
    textField: ["coalesce", ["get", "name"], " "],
    textSize: markerMetrics.textSize,
    textColor: marker.text,
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
