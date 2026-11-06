import { MAPBOX_CUSTOM_LAYER_SLOT, MAPBOX_EMISSIVE_STRENGTH } from "@/constants/mapbox";
import {
  LIGHT_LINE_SEGMENT_COLORS,
  LINE_SEGMENT_COLORS,
  LINE_SEGMENT_DASH_ARRAYS,
  LINE_SEGMENT_WIDTHS,
} from "@/constants/tripReport/lineSegmentAppearance";
import type { RecordedSegmentColors } from "@/constants/colors/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { CircleLayer, LineLayer, ShapeSource } from "@rnmapbox/maps";
import { memo, useMemo, type ComponentProps } from "react";
import type { TripReportLineSegment } from "ropegeo-common/models";

type FilterExpression = NonNullable<ComponentProps<typeof CircleLayer>["filter"]>;

/** Casing extends this far past each side of the line, in points. */
const CASING_PADDING = 1;
const WAYPOINT_RADIUS = 5;
const WAYPOINT_STROKE_WIDTH = 1.5;

/**
 * Waypoint markers only appear from zoom 14, and only every Nth one (counting from the first)
 * until zoomed in far enough that every waypoint fits.
 */
const WAYPOINT_ZOOM_TIERS: { minZoom: number; maxZoom?: number; every: number }[] = [
  { minZoom: 14, maxZoom: 15.5, every: 10 },
  { minZoom: 15.5, maxZoom: 17, every: 4 },
  { minZoom: 17, every: 1 },
];

function tierFilter(every: number): FilterExpression | undefined {
  return every <= 1 ? undefined : ["==", ["%", ["-", ["get", "number"], 1], every], 0];
}

const SegmentLayers = memo(function SegmentLayers({
  segment,
  showWaypoints,
  colors,
}: {
  segment: TripReportLineSegment;
  showWaypoints: boolean;
  colors: RecordedSegmentColors;
}) {
  const lineShape = useMemo(() => segment.toLineFeature(), [segment]);
  const waypointShape = useMemo(() => segment.toWaypointFeatures(), [segment]);

  const lineColor = LINE_SEGMENT_COLORS[segment.color];
  const lightLine = LIGHT_LINE_SEGMENT_COLORS.has(segment.color);
  const casingColor = lightLine ? colors.lightLineOutline : colors.lineCasing;
  const waypointStrokeColor = lightLine ? colors.lightLineOutline : colors.waypointStroke;
  const lineWidth = LINE_SEGMENT_WIDTHS[segment.thickness];
  const dashArray = LINE_SEGMENT_DASH_ARRAYS[segment.style];
  const casingWidth = lineWidth + CASING_PADDING * 2;
  // Dash lengths are multiples of the layer's width, so rescale them to line up under the line.
  const casingDashArray = dashArray.map((value) => (value * lineWidth) / casingWidth);
  const lineCap = segment.style === "dashed" ? "butt" : "round";
  const prefix = `recorded-segment-${segment.id}`;

  return (
    <>
      {segment.waypoints.length >= 2 ? (
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
      {showWaypoints && segment.waypoints.length > 0 ? (
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
                  circleRadius: WAYPOINT_RADIUS,
                  circleColor: lineColor,
                  circleStrokeColor: waypointStrokeColor,
                  circleStrokeWidth: WAYPOINT_STROKE_WIDTH,
                  circleEmissiveStrength: MAPBOX_EMISSIVE_STRENGTH,
                }}
              />
            );
          })}
        </ShapeSource>
      ) : null}
    </>
  );
});

/**
 * Draws a map block's recorded line segments. Waypoint markers are only drawn for the segment
 * `waypointsSegmentId` names (the one selected in the legend); every other segment, and every
 * segment while it's null, shows its line only.
 */
export function RecordedSegmentsLayer({
  segments,
  waypointsSegmentId,
}: {
  segments: readonly TripReportLineSegment[];
  waypointsSegmentId: string | null;
}) {
  const colors = useColorTheme().map.minimap.recordedSegment;
  return (
    <>
      {segments.map((segment) => (
        <SegmentLayers
          key={segment.id}
          segment={segment}
          showWaypoints={segment.id === waypointsSegmentId}
          colors={colors}
        />
      ))}
    </>
  );
}
