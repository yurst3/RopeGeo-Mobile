import type { SymbolLayerStyle } from "@rnmapbox/maps";

/**
 * Mapbox `Images` keys + {@link unclusteredRouteMarkerIconImage} for route {@link ShapeSource} layers.
 */
export const ROUTE_MARKER_IMAGES = {
  "route-marker": require("@/assets/images/icons/markers/marker.png"),
  "route-marker-cluster": require("@/assets/images/icons/markers/markerCluster.png"),
  "route-marker-selected": require("@/assets/images/icons/markers/markerSelected.png"),
} as const;

/**
 * Route marker icon size (constant screen size at all zoom levels).
 * The zoom-22 value must be (ICON_SIZE_AT_ZOOM_0 * 2^-22) so the icon doesn't scale with zoom.
 */
export const ROUTE_MARKER_ICON_SIZE_AT_ZOOM_0 = 0.05;
export const ROUTE_MARKER_ICON_SIZE_AT_ZOOM_22 =
  ROUTE_MARKER_ICON_SIZE_AT_ZOOM_0 * 2 ** -22;

/** Shared `iconSize` expression for route marker SymbolLayers. */
export const ROUTE_MARKER_ICON_SIZE_INTERPOLATE =
  [
    "interpolate",
    ["exponential", 2],
    ["zoom"],
    0,
    ROUTE_MARKER_ICON_SIZE_AT_ZOOM_0,
    22,
    ROUTE_MARKER_ICON_SIZE_AT_ZOOM_22,
  ] as SymbolLayerStyle["iconSize"];

/** Unclustered selected markers (focused / accent) render this much larger than default. */
export const SELECTED_ROUTE_MARKER_ICON_SIZE_MULTIPLIER = 1.5;

/**
 * Data-driven `iconSize` for unclustered points: larger when `id` matches tap focus or accent.
 *
 * Mapbox requires `["zoom"]` only under a top-level `interpolate`/`step` for layout properties like
 * `icon-size`; wrapping an interpolate inside `case` or `*` is rejected (see Mapbox native error).
 */
export function unclusteredRouteMarkerIconSize(
  focusedRouteId: string | null | undefined,
  accentRouteId: string | null | undefined,
): SymbolLayerStyle["iconSize"] {
  const ids = new Set<string>();
  if (focusedRouteId) ids.add(focusedRouteId);
  if (accentRouteId) ids.add(accentRouteId);

  const z0 = ROUTE_MARKER_ICON_SIZE_AT_ZOOM_0;
  const z22 = ROUTE_MARKER_ICON_SIZE_AT_ZOOM_22;
  const m = SELECTED_ROUTE_MARKER_ICON_SIZE_MULTIPLIER;
  const key: ["to-string", ["get", "id"]] = ["to-string", ["get", "id"]];

  if (ids.size === 0) {
    return ROUTE_MARKER_ICON_SIZE_INTERPOLATE;
  }
  if (ids.size === 1) {
    const id = [...ids][0];
    const cond = ["==", key, id] as ["==", typeof key, string];
    return [
      "interpolate",
      ["exponential", 2],
      ["zoom"],
      0,
      ["case", cond, z0 * m, z0],
      22,
      ["case", cond, z22 * m, z22],
    ] as SymbolLayerStyle["iconSize"];
  }
  const cond = [
    "any",
    ...[...ids].map((id) => ["==", key, id] as ["==", typeof key, string]),
  ] as ["any", ...["==", typeof key, string][]];
  return [
    "interpolate",
    ["exponential", 2],
    ["zoom"],
    0,
    ["case", cond, z0 * m, z0],
    22,
    ["case", cond, z22 * m, z22],
  ] as SymbolLayerStyle["iconSize"];
}

/**
 * Data-driven `iconImage` for unclustered points: selected when `id` matches tap focus or accent (e.g. centered route).
 */
export function unclusteredRouteMarkerIconImage(
  focusedRouteId: string | null | undefined,
  accentRouteId: string | null | undefined,
): SymbolLayerStyle["iconImage"] {
  const ids = new Set<string>();
  if (focusedRouteId) ids.add(focusedRouteId);
  if (accentRouteId) ids.add(accentRouteId);
  if (ids.size === 0) return "route-marker";

  const key: ["to-string", ["get", "id"]] = ["to-string", ["get", "id"]];
  if (ids.size === 1) {
    const id = [...ids][0];
    return [
      "case",
      ["==", key, id],
      "route-marker-selected",
      "route-marker",
    ] as SymbolLayerStyle["iconImage"];
  }
  return [
    "case",
    ["any", ...[...ids].map((id) => ["==", key, id] as ["==", typeof key, string])],
    "route-marker-selected",
    "route-marker",
  ] as SymbolLayerStyle["iconImage"];
}
