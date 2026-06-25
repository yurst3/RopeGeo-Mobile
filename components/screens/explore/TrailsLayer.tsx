import { trailVectorLineStyle } from "@/utils/minimap/trailVectorLineStyle";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { LineLayer, VectorSource, type LineLayerStyle } from "@rnmapbox/maps";
import { useMemo } from "react";

/**
 * Vector tile source for trails. Tiles at /trails/{z}/{x}/{y}.pbf.
 * Each feature has an "id" property; layer shows only features whose id is in visibleTrailIds when a route is focused.
 */
const TRAILS_TILE_URL_TEMPLATES = [
  "https://api.webscraper.ropegeo.com/mapdata/tiles/trails/{z}/{x}/{y}.pbf",
];

/**
 * Name of the vector tile layer in the trails tiles (e.g. tippecanoe -l trails).
 */
const TRAILS_SOURCE_LAYER_ID = "trails";
const MATCH_NOTHING_FILTER = ["==", ["get", "id"], ""] as const;

export const UNFOCUSED_ROUTE_LINE_WIDTH = 2;
export const UNFOCUSED_ROUTE_LINE_OPACITY = 0.65;
const UNFOCUSED_ROUTE_LINE_DASHARRAY: number[] = [2, 2];

export type TrailsLayerProps = {
  /** When null, no trails are shown. When set, only trails whose id is in visibleTrailIds are shown. */
  focusedRouteId: string | null;
  /** Trail IDs to show for the currently viewed PagePreview (from mapData). Empty when no route focused or no mapData. */
  visibleTrailIds: string[];
};

/**
 * Renders trail lines from vector tiles. Hidden by default; when a route marker is focused,
 * shows only trails whose "id" is in the current preview's mapData.
 */
export function TrailsLayer({
  focusedRouteId,
  visibleTrailIds,
}: TrailsLayerProps) {
  const { map } = useColorTheme();
  const unfocusedTrailLineStyle = useMemo(
    (): LineLayerStyle => ({
      lineColor: map.unfocusedLineSegment,
      lineWidth: UNFOCUSED_ROUTE_LINE_WIDTH,
      lineOpacity: UNFOCUSED_ROUTE_LINE_OPACITY,
      lineDasharray: UNFOCUSED_ROUTE_LINE_DASHARRAY,
      lineCap: "round",
      lineJoin: "round",
    }),
    [map.unfocusedLineSegment],
  );
  const focusedTrailLineStyle = useMemo(
    () => trailVectorLineStyle(map.focusedLineSegment),
    [map.focusedLineSegment],
  );
  const isFocused = focusedRouteId != null;
  const hasIdsToShow = visibleTrailIds.length > 0;
  const lineOnly: ["==", ["geometry-type"], "LineString"] = [
    "==",
    ["geometry-type"],
    "LineString",
  ];
  const focusedTrailFilter =
    isFocused && hasIdsToShow
      ? (["in", ["get", "id"], ["literal", visibleTrailIds]] as const)
      : MATCH_NOTHING_FILTER;
  const focusedFilter = ["all", lineOnly, focusedTrailFilter] as const;

  const unfocusedTrailFilter =
    isFocused && hasIdsToShow
      ? (["!", ["in", ["get", "id"], ["literal", visibleTrailIds]]] as const)
      : (["!=", ["get", "id"], ""] as const);
  const unfocusedFilter = ["all", lineOnly, unfocusedTrailFilter] as const;

  return (
    <VectorSource id="trails-source" tileUrlTemplates={TRAILS_TILE_URL_TEMPLATES}>
      <LineLayer
        id="trails-line-layer-unfocused"
        sourceLayerID={TRAILS_SOURCE_LAYER_ID}
        filter={unfocusedFilter}
        style={unfocusedTrailLineStyle}
      />
      <LineLayer
        id="trails-line-layer-focused"
        sourceLayerID={TRAILS_SOURCE_LAYER_ID}
        filter={focusedFilter}
        style={focusedTrailLineStyle}
      />
    </VectorSource>
  );
}
