import { useEffect, useRef } from "react";
import { Dimensions } from "react-native";
import {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { ExpandedImageAnchorRect } from "./types";

export type Rect = { x: number; y: number; width: number; height: number };

/** Collapsed thumbnail + fullscreen targets (window coordinates). */
export type ExpandedImageExpandLayout = {
  collapsed: Rect;
  expanded: Rect;
};

export const EXPANDED_IMAGE_ANIMATION_MS = 220;

export function anchorRectToExpandLayout(
  anchor: ExpandedImageAnchorRect,
  windowWidth: number,
  windowHeight: number,
): ExpandedImageExpandLayout {
  return {
    collapsed: {
      x: anchor.x,
      y: anchor.y,
      width: anchor.width,
      height: anchor.height,
    },
    expanded: { x: 0, y: 0, width: windowWidth, height: windowHeight },
  };
}

/**
 * Expand/collapse card animation — coordinated like {@link useMiniMapAnimation}.
 */
export function useExpandedImageExpandAnimation({
  expandLayout,
  expanded,
  collapseGeneration,
  onCollapseAnimationComplete,
}: {
  expandLayout: ExpandedImageExpandLayout | null;
  expanded: boolean;
  /** Increment to play collapse while `expanded` remains true. */
  collapseGeneration: number;
  onCollapseAnimationComplete?: () => void;
}) {
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
  const lastCollapseGenerationRef = useRef(0);

  useEffect(() => {
    if (!expandLayout) return;
    leftSv.value = expandLayout.collapsed.x;
    topSv.value = expandLayout.collapsed.y;
    widthSv.value = expandLayout.collapsed.width;
    heightSv.value = expandLayout.collapsed.height;
    endLeftSv.value = expandLayout.expanded.x;
    endTopSv.value = expandLayout.expanded.y;
    endWidthSv.value = expandLayout.expanded.width;
    endHeightSv.value = expandLayout.expanded.height;
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

    const duration = EXPANDED_IMAGE_ANIMATION_MS;
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
    progressSv.value = 0;
  }, [expandLayout, expanded, progressSv]);

  useEffect(() => {
    if (collapseGeneration === 0) return;
    if (collapseGeneration === lastCollapseGenerationRef.current) return;
    if (!expandLayout) return;

    lastCollapseGenerationRef.current = collapseGeneration;
    const duration = EXPANDED_IMAGE_ANIMATION_MS;
    const collapseEasing = Easing.in(Easing.cubic);

    progressSv.value = withTiming(0, { duration, easing: collapseEasing }, (finished) => {
      if (finished) {
        progressSv.value = 0;
        if (onCollapseAnimationComplete) {
          runOnJS(onCollapseAnimationComplete)();
        }
      }
    });
  }, [collapseGeneration, expandLayout, onCollapseAnimationComplete, progressSv]);

  const cardStyle = useAnimatedStyle(() => {
    const p = progressSv.value;

    if (expandLayout == null) {
      return {
        position: "absolute" as const,
        left: 0,
        top: 0,
        width: windowWidth,
        height: windowHeight,
        borderRadius: 0,
        overflow: "hidden" as const,
      };
    }

    return {
      position: "absolute" as const,
      left: interpolate(p, [0, 1], [leftSv.value, endLeftSv.value]),
      top: interpolate(p, [0, 1], [topSv.value, endTopSv.value]),
      width: Math.max(
        1,
        Math.round(interpolate(p, [0, 1], [widthSv.value, endWidthSv.value])),
      ),
      height: Math.max(
        1,
        Math.round(interpolate(p, [0, 1], [heightSv.value, endHeightSv.value])),
      ),
      borderRadius: interpolate(p, [0, 1], [12, 0]),
      overflow: "hidden" as const,
    };
  });

  return { cardStyle, expandProgress: progressSv };
}
