import { TripReportMarkerStyle } from "ropegeo-common/models";

/**
 * Mapbox style image ids registered via `Images#nativeAssetImages`.
 * PNGs are copied into native projects by `plugins/withMapboxNativeMarkerImages`
 * during `expo prebuild` (see `plugins/mapboxNativeMarkerAssets.js`).
 */
export const ROUTE_MARKER_IMAGE = "route_marker" as const;
export const ROUTE_MARKER_SELECTED_IMAGE = "route_marker_selected" as const;
export const ROUTE_MARKER_CLUSTER_IMAGE = "route_marker_cluster" as const;

/** Passed to `<Images nativeAssetImages={...} />` on explore and minimap maps. */
export const ROUTE_MARKER_NATIVE_ASSET_IMAGES = [
  { name: ROUTE_MARKER_IMAGE, sdf: true },
  { name: ROUTE_MARKER_SELECTED_IMAGE, sdf: true },
  { name: ROUTE_MARKER_CLUSTER_IMAGE, sdf: true },
] as const;

/** Style image for each trip report marker style. */
export const TRIP_REPORT_MARKER_IMAGES: Record<TripReportMarkerStyle, string> = {
  [TripReportMarkerStyle.Marker]: ROUTE_MARKER_IMAGE,
  [TripReportMarkerStyle.Alert]: "marker_alert",
  [TripReportMarkerStyle.Blocked]: "marker_blocked",
  [TripReportMarkerStyle.Camera]: "marker_camera",
  [TripReportMarkerStyle.Camp]: "marker_camp",
  [TripReportMarkerStyle.Down]: "marker_down",
  [TripReportMarkerStyle.Parking]: "marker_parking",
  [TripReportMarkerStyle.Pool]: "marker_pool",
  [TripReportMarkerStyle.Question]: "marker_question",
  [TripReportMarkerStyle.Star]: "marker_star",
  [TripReportMarkerStyle.Swim]: "marker_swim",
  [TripReportMarkerStyle.Up]: "marker_up",
  [TripReportMarkerStyle.Waterfall]: "marker_waterfall",
};

/** Arrow (pointing down) drawn on each side of the selected trip report marker. */
export const MARKER_MOVE_ARROW_IMAGE = "marker_move_arrow" as const;

/** Passed to `<Images nativeAssetImages={...} />` on maps showing trip report markers. */
export const TRIP_REPORT_MARKER_NATIVE_ASSET_IMAGES = [
  ...Object.values(TRIP_REPORT_MARKER_IMAGES),
  MARKER_MOVE_ARROW_IMAGE,
].map((name) => ({ name, sdf: true }));
