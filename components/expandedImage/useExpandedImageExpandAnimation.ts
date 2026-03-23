import { useEffect, useRef } from "react";
import { Dimensions } from "react-native";
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { ExpandedImageAnchorRect } from "./types";

/**
 * Expand/collapse from a measured window rect to full screen (same easing/duration as MiniMap).
 */
export function useExpandedImageExpandAnimation({
  anchorRect,
  expanded,
  onCollapseTransition,
}: {
  anchorRect: ExpandedImageAnchorRect | null;
  expanded: boolean;
  onCollapseTransition?: () => void;
}) {
  const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
  const leftSv = useSharedValue(anchorRect?.x ?? 0);
  const topSv = useSharedValue(anchorRect?.y ?? 0);
  const widthSv = useSharedValue(anchorRect?.width ?? 0);
  const heightSv = useSharedValue(anchorRect?.height ?? 0);
  const progressSv = useSharedValue(expanded ? 1 : 0);
  const prevExpandedRef = useRef(expanded);
  const onCollapseRef = useRef(onCollapseTransition);
  onCollapseRef.current = onCollapseTransition;

  useEffect(() => {
    if (!anchorRect) return;
    const wasExpanded = prevExpandedRef.current;
    const changedMode = wasExpanded !== expanded;
    prevExpandedRef.current = expanded;

    leftSv.value = anchorRect.x;
    topSv.value = anchorRect.y;
    widthSv.value = anchorRect.width;
    heightSv.value = anchorRect.height;
    if (!changedMode) return;

    const duration = 220;
    const easing = Easing.out(Easing.cubic);
    progressSv.value = withTiming(expanded ? 1 : 0, { duration, easing });

    if (!expanded) {
      onCollapseRef.current?.();
    }
  }, [anchorRect, expanded, heightSv, leftSv, progressSv, topSv, widthSv]);

  const cardStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: interpolate(progressSv.value, [0, 1], [leftSv.value, 0]),
    top: interpolate(progressSv.value, [0, 1], [topSv.value, 0]),
    width: Math.max(
      1,
      Math.round(
        interpolate(progressSv.value, [0, 1], [widthSv.value, windowWidth]),
      ),
    ),
    height: Math.max(
      1,
      Math.round(
        interpolate(progressSv.value, [0, 1], [heightSv.value, windowHeight]),
      ),
    ),
    borderRadius: interpolate(progressSv.value, [0, 1], [12, 0]),
    overflow: "hidden",
  }));

  return { cardStyle };
}
