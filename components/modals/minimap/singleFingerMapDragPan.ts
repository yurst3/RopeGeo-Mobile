import { Gesture, type PanGesture } from "react-native-gesture-handler";
import { runOnJS, type SharedValue } from "react-native-reanimated";

type SingleFingerMapDragPanOptions = {
  /** Fingers currently down on the map frame (handle + map); updated from the parent view. */
  pointerCount: SharedValue<number>;
  /** True from a committed drag start until finalize or multi-touch cancel. */
  dragSession: SharedValue<boolean>;
  startX: SharedValue<number>;
  startY: SharedValue<number>;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  dragging: SharedValue<boolean>;
  /**
   * When set, copied into start/drag at the beginning of the gesture (e.g. a waypoint hit target's
   * own origin). Otherwise the current startX/Y are used (marker handle).
   */
  originX?: SharedValue<number>;
  originY?: SharedValue<number>;
  enabled?: boolean;
  onDragStart: () => void;
  /** `dropped` is false when the gesture failed or a second finger cancelled it. */
  onDragEnd: (x: number, y: number, dropped: boolean) => void;
};

/**
 * Pan that moves a map feature under one finger. `maxPointers(1)` only sees fingers on the handle,
 * so `pointerCount` (from the map frame) is what cancels the drag when a second finger goes down
 * elsewhere for a pinch-zoom.
 */
export function singleFingerMapDragPan({
  pointerCount,
  dragSession,
  startX,
  startY,
  dragX,
  dragY,
  dragging,
  originX,
  originY,
  enabled = true,
  onDragStart,
  onDragEnd,
}: SingleFingerMapDragPanOptions): PanGesture {
  return Gesture.Pan()
    .maxPointers(1)
    .minPointers(1)
    // A tap leaves the feature alone.
    .minDistance(1)
    .enabled(enabled)
    .onStart(() => {
      if (pointerCount.value > 1) return;
      if (originX != null && originY != null) {
        startX.value = originX.value;
        startY.value = originY.value;
      }
      dragX.value = startX.value;
      dragY.value = startY.value;
      dragging.value = true;
      dragSession.value = true;
      runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      if (!dragSession.value) return;
      if (pointerCount.value > 1) {
        dragSession.value = false;
        dragging.value = false;
        runOnJS(onDragEnd)(dragX.value, dragY.value, false);
        return;
      }
      dragX.value = startX.value + e.translationX;
      dragY.value = startY.value + e.translationY;
    })
    .onFinalize((_, success) => {
      if (!dragSession.value) return;
      dragSession.value = false;
      runOnJS(onDragEnd)(dragX.value, dragY.value, success && pointerCount.value <= 1);
    });
}
