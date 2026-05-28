/** @typedef {{ name: string, filename: string }} MapboxNativeMarkerAsset */

/** @type {MapboxNativeMarkerAsset[]} */
const MAPBOX_NATIVE_MARKER_ASSETS = [
  { name: "route_marker", filename: "marker.png" },
  { name: "route_marker_selected", filename: "markerSelected.png" },
  { name: "route_marker_cluster", filename: "markerCluster.png" },
];

const MARKERS_SOURCE_DIR = "assets/images/icons/markers";

module.exports = {
  MAPBOX_NATIVE_MARKER_ASSETS,
  MARKERS_SOURCE_DIR,
};
