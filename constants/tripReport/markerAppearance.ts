import type { ImageSourcePropType } from "react-native";
import { TripReportMarkerStyle } from "ropegeo-common/models";

/** Marker image for each trip report marker style; solid shapes meant to be tinted. */
export const TRIP_REPORT_MARKER_ICONS: Record<TripReportMarkerStyle, ImageSourcePropType> = {
  [TripReportMarkerStyle.Marker]: require("@/assets/images/icons/markers/marker.png"),
  [TripReportMarkerStyle.Alert]: require("@/assets/images/icons/markers/markerAlert.png"),
  [TripReportMarkerStyle.Blocked]: require("@/assets/images/icons/markers/markerBlocked.png"),
  [TripReportMarkerStyle.Camera]: require("@/assets/images/icons/markers/markerCamera.png"),
  [TripReportMarkerStyle.Camp]: require("@/assets/images/icons/markers/markerCamp.png"),
  [TripReportMarkerStyle.Down]: require("@/assets/images/icons/markers/markerDown.png"),
  [TripReportMarkerStyle.Parking]: require("@/assets/images/icons/markers/markerParking.png"),
  [TripReportMarkerStyle.Pool]: require("@/assets/images/icons/markers/markerPool.png"),
  [TripReportMarkerStyle.Question]: require("@/assets/images/icons/markers/markerQuestion.png"),
  [TripReportMarkerStyle.Star]: require("@/assets/images/icons/markers/markerStar.png"),
  [TripReportMarkerStyle.Swim]: require("@/assets/images/icons/markers/markerSwim.png"),
  [TripReportMarkerStyle.Up]: require("@/assets/images/icons/markers/markerUp.png"),
  [TripReportMarkerStyle.Waterfall]: require("@/assets/images/icons/markers/markerWaterfall.png"),
};

/** The pin shared by every marker image, without any symbol cut out. */
export const PIN_SILHOUETTE_ICON: ImageSourcePropType = require("@/assets/images/icons/markers/pinSilhouette.png");

/**
 * Styles whose symbol cut-out shows what's behind the marker. Every other style's symbol is filled
 * with the outline color (on the map, by its SDF image; see `scripts/generateMarkerSdfs.js`).
 */
export const CUTOUT_TRIP_REPORT_MARKER_STYLES: ReadonlySet<TripReportMarkerStyle> = new Set([
  TripReportMarkerStyle.Marker,
  TripReportMarkerStyle.Up,
  TripReportMarkerStyle.Down,
]);

export const TRIP_REPORT_MARKER_STYLE_LABELS: Record<TripReportMarkerStyle, string> = {
  [TripReportMarkerStyle.Marker]: "Marker",
  [TripReportMarkerStyle.Alert]: "Alert",
  [TripReportMarkerStyle.Blocked]: "Blocked",
  [TripReportMarkerStyle.Camera]: "Camera",
  [TripReportMarkerStyle.Camp]: "Camp",
  [TripReportMarkerStyle.Down]: "Down",
  [TripReportMarkerStyle.Parking]: "Parking",
  [TripReportMarkerStyle.Pool]: "Pool",
  [TripReportMarkerStyle.Question]: "Question",
  [TripReportMarkerStyle.Star]: "Star",
  [TripReportMarkerStyle.Swim]: "Swim",
  [TripReportMarkerStyle.Up]: "Up",
  [TripReportMarkerStyle.Waterfall]: "Waterfall",
};
