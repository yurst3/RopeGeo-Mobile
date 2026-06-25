import type { LineLayerStyle } from "@rnmapbox/maps";

/** Data-driven line styling for vector tiles with `stroke` and `stroke-width` properties. */
export function trailVectorLineStyle(focusedLineSegment: string): LineLayerStyle {
  return {
    lineColor: ["coalesce", ["get", "stroke"], focusedLineSegment],
    lineWidth: ["coalesce", ["to-number", ["get", "stroke-width"]], 2.5],
    lineOpacity: 1,
    lineCap: "round",
    lineJoin: "round",
  };
}
