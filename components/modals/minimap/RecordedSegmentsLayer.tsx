import { MAPBOX_CUSTOM_LAYER_SLOT, MAPBOX_EMISSIVE_STRENGTH } from "@/constants/mapbox";
import {
  isLightLineSegmentColor,
  LINE_SEGMENT_DASH_ARRAYS,
  LINE_SEGMENT_WIDTHS,
  lineSegmentColorValue,
} from "@/constants/tripReport/lineSegmentAppearance";
import type { RecordedSegmentColors } from "@/constants/colors/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { CircleLayer, LineLayer, ShapeSource } from "@rnmapbox/maps";
import { memo, useMemo, type ComponentProps } from "react";
import type { TripReportLineSegment } from "ropegeo-common/models";
import { MoveArrowsLayer } from "./MoveArrowsLayer";

type FilterExpression = NonNullable<ComponentProps<typeof CircleLayer>["filter"]>;

/** Casing extends this far past each side of the line, in points. */
const CASING_PADDING = 1;
/** Waypoint circle radius on the map and on the drag overlay. */
export const WAYPOINT_DOT_RADIUS = 5;
/** Waypoint circle stroke width on the map and on the drag overlay. */
export const WAYPOINT_DOT_STROKE_WIDTH = 1.5;

/**
 * Waypoint markers only appear from zoom 14, and only every Nth one (counting from the first)
 * until zoomed in far enough that every waypoint fits. `maxZoom` is exclusive, matching Mapbox.
 */
const WAYPOINT_ZOOM_TIERS: { minZoom: number; maxZoom?: number; every: number }[] = [
  { minZoom: 14, maxZoom: 15.5, every: 10 },
  { minZoom: 15.5, maxZoom: 17, every: 4 },
  { minZoom: 17, every: 1 },
];

/** How often waypoints are drawn at `zoom`, or null when none are (below zoom 14). */
function waypointEveryAtZoom(zoom: number): number | null {
  for (const tier of WAYPOINT_ZOOM_TIERS) {
    if (zoom < tier.minZoom) continue;
    if (tier.maxZoom != null && zoom >= tier.maxZoom) continue;
    return tier.every;
  }
  return null;
}

/**
 * Whether the waypoint at `index` (0-based) is drawn on the map at `zoom`, using the same every-Nth
 * rule as the waypoint circle layers.
 */
export function isWaypointDrawnAtZoom(index: number, zoom: number): boolean {
  const every = waypointEveryAtZoom(zoom);
  return every != null && index % every === 0;
}

function layerIdPrefix(segmentId: string): string {
  return `recorded-segment-${segmentId}`;
}

/**
 * Ids of the layers drawing a segment's line (none until it has two waypoints). Their features
 * carry the segment's id as `segmentId`. Includes the selected-waypoint stub layers so those
 * edges stay pressable even when drawn dotted.
 */
export function recordedSegmentLineLayerIds(segment: TripReportLineSegment): string[] {
  if (segment.waypoints.length < 2) return [];
  const prefix = layerIdPrefix(segment.id);
  return [
    `${prefix}-casing`,
    `${prefix}-stroke`,
    `${prefix}-selected-stubs-casing`,
    `${prefix}-selected-stubs-stroke`,
  ];
}

/**
 * Ids of the layers drawing a segment's waypoint dots. Their features carry `segmentId` and
 * `waypointIndex`. Empty when the segment has no waypoints.
 */
export function recordedSegmentWaypointLayerIds(segment: TripReportLineSegment): string[] {
  if (segment.waypoints.length === 0) return [];
  const prefix = layerIdPrefix(segment.id);
  return WAYPOINT_ZOOM_TIERS.map(({ minZoom }) => `${prefix}-waypoints-z${minZoom}-circle`);
}

function tierFilter(every: number): FilterExpression | undefined {
  return every <= 1 ? undefined : ["==", ["%", ["-", ["get", "number"], 1], every], 0];
}

/**
 * The segment's line with the edges through `gapIndex` left off. Null when nothing is left to draw.
 */
function lineShapeHidingWaypoint(
  segment: TripReportLineSegment,
  gapIndex: number | null,
): GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString> | null {
  const coordinates = segment.waypoints.map(([lng, lat]) => [lng, lat]);
  if (coordinates.length < 2) return null;

  let geometry: GeoJSON.LineString | GeoJSON.MultiLineString;
  if (gapIndex == null) {
    geometry = { type: "LineString", coordinates };
  } else {
    const parts: number[][][] = [];
    if (gapIndex > 0) {
      const left = coordinates.slice(0, gapIndex);
      if (left.length >= 2) parts.push(left);
    }
    if (gapIndex < coordinates.length - 1) {
      const right = coordinates.slice(gapIndex + 1);
      if (right.length >= 2) parts.push(right);
    }
    if (parts.length === 0) return null;
    geometry =
      parts.length === 1
        ? { type: "LineString", coordinates: parts[0] }
        : { type: "MultiLineString", coordinates: parts };
  }

  return {
    type: "Feature",
    properties: { segmentId: segment.id },
    geometry,
  };
}

