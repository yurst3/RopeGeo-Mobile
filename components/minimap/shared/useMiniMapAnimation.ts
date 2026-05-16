import { useEffect, useMemo, useRef } from "react";
import { Dimensions } from "react-native";
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MINI_MAP_BORDER_RADIUS,
  MINI_MAP_COLLAPSED_Z_INDEX,
  MINI_MAP_EXPANDED_Z_INDEX,
} from "./minimapShared";
import { boundsPaddingForFullScreenMap } from "./fullScreenMapLayout";

export type Rect = { x: number; y: number; width: number; height: number };

/** Card bounds relative to the inline gate host ({@link collapsedMeasureRef}). */
export type MiniMapExpandLayout = {
  collapsed: Rect;
  expanded: Rect;
};

/** Below this progress the card uses in-flow layout; above uses absolute animation. */
const COLLAPSED_PROGRESS_THRESHOLD = 0.05;
/** Absolute phase uses gate fill (100%) instead of pixel size when near collapsed. */
const COLLAPSED_ABSOLUTE_FILL_THRESHOLD = 0.12;

export function useMiniMapAnimation({
  expandLayout,
  expanded,
  onCollapseTransition,
}: {
  expandLayout: MiniMapExpandLayout | null;
  expanded: boolean;
  onCollapseTransition?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
  const leftSv = useSharedValue(expandLayout?.collapsed.x ?? 0);
  const topSv = useSharedValue(expandLayout?.collapsed.y ?? 0);
  const widthSv = useSharedValue(expandLayout?.collapsed.width ?? 0);
  const heightSv = useSharedValue(expandLayout?.collapsed.height ?? 0);
  const endLeftSv = useSharedValue(expandLayout?.expanded.x ?? 0);
  const endTopSv = useSharedValue(expandLayout?.expanded.y ?? 0);
  const endWidthSv = useSharedValue(expandLayout?.expanded.width ?? windowWidth);
  const endHeightSv = useSharedValue(expandLayout?.expanded.height ?? windowHeight);
  const progressSv = useSharedValue(expanded ? 1 : 0);
  const prevExpandedRef = useRef(expanded);
  const onCollapseRef = useRef(onCollapseTransition);
  onCollapseRef.current = onCollapseTransition;

  const expandedPadding = useMemo(
    () => boundsPaddingForFullScreenMap(insets),
    [insets.top, insets.bottom],
  );

  useEffect(() => {
    if (expandLayout) {
      leftSv.value = expandLayout.collapsed.x;
      topSv.value = expandLayout.collapsed.y;
      widthSv.value = expandLayout.collapsed.width;
      heightSv.value = expandLayout.collapsed.height;
      endLeftSv.value = expandLayout.expanded.x;
      endTopSv.value = expandLayout.expanded.y;
      endWidthSv.value = expandLayout.expanded.width;
      endHeightSv.value = expandLayout.expanded.height;
    }
  }, [
    expandLayout,
    endHeightSv,
    endLeftSv,
    endTopSv,
    endWidthSv,
    heightSv,
    leftSv,
    topSv,
    widthSv,
  ]);

  useEffect(() => {
    const wasExpanded = prevExpandedRef.current;
    const changedMode = wasExpanded !== expanded;
    prevExpandedRef.current = expanded;

    const duration = 220;
    const easing = Easing.out(Easing.cubic);

    if (expanded) {
      if (!expandLayout) return;
      const hasLayout =
        expandLayout.collapsed.width > 0 && expandLayout.collapsed.height > 0;
      if (!hasLayout) return;
      const shouldAnimate = changedMode || progressSv.value < 0.99;
      if (!shouldAnimate) return;
      progressSv.value = withTiming(1, { duration, easing }, (finished) => {
        if (finished) {
          progressSv.value = 1;
        }
      });
      return;
    }

    if (!changedMode) return;
    progressSv.value = withTiming(0, { duration, easing }, (finished) => {
      if (finished) {
        progressSv.value = 0;
      }
    });
    onCollapseRef.current?.();
  }, [expandLayout, expanded, progressSv]);

  const cardStyle = useAnimatedStyle(() => {
    const p = progressSv.value;
    const isCollapsedProgress = p <= COLLAPSED_PROGRESS_THRESHOLD;

    if (isCollapsedProgress) {
      return {
        position: "relative" as const,
        zIndex: MINI_MAP_COLLAPSED_Z_INDEX,
        width: "100%" as const,
        aspectRatio: 1,
        borderRadius: MINI_MAP_BORDER_RADIUS,
      };
    }

    if (expandLayout == null) {
      return {
        position: "relative" as const,
        zIndex: MINI_MAP_COLLAPSED_Z_INDEX,
        width: "100%" as const,
        aspectRatio: 1,
        borderRadius: MINI_MAP_BORDER_RADIUS,
      };
    }

    const fillGate = p <= COLLAPSED_ABSOLUTE_FILL_THRESHOLD;
    const sizeProgress = Math.min(
      1,
      Math.max(
        0,
        (p - COLLAPSED_ABSOLUTE_FILL_THRESHOLD) /
          (1 - COLLAPSED_ABSOLUTE_FILL_THRESHOLD),
      ),
    );

    if (fillGate) {
      return {
        position: "absolute" as const,
        zIndex: MINI_MAP_COLLAPSED_Z_INDEX,
        left: leftSv.value,
        top: topSv.value,
        width: "100%" as const,
        height: "100%" as const,
        borderRadius: MINI_MAP_BORDER_RADIUS,
      };
    }

    return {
      position: "absolute" as const,
      zIndex: Math.round(
        interpolate(p, [0, 1], [MINI_MAP_COLLAPSED_Z_INDEX, MINI_MAP_EXPANDED_Z_INDEX]),
      ),
      left: interpolate(p, [0, 1], [leftSv.value, endLeftSv.value]),
      top: interpolate(p, [0, 1], [topSv.value, endTopSv.value]),
      width: Math.max(
        1,
        Math.round(
          interpolate(sizeProgress, [0, 1], [widthSv.value, endWidthSv.value]),
        ),
      ),
      height: Math.max(
        1,
        Math.round(
          interpolate(sizeProgress, [0, 1], [heightSv.value, endHeightSv.value]),
        ),
      ),
      borderRadius: interpolate(p, [0, 1], [MINI_MAP_BORDER_RADIUS, 0]),
    };
  });

  return { cardStyle, expandedPadding, insets };
}
