import type { MapLightPreset } from "@/constants/settings/mapLayersTypes";
import type {
  TripReportLineColor,
  TripReportLineStyle,
  TripReportLineThickness,
} from "ropegeo-common/models";

/** Color for a new segment so it contrasts with the map's time of day: white at dusk/night. */
export function defaultLineColorForLightPreset(preset: MapLightPreset): TripReportLineColor {
  return preset === "dusk" || preset === "night" ? "white" : "black";
}

/**
 * Colors a user picks for their own line segments. These are part of the trip report data, not
 * the app theme, so they look the same in every theme.
 */
export const LINE_SEGMENT_COLORS: Record<TripReportLineColor, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#facc15",
  green: "#22c55e",
  cyan: "#06b6d4",
  blue: "#3b82f6",
  violet: "#8b5cf6",
  pink: "#ec4899",
};

/** Segment colors too light for the regular outline; they're outlined with `lightLineOutline`. */
export const LIGHT_LINE_SEGMENT_COLORS: ReadonlySet<TripReportLineColor> = new Set([
  "white",
  "yellow",
  "green",
]);

/**
 * Mapbox `lineDasharray` values, in multiples of the line width. Solid lines get a gapless dash
 * rather than no dash array: a layer keeps its last dash array when the property is left out, so
 * switching to solid has to overwrite it.
 */
export const LINE_SEGMENT_DASH_ARRAYS: Record<TripReportLineStyle, number[]> = {
  solid: [1, 0],
  dashed: [2, 1.5],
  // Zero-length dashes with round caps render as dots.
  dotted: [0, 2],
};

/** Line widths in points. */
export const LINE_SEGMENT_WIDTHS: Record<TripReportLineThickness, number> = {
  thin: 2,
  medium: 4,
  thick: 6,
};