/**
 * The edges through `index` (prev→index and index→next), for drawing selected/dragged stubs.
 * Null when `index` has no neighbors.
 */
function adjacentEdgesShape(
  segment: TripReportLineSegment,
  index: number,
): GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString> | null {
  const coordinates = segment.waypoints.map(([lng, lat]) => [lng, lat]);
  if (index < 0 || index >= coordinates.length) return null;

  const parts: number[][][] = [];
  if (index > 0) parts.push([coordinates[index - 1], coordinates[index]]);
  if (index < coordinates.length - 1) parts.push([coordinates[index], coordinates[index + 1]]);
  if (parts.length === 0) return null;

  return {
    type: "Feature",
    properties: { segmentId: segment.id },
    geometry:
      parts.length === 1
        ? { type: "LineString", coordinates: parts[0] }
        : { type: "MultiLineString", coordinates: parts },
  };
}

const SegmentLayers = memo(function SegmentLayers({
  segment,
  showWaypoints,
  selectedWaypointIndex,
  hiddenWaypointIndex,
  colors,
}: {
  segment: TripReportLineSegment;
  showWaypoints: boolean;
  selectedWaypointIndex: number | null;
  /** Left off the map, along with its arrows and the edges through it, while it's dragged. */
  hiddenWaypointIndex: number | null;
  colors: RecordedSegmentColors;
}) {
  // Gap the main stroke at a dragged waypoint, or at the selected one so its neighbor edges can
  // be redrawn dotted. While dragging, the SVG preview owns those stubs instead.
  const gapIndex =
    hiddenWaypointIndex ??
    (showWaypoints &&
    selectedWaypointIndex != null &&
    selectedWaypointIndex >= 0 &&
    selectedWaypointIndex < segment.waypoints.length
      ? selectedWaypointIndex
      : null);
  const selectedStubsIndex =
    showWaypoints &&
    selectedWaypointIndex != null &&
    hiddenWaypointIndex == null &&
    selectedWaypointIndex >= 0 &&
    selectedWaypointIndex < segment.waypoints.length
      ? selectedWaypointIndex
      : null;

  const lineShape = useMemo(
    () => lineShapeHidingWaypoint(segment, gapIndex),
    [segment, gapIndex],
  );
  const selectedStubsShape = useMemo(
    () =>
      selectedStubsIndex != null ? adjacentEdgesShape(segment, selectedStubsIndex) : null,
    [segment, selectedStubsIndex],
  );
  const waypointShape = useMemo(
    (): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
      type: "FeatureCollection",
      features: segment
        .toWaypointFeatures()
        .features.filter((_, index) => index !== hiddenWaypointIndex)
        .map((feature) => {
          const index = (feature.properties?.number ?? 1) - 1;
          return {
            ...feature,
            properties: {
              ...feature.properties,
              segmentId: segment.id,
              waypointIndex: index,
            },
          };
        }),
    }),
    [segment, hiddenWaypointIndex],
  );

  const lineColor = lineSegmentColorValue(segment.color);
  const lightLine = isLightLineSegmentColor(segment.color);
  const casingColor = lightLine ? colors.lightLineOutline : colors.lineCasing;
  const waypointStrokeColor = lightLine ? colors.lightLineOutline : colors.waypointStroke;
  const lineWidth = LINE_SEGMENT_WIDTHS[segment.thickness];
  const dashArray = LINE_SEGMENT_DASH_ARRAYS[segment.style];
  const dottedDashArray = LINE_SEGMENT_DASH_ARRAYS.dotted;
  const casingWidth = lineWidth + CASING_PADDING * 2;
  // Dash lengths are multiples of the layer's width, so rescale them to line up under the line.
  const casingDashArray = dashArray.map((value) => (value * lineWidth) / casingWidth);
  const dottedCasingDashArray = dottedDashArray.map(
    (value) => (value * lineWidth) / casingWidth,
  );
  const lineCap = segment.style === "dashed" ? "butt" : "round";
  const prefix = layerIdPrefix(segment.id);
  const selectedWaypoint =
    showWaypoints &&
    selectedWaypointIndex != null &&
    selectedWaypointIndex !== hiddenWaypointIndex &&
    selectedWaypointIndex >= 0 &&
    selectedWaypointIndex < segment.waypoints.length
      ? segment.waypoints[selectedWaypointIndex]
      : null;
  // Arrows sit under the densest tier's circles so they don't cover the selected dot.
  const arrowsBelowLayerId = `${prefix}-waypoints-z${WAYPOINT_ZOOM_TIERS[WAYPOINT_ZOOM_TIERS.length - 1].minZoom}-circle`;

  return (
    <>
      {lineShape != null ? (
        <ShapeSource id={`${prefix}-line`} shape={lineShape}>
          <LineLayer
            id={`${prefix}-casing`}
            slot={MAPBOX_CUSTOM_LAYER_SLOT}
            style={{
              lineColor: casingColor,
              lineWidth: casingWidth,
              lineEmissiveStrength: MAPBOX_EMISSIVE_STRENGTH,
              lineCap,
              lineJoin: "round",
              lineDasharray: casingDashArray,
            }}
          />
          <LineLayer
            id={`${prefix}-stroke`}
            slot={MAPBOX_CUSTOM_LAYER_SLOT}
            aboveLayerID={`${prefix}-casing`}
            style={{
              lineColor,
              lineWidth,
              lineEmissiveStrength: MAPBOX_EMISSIVE_STRENGTH,
              lineCap,
              lineJoin: "round",
              lineDasharray: dashArray,
            }}
          />
        </ShapeSource>
      ) : null}
      {selectedStubsShape != null ? (
        <ShapeSource id={`${prefix}-selected-stubs`} shape={selectedStubsShape}>
          <LineLayer
            id={`${prefix}-selected-stubs-casing`}
            slot={MAPBOX_CUSTOM_LAYER_SLOT}
            style={{
              lineColor: casingColor,
              lineWidth: casingWidth,
              lineEmissiveStrength: MAPBOX_EMISSIVE_STRENGTH,
              lineCap: "round",
              lineJoin: "round",
              lineDasharray: dottedCasingDashArray,
            }}
          />
          <LineLayer
            id={`${prefix}-selected-stubs-stroke`}
            slot={MAPBOX_CUSTOM_LAYER_SLOT}
            aboveLayerID={`${prefix}-selected-stubs-casing`}
            style={{
              lineColor,
              lineWidth,
              lineEmissiveStrength: MAPBOX_EMISSIVE_STRENGTH,
              lineCap: "round",
              lineJoin: "round",
              lineDasharray: dottedDashArray,
            }}
          />
        </ShapeSource>
      ) : null}
      {showWaypoints && segment.waypoints.length > 0 ? (
        <>
          <ShapeSource id={`${prefix}-waypoints`} shape={waypointShape}>
            {WAYPOINT_ZOOM_TIERS.map(({ minZoom, maxZoom, every }) => {
              const filter = tierFilter(every);
              const tierId = `${prefix}-waypoints-z${minZoom}`;
              return (
                <CircleLayer
                  key={`${tierId}-circle`}
                  id={`${tierId}-circle`}
                  slot={MAPBOX_CUSTOM_LAYER_SLOT}
                  minZoomLevel={minZoom}
                  maxZoomLevel={maxZoom}
                  {...(filter != null ? { filter } : null)}
                  style={{
                    circleRadius: WAYPOINT_DOT_RADIUS,
                    circleColor: lineColor,
                    circleStrokeColor: waypointStrokeColor,
                    circleStrokeWidth: WAYPOINT_DOT_STROKE_WIDTH,
                    circleEmissiveStrength: MAPBOX_EMISSIVE_STRENGTH,
                  }}
                />
              );
            })}
          </ShapeSource>
          <MoveArrowsLayer
            sourceId={`${prefix}-waypoint-move-arrows`}
            position={selectedWaypoint}
            belowLayerID={arrowsBelowLayerId}
          />
        </>
      ) : null}
    </>
  );
});

