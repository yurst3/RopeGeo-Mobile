import {
  WAYPOINT_DOT_RADIUS,
  WAYPOINT_DOT_STROKE_WIDTH,
} from "@/components/modals/minimap/RecordedSegmentsLayer";
import { moveArrowReach } from "@/components/modals/minimap/MoveArrowsLayer";
import { singleFingerMapDragPan } from "@/components/modals/minimap/singleFingerMapDragPan";
import {
  isLightLineSegmentColor,
  LINE_SEGMENT_DASH_ARRAYS,
  LINE_SEGMENT_WIDTHS,
  lineSegmentColorValue,
} from "@/constants/tripReport/lineSegmentAppearance";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useRouteMarkerMetrics } from "@/utils/layout/routeMarkerLayout";
import type { MapView } from "@rnmapbox/maps";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from "react";
import { StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Line } from "react-native-svg";
import type { TripReportLineSegment, TripReportWaypoint } from "ropegeo-common/models";

type ScreenPoint = [x: number, y: number];

const CASING_PADDING = 1;

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * On-screen reach of the selected waypoint's dot and move arrows, used for its drag hit target.
 */
export function selectedWaypointExtents(iconSizeScale: number) {
  const arrowReach = moveArrowReach(iconSizeScale);
  const dotReach = WAYPOINT_DOT_RADIUS + WAYPOINT_DOT_STROKE_WIDTH;
  const side = Math.max(dotReach, arrowReach);
  return { side, above: side, below: side };
}

export type WaypointDragSession = {
  index: number;
  origin: ScreenPoint;
  neighbors: { prev: ScreenPoint | null; next: ScreenPoint | null };
};

/**
 * Invisible hit target over the selected waypoint's dot and move arrows. Dragging from it moves
 * the waypoint immediately (no long-press). Touches anywhere else still reach the map. Unselected
 * waypoints still need a MapView long-press to start a drag.
 */
