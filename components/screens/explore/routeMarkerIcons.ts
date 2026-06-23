import type { SymbolLayerStyle } from "@rnmapbox/maps";
import {
  ROUTE_MARKER_CLUSTER_IMAGE,
  ROUTE_MARKER_IMAGE,
  ROUTE_MARKER_NATIVE_ASSET_IMAGES,
  ROUTE_MARKER_SELECTED_IMAGE,
} from "@/lib/mapbox/nativeMarkerImages";

export {
  ROUTE_MARKER_NATIVE_ASSET_IMAGES,
  ROUTE_MARKER_IMAGE,
  ROUTE_MARKER_SELECTED_IMAGE,
  ROUTE_MARKER_CLUSTER_IMAGE,
};

/**
 * Route marker icon size (constant screen size at all zoom levels).
 * The zoom-22 value must be (ICON_SIZE_AT_ZOOM_0 * 2^-22) so the icon doesn't scale with zoom.
 */
export const ROUTE_MARKER_ICON_SIZE_AT_ZOOM_0 = 0.05;
export const ROUTE_MARKER_ICON_SIZE_AT_ZOOM_22 =
  ROUTE_MARKER_ICON_SIZE_AT_ZOOM_0 * 2 ** -22;

/** Shared `iconSize` expression for route marker SymbolLayers. */
export function routeMarkerIconSizeInterpolate(
  iconSizeScale = 1,
): SymbolLayerStyle["iconSize"] {
  const z0 = ROUTE_MARKER_ICON_SIZE_AT_ZOOM_0 * iconSizeScale;
  const z22 = ROUTE_MARKER_ICON_SIZE_AT_ZOOM_22 * iconSizeScale;
  return [
    "interpolate",
    ["exponential", 2],
    ["zoom"],
    0,
    z0,
    22,
    z22,
  ] as SymbolLayerStyle["iconSize"];
}

/** @deprecated Use {@link routeMarkerIconSizeInterpolate}. */
export const ROUTE_MARKER_ICON_SIZE_INTERPOLATE =
  routeMarkerIconSizeInterpolate(1);

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
  iconSizeScale = 1,
): SymbolLayerStyle["iconSize"] {
  const ids = new Set<string>();
  if (focusedRouteId) ids.add(focusedRouteId);
  if (accentRouteId) ids.add(accentRouteId);

  const z0 = ROUTE_MARKER_ICON_SIZE_AT_ZOOM_0 * iconSizeScale;
  const z22 = ROUTE_MARKER_ICON_SIZE_AT_ZOOM_22 * iconSizeScale;
  const m = SELECTED_ROUTE_MARKER_ICON_SIZE_MULTIPLIER;
  const key: ["to-string", ["get", "id"]] = ["to-string", ["get", "id"]];

  if (ids.size === 0) {
    return routeMarkerIconSizeInterpolate(iconSizeScale);
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
 * Page minimap point icons: constant screen size scaled by UI profile, larger when `legendId`
 * matches the selected legend row (same multiplier as explore route markers).
 */
export function pageMiniMapPointIconSize(
  selectedLegendId: string | null | undefined,
  iconSizeScale = 1,
): SymbolLayerStyle["iconSize"] {
  const z0 = ROUTE_MARKER_ICON_SIZE_AT_ZOOM_0 * iconSizeScale;
  const z22 = ROUTE_MARKER_ICON_SIZE_AT_ZOOM_22 * iconSizeScale;
  if (selectedLegendId == null || selectedLegendId === "") {
    return routeMarkerIconSizeInterpolate(iconSizeScale);
  }
  const m = SELECTED_ROUTE_MARKER_ICON_SIZE_MULTIPLIER;
  const key: ["to-string", ["get", "legendId"]] = ["to-string", ["get", "legendId"]];
  const cond = ["==", key, selectedLegendId] as ["==", typeof key, string];
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
  if (ids.size === 0) return ROUTE_MARKER_IMAGE;

  const key: ["to-string", ["get", "id"]] = ["to-string", ["get", "id"]];
  if (ids.size === 1) {
    const id = [...ids][0];
    return [
      "case",
      ["==", key, id],
      ROUTE_MARKER_SELECTED_IMAGE,
      ROUTE_MARKER_IMAGE,
    ] as SymbolLayerStyle["iconImage"];
  }
  return [
    "case",
    ["any", ...[...ids].map((id) => ["==", key, id] as ["==", typeof key, string])],
    ROUTE_MARKER_SELECTED_IMAGE,
    ROUTE_MARKER_IMAGE,
  ] as SymbolLayerStyle["iconImage"];
}
