import { TripReportMarkerIcon } from "@/components/markers/TripReportMarkerIcon";
import { selectedMarkerExtents } from "@/components/modals/minimap/TripReportMarkersLayer";
import { singleFingerMapDragPan } from "@/components/modals/minimap/singleFingerMapDragPan";
import { useRouteMarkerMetrics } from "@/utils/layout/routeMarkerLayout";
import { mapPositionAt } from "@/utils/map/mapPositionAt";
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
import Animated, { useAnimatedStyle, useSharedValue, type SharedValue } from "react-native-reanimated";
import type { TripReportMarker, TripReportWaypoint } from "ropegeo-common/models";

type ScreenPoint = [x: number, y: number];

export type MarkerDragHandleProps = {
  mapRef: RefObject<ComponentRef<typeof MapView> | null>;
  /** The selected marker. */
  marker: TripReportMarker;
  /** Changes whenever the camera moves, so the handle follows the marker on screen. */
  cameraRevision: number;
  /**
   * Fingers currently down on the map frame. A second finger cancels the drag so pinch-zoom
   * doesn't move the marker.
   */
  pointerCount: SharedValue<number>;
  /** The marker started following the finger; hide it on the map until the drag ends. */
  onDragStart: () => void;
  /** Where the marker was dropped, or null if the drag was cancelled. */
  onDragEnd: (position: TripReportWaypoint | null) => void;
};

/**
 * Floating marker icon under the finger while a marker is dragged (selected-handle or long-press).
 */
export function MarkerDragPreview({
  marker,
  dragX,
  dragY,
  dragging,
}: {
  marker: TripReportMarker;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  dragging: SharedValue<boolean>;
}) {
  const { markerWidth } = selectedMarkerExtents(useRouteMarkerMetrics().iconSizeScale);
  const copyStyle = useAnimatedStyle(() => ({
    opacity: dragging.value ? 1 : 0,
    transform: [
      { translateX: dragX.value - markerWidth / 2 },
      { translateY: dragY.value - markerWidth },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.copy, copyStyle]}>
      <TripReportMarkerIcon markerStyle={marker.style} color={marker.color} size={markerWidth} />
    </Animated.View>
  );
}

/**
 * Invisible touch area over the selected marker's pin and move arrows. Dragging from it moves the
 * marker instead of panning the map; touches anywhere else still reach the map. Render above the
 * map view, in the same frame (map view points are this handle's parent's points).
 *
 * While dragging, a copy of the marker is drawn under the finger here rather than on the map. The
 * gesture and the copy run on the UI thread, so the copy keeps up with the finger however busy
 * JavaScript is; JavaScript only hears about the drag starting and the drop, which is converted to
 * a map position once. The gesture's worklets only read shared values: worklets capture copies of
 * anything else they read, so they'd never see later changes. A second finger on the map cancels
 * the drag. Unselected markers start from MapView long-press instead.
 */
export function MarkerDragHandle({
  mapRef,
  marker,
  cameraRevision,
  pointerCount,
  onDragStart,
  onDragEnd,
}: MarkerDragHandleProps) {
  const { side, above, below } = selectedMarkerExtents(useRouteMarkerMetrics().iconSizeScale);
  const [point, setPoint] = useState<ScreenPoint | null>(null);
  const draggingRef = useRef(false);
  const markerPositionRef = useRef(marker.position);
  markerPositionRef.current = marker.position;
  const onDragStartRef = useRef(onDragStart);
  onDragStartRef.current = onDragStart;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  // Follows the marker as the camera moves, and stays put while dragging (the gesture's
  // translation is measured in this view). Dropping the marker moves its position, which brings
  // the handle along.
  const [lng, lat] = marker.position;
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

  /** The marker's point on screen, where a drag starts from. */
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  /** Where the dragged copy's point is drawn. */
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragging = useSharedValue(false);
  const dragSession = useSharedValue(false);
  useEffect(() => {
    if (point == null) return;
    startX.value = point[0];
    startY.value = point[1];
  }, [point, startX, startY]);

  const handleDragStart = useCallback(() => {
    draggingRef.current = true;
    onDragStartRef.current();
  }, []);

  const handleDrop = useCallback(
    async (x: number, y: number, dropped: boolean) => {
      let position: TripReportWaypoint | null = null;
      if (dropped && mapRef.current != null) {
        try {
          position = await mapPositionAt(mapRef.current, [x, y], markerPositionRef.current);
        } catch {
          /* leave the marker where it was */
        }
      }
      draggingRef.current = false;
      onDragEndRef.current(position);
      // The copy stays under the finger until the dropped position is known, so the marker
      // doesn't flash back to where it started.
      dragging.value = false;
    },
    [dragging, mapRef],
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
        onDragEnd: handleDrop,
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
      handleDrop,
    ],
  );

  return (
    <>
      <MarkerDragPreview marker={marker} dragX={dragX} dragY={dragY} dragging={dragging} />
      {point != null ? (
        <GestureDetector gesture={pan}>
          <View
            collapsable={false}
            accessibilityLabel="Move marker"
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
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  handle: {
    position: "absolute",
    zIndex: 1,
  },
  copy: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 1,
  },
});
