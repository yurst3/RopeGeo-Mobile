import { useEffect, useMemo, useRef } from "react";
import { Dimensions } from "react-native";
import {
  Easing,
  type SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { boundsPaddingForFullScreenMap } from "./fullScreenMapLayout";

export type Rect = { x: number; y: number; width: number; height: number };

export function useMiniMapAnimation({
  anchorRect,
  baseScrollY,
  scrollY,
  expanded,
  onCollapseTransition,
}: {
  anchorRect: Rect | null;
  baseScrollY: number;
  scrollY: SharedValue<number>;
  expanded: boolean;
  onCollapseTransition?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
  const leftSv = useSharedValue(anchorRect?.x ?? 0);
  const topSv = useSharedValue(anchorRect?.y ?? 0);
  const widthSv = useSharedValue(anchorRect?.width ?? 0);
  const heightSv = useSharedValue(anchorRect?.height ?? 0);
  const baseScrollYSv = useSharedValue(baseScrollY);
  const progressSv = useSharedValue(expanded ? 1 : 0);
  const prevExpandedRef = useRef(expanded);
  const onCollapseRef = useRef(onCollapseTransition);
  onCollapseRef.current = onCollapseTransition;

  useEffect(() => {
    baseScrollYSv.value = baseScrollY;
  }, [baseScrollY, baseScrollYSv]);

  const expandedPadding = useMemo(
    () => boundsPaddingForFullScreenMap(insets),
    [insets.top, insets.bottom]
  );

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

  const cardStyle = useAnimatedStyle(() => {
    const scrollDelta = scrollY.value - baseScrollYSv.value;
    return {
      left: interpolate(progressSv.value, [0, 1], [leftSv.value, 0]),
      top: interpolate(progressSv.value, [0, 1], [topSv.value, 0]),
      width: Math.max(1, Math.round(interpolate(progressSv.value, [0, 1], [widthSv.value, windowWidth]))),
      height: Math.max(1, Math.round(interpolate(progressSv.value, [0, 1], [heightSv.value, windowHeight]))),
      borderRadius: interpolate(progressSv.value, [0, 1], [12, 0]),
      transform: [
        { translateY: interpolate(progressSv.value, [0, 1], [-scrollDelta, 0]) },
      ],
    };
  });

  return { cardStyle, expandedPadding, insets };
}