/**
 * Draws a map block's recorded line segments. Waypoint markers are only drawn for the segment
 * `waypointsSegmentId` names (the one selected in the legend); every other segment, and every
 * segment while it's null, shows its line only. When that segment also has a selected waypoint
 * index, pulsing move arrows appear around that waypoint and its neighbor edges are drawn dotted.
 * A hidden waypoint (e.g. while dragged) is left off the map along with the line edges through it.
 */
export function RecordedSegmentsLayer({
  segments,
  waypointsSegmentId,
  selectedWaypointIndex = null,
  hiddenWaypointIndex = null,
}: {
  segments: readonly TripReportLineSegment[];
  waypointsSegmentId: string | null;
  selectedWaypointIndex?: number | null;
  /** Waypoint index hidden on the selected segment, or null. */
  hiddenWaypointIndex?: number | null;
}) {
  const colors = useColorTheme().map.minimap.recordedSegment;
  return (
    <>
      {segments.map((segment) => (
        <SegmentLayers
          key={segment.id}
          segment={segment}
          showWaypoints={segment.id === waypointsSegmentId}
          selectedWaypointIndex={
            segment.id === waypointsSegmentId ? selectedWaypointIndex : null
          }
          hiddenWaypointIndex={
            segment.id === waypointsSegmentId ? hiddenWaypointIndex : null
          }
          colors={colors}
        />
      ))}
    </>
  );
}
