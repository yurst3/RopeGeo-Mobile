import type { LineLayerStyle } from "@rnmapbox/maps";

/** Data-driven line styling for vector tiles with `stroke` and `stroke-width` properties. */
export const TRAIL_VECTOR_LINE_STYLE: LineLayerStyle = {
  lineColor: ["coalesce", ["get", "stroke"], "#2563eb"],
  lineWidth: ["coalesce", ["to-number", ["get", "stroke-width"]], 2.5],
  lineOpacity: 1,
  lineCap: "round",
  lineJoin: "round",
};
