import type { MarkerColors } from "@/constants/colors/types";
import { ROUTE_MARKER_CLUSTER_IMAGE } from "@/lib/mapbox/nativeMarkerImages";
import type { SymbolLayerStyle } from "@rnmapbox/maps";
import { ROUTE_MARKER_ICON_SIZE_INTERPOLATE } from "./routeMarkerIcons";

export function unclusteredRouteMarkerSymbolStyle(
  marker: MarkerColors,
  iconImage: SymbolLayerStyle["iconImage"],
  iconSize: SymbolLayerStyle["iconSize"],
): SymbolLayerStyle {
  return {
    iconImage,
    iconSize,
    iconColor: marker.defaultIcon,
    iconAllowOverlap: true,
    iconIgnorePlacement: true,
    iconAnchor: "bottom",
    textField: ["get", "name"],
    textSize: 12,
    textColor: marker.text,
    textHaloColor: marker.textHalo,
    textHaloWidth: 1.5,
    textOffset: [0, 0.2],
    textAnchor: "top",
    textAllowOverlap: true,
    textIgnorePlacement: true,
  };
}

export function clusterRouteMarkerSymbolStyle(
  marker: MarkerColors,
): SymbolLayerStyle {
  return {
    iconImage: ROUTE_MARKER_CLUSTER_IMAGE,
    iconSize: ROUTE_MARKER_ICON_SIZE_INTERPOLATE,
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
    textSize: 12,
    textColor: marker.text,
    textHaloColor: marker.textHalo,
    textHaloWidth: 1.5,
    textOffset: [0, 0.2],
    textAnchor: "top",
    textAllowOverlap: true,
    textIgnorePlacement: true,
  };
}

/** Vector-tile point labels on page minimaps (smaller type than route markers). */
export function pagePointLabelSymbolStyle(
  marker: MarkerColors,
): SymbolLayerStyle {
  return {
    textField: ["coalesce", ["get", "name"], " "],
    textSize: 11,
    textColor: marker.text,
    textHaloColor: marker.textHalo,
    textHaloWidth: 1.2,
    textOffset: [0, 2.1],
    textAnchor: "top",
    textAllowOverlap: true,
    textIgnorePlacement: true,
    textMaxWidth: 8,
  };
}
