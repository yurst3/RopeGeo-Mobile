import { TRAIL_VECTOR_LINE_STYLE } from "@/components/minimap/shared/trailVectorLineStyle";
import { LineLayer, VectorSource } from "@rnmapbox/maps";

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
  const isFocused = focusedRouteId != null;
  const hasIdsToShow = visibleTrailIds.length > 0;
  const lineOnly: ["==", ["geometry-type"], "LineString"] = [
    "==",
    ["geometry-type"],
    "LineString",
  ];
  const visibilityFilter =
    !isFocused || !hasIdsToShow
      ? (["==", ["get", "id"], ""] as const) // Match nothing: no feature has id === ""
      : (["in", ["get", "id"], ["literal", visibleTrailIds]] as const);
  const filter = ["all", lineOnly, visibilityFilter] as const;

  return (
    <VectorSource id="trails-source" tileUrlTemplates={TRAILS_TILE_URL_TEMPLATES}>
      <LineLayer
        id="trails-line-layer"
        sourceLayerID={TRAILS_SOURCE_LAYER_ID}
        filter={filter}
        style={TRAIL_VECTOR_LINE_STYLE}
      />
    </VectorSource>
  );
}