export function SelectedWaypointDragHandle({
  mapRef,
  waypoint,
  cameraRevision,
  pointerCount,
  dragX,
  dragY,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  mapRef: RefObject<ComponentRef<typeof MapView> | null>;
  waypoint: TripReportWaypoint;
  /** Changes whenever the camera moves, so the handle follows the waypoint on screen. */
  cameraRevision: number;
  pointerCount: SharedValue<number>;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  dragging: SharedValue<boolean>;
  /** Parent hides the waypoint on the map and builds the drag preview session. */
  onDragStart: (screenPoint: ScreenPoint) => void;
  /** `dropped` is false when the gesture failed or a second finger cancelled it. */
  onDragEnd: (dropped: boolean) => void;
}) {
  const { side, above, below } = selectedWaypointExtents(useRouteMarkerMetrics().iconSizeScale);
  const [point, setPoint] = useState<ScreenPoint | null>(null);
  const draggingRef = useRef(false);
  const onDragStartRef = useRef(onDragStart);
  onDragStartRef.current = onDragStart;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  const [lng, lat] = waypoint;
  useEffect(() => {
    if (draggingRef.current) return;
    let cancelled = false;
    mapRef.current
      ?.getPointInView([lng, lat])
      .then(([x, y]) => {
        if (!cancelled && !draggingRef.current) setPoint([x, y]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mapRef, lng, lat, cameraRevision]);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const dragSession = useSharedValue(false);
  useEffect(() => {
    if (point == null) return;
    startX.value = point[0];
    startY.value = point[1];
  }, [point, startX, startY]);

  const handleDragStart = useCallback(() => {
    draggingRef.current = true;
    if (point == null) return;
    onDragStartRef.current(point);
  }, [point]);

  const handleDragEnd = useCallback(
    (_x: number, _y: number, dropped: boolean) => {
      draggingRef.current = false;
      onDragEndRef.current(dropped);
    },
    [],
  );

  const pan = useMemo(
    () =>
      singleFingerMapDragPan({
        pointerCount,
        dragSession,
        startX,
        startY,
        dragX,
        dragY,
        dragging,
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
      }),
    [
      pointerCount,
      dragSession,
      startX,
      startY,
      dragX,
      dragY,
      dragging,
      handleDragStart,
      handleDragEnd,
    ],
  );

  if (point == null) return null;
  return (
    <GestureDetector gesture={pan}>
      <View
        collapsable={false}
        accessibilityLabel="Move waypoint"
        style={[
          styles.handle,
          {
            left: point[0] - side,
            top: point[1] - above,
            width: side * 2,
            height: above + below,
          },
        ]}
      />
    </GestureDetector>
  );
}

/**
 * Live line stubs + waypoint dot while a waypoint is dragged. Screen-space overlay above the map;
 * hit-testing for unselected waypoints is MapView long-press; the selected waypoint uses
 * {@link SelectedWaypointDragHandle}.
 */
export function WaypointDragPreview({
  segment,
  session,
  dragX,
  dragY,
  dragging,
}: {
  segment: TripReportLineSegment;
  session: WaypointDragSession;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  dragging: SharedValue<boolean>;
}) {
  const colors = useColorTheme().map.minimap.recordedSegment;
  const lineColor = lineSegmentColorValue(segment.color);
  const lightLine = isLightLineSegmentColor(segment.color);
  const casingColor = lightLine ? colors.lightLineOutline : colors.lineCasing;
  const waypointStrokeColor = lightLine ? colors.lightLineOutline : colors.waypointStroke;
  const lineWidth = LINE_SEGMENT_WIDTHS[segment.thickness];
  const casingWidth = lineWidth + CASING_PADDING * 2;
  // Neighbor stubs are always dotted while dragging, so the live link reads clearly against the
  // rest of the segment (which keeps its real style on the map).
  const strokeDasharray = LINE_SEGMENT_DASH_ARRAYS.dotted
    .map((value) => value * lineWidth)
    .join(" ");
  const lineCap = "round";
  const { origin, neighbors } = session;

  return (
    <Svg pointerEvents="none" style={styles.overlay}>
      {neighbors.prev != null ? (
        <>
          <DragLine
            x1={neighbors.prev[0]}
            y1={neighbors.prev[1]}
            x2={origin[0]}
            y2={origin[1]}
            dragX={dragX}
            dragY={dragY}
            dragging={dragging}
            endIsDrag
            stroke={casingColor}
            strokeWidth={casingWidth}
            strokeLinecap={lineCap}
            strokeDasharray={strokeDasharray}
          />
          <DragLine
            x1={neighbors.prev[0]}
            y1={neighbors.prev[1]}
            x2={origin[0]}
            y2={origin[1]}
            dragX={dragX}
            dragY={dragY}
            dragging={dragging}
            endIsDrag
            stroke={lineColor}
            strokeWidth={lineWidth}
            strokeLinecap={lineCap}
            strokeDasharray={strokeDasharray}
          />
        </>
      ) : null}
      {neighbors.next != null ? (
        <>
          <DragLine
            x1={origin[0]}
            y1={origin[1]}
            x2={neighbors.next[0]}
            y2={neighbors.next[1]}
            dragX={dragX}
            dragY={dragY}
            dragging={dragging}
            endIsDrag={false}
            stroke={casingColor}
            strokeWidth={casingWidth}
            strokeLinecap={lineCap}
            strokeDasharray={strokeDasharray}
          />
          <DragLine
            x1={origin[0]}
            y1={origin[1]}
            x2={neighbors.next[0]}
            y2={neighbors.next[1]}
            dragX={dragX}
            dragY={dragY}
            dragging={dragging}
            endIsDrag={false}
            stroke={lineColor}
            strokeWidth={lineWidth}
            strokeLinecap={lineCap}
            strokeDasharray={strokeDasharray}
          />
        </>
      ) : null}
      <DragDot
        origin={origin}
        dragX={dragX}
        dragY={dragY}
        dragging={dragging}
        fill={lineColor}
        stroke={waypointStrokeColor}
      />
    </Svg>
  );
}

function DragLine({
  x1,
  y1,
  x2,
  y2,
  dragX,
  dragY,
  dragging,
  endIsDrag,
  stroke,
  strokeWidth,
  strokeLinecap,
  strokeDasharray,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  dragging: SharedValue<boolean>;
  endIsDrag: boolean;
  stroke: string;
  strokeWidth: number;
  strokeLinecap: "butt" | "round";
  strokeDasharray: string | undefined;
}) {
  const animatedProps = useAnimatedProps(() =>
    endIsDrag
      ? { x2: dragX.value, y2: dragY.value, opacity: dragging.value ? 1 : 0 }
      : { x1: dragX.value, y1: dragY.value, opacity: dragging.value ? 1 : 0 },
  );
  return (
    <AnimatedLine
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin="round"
      strokeDasharray={strokeDasharray}
      animatedProps={animatedProps}
    />
  );
}

function DragDot({
  origin,
  dragX,
  dragY,
  dragging,
  fill,
  stroke,
}: {
  origin: ScreenPoint;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  dragging: SharedValue<boolean>;
  fill: string;
  stroke: string;
}) {
  const animatedProps = useAnimatedProps(() => ({
    cx: dragX.value,
    cy: dragY.value,
    opacity: dragging.value ? 1 : 0,
  }));
  return (
    <AnimatedCircle
      cx={origin[0]}
      cy={origin[1]}
      r={WAYPOINT_DOT_RADIUS}
      fill={fill}
      stroke={stroke}
      strokeWidth={WAYPOINT_DOT_STROKE_WIDTH}
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  handle: {
    position: "absolute",
    zIndex: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
});
