import type { ScalingTextSizeSpec } from "@/constants/uiScale/types";
import type { TypographySpec } from "@/constants/text/style/types";
import {
  useResolvedScalingBounds,
  useResolvedTypography,
  useTextMeasureKey,
} from "@/utils/resolvers";
import {
  Children,
  isValidElement,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import {
  computeScalingTextFontSizeFromCombinedWidth,
  measureUnconstrainedTextWidth,
} from "@/utils/scalingText";

const UNCONSTRAINED_MEASURE_WIDTH = 10000;

export type ScalingTextGroupSegmentProps = {
  children: string;
  style?: StyleProp<TextStyle>;
  measureTextStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
  ellipsizeMode?: "clip" | "head" | "middle" | "tail";
  flex?: number;
  flexShrink?: number;
  minWidth?: number;
  hideWhenEmpty?: boolean;
};

export type ScalingTextGroupProps = {
  size: ScalingTextSizeSpec;
  typography: TypographySpec;
  gap?: number;
  widthSafetyMargin?: number;
  containerStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
};

function ScalingTextGroupSegment(_props: ScalingTextGroupSegmentProps): null {
  return null;
}

function collectSegments(children: ReactNode): ScalingTextGroupSegmentProps[] {
  const segments: ScalingTextGroupSegmentProps[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }
    if (child.type !== ScalingTextGroupSegment) {
      return;
    }
    const props = (child as ReactElement<ScalingTextGroupSegmentProps>).props;
    if (props.hideWhenEmpty && props.children === "") {
      return;
    }
    segments.push(props);
  });
  return segments;
}

function segmentSignature(segments: ScalingTextGroupSegmentProps[]): string {
  return segments.map((segment) => segment.children).join("\u0000");
}

function ScalingTextGroup({
  size,
  typography,
  gap = 0,
  widthSafetyMargin = 0,
  containerStyle,
  children,
}: ScalingTextGroupProps) {
  const { maxFontSize, minFontSize } = useResolvedScalingBounds(size);
  const typographyStyle = useResolvedTypography(typography);
  const measureKey = useTextMeasureKey();

  const segments = useMemo(() => collectSegments(children), [children]);
  const signature = segmentSignature(segments);
  const [containerWidth, setContainerWidth] = useState(0);
  const [widthsAtMax, setWidthsAtMax] = useState<number[]>([]);
  const prevMeasureKeyRef = useRef(measureKey);
  const prevSegmentCountRef = useRef(segments.length);

  useLayoutEffect(() => {
    const measureKeyChanged = prevMeasureKeyRef.current !== measureKey;
    const segmentCountChanged = prevSegmentCountRef.current !== segments.length;
    prevMeasureKeyRef.current = measureKey;
    prevSegmentCountRef.current = segments.length;
    if (measureKeyChanged || segmentCountChanged) {
      setWidthsAtMax([]);
    }
  }, [measureKey, segments.length]);

  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  const onSegmentMeasure = useCallback((index: number, width: number) => {
    setWidthsAtMax((prev) => {
      if (prev[index] === width) {
        return prev;
      }
      const next = [...prev];
      next[index] = width;
      return next;
    });
  }, []);

  const allWidthsMeasured =
    segments.length > 0 &&
    widthsAtMax.length >= segments.length &&
    segments.every((_, index) => (widthsAtMax[index] ?? 0) > 0);

  const fontSize = useMemo(() => {
    if (!allWidthsMeasured || containerWidth <= 0) {
      return maxFontSize;
    }
    return computeScalingTextFontSizeFromCombinedWidth(
      containerWidth,
      widthsAtMax.slice(0, segments.length),
      { maxFontSize, minFontSize, widthSafetyMargin, gap },
    );
  }, [
    allWidthsMeasured,
    containerWidth,
    widthsAtMax,
    segments.length,
    maxFontSize,
    minFontSize,
    widthSafetyMargin,
    gap,
  ]);

  const measureBaseStyle = useMemo(
    () => [typographyStyle, { fontSize: maxFontSize }],
    [typographyStyle, maxFontSize],
  );

  if (segments.length === 0) {
    return null;
  }

  return (
    <View
      style={[styles.container, containerStyle]}
      onLayout={onContainerLayout}
    >
      <View style={styles.measureLayer} pointerEvents="none">
        {segments.map((segment, index) => (
          <View key={`${signature}-${index}`} style={styles.unconstrainedMeasureWrap}>
            <Text
              allowFontScaling={false}
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={[
                measureBaseStyle,
                segment.measureTextStyle ?? segment.style,
              ]}
              onTextLayout={(event) => {
                const width = measureUnconstrainedTextWidth(
                  event.nativeEvent.lines,
                );
                if (width > 0) {
                  onSegmentMeasure(index, width);
                }
              }}
            >
              {segment.children}
            </Text>
          </View>
        ))}
      </View>
      <View style={[styles.row, gap > 0 ? { gap } : null]}>
        {segments.map((segment, index) => (
          <View
            key={`${signature}-${index}-visible`}
            style={[
              segment.flex != null ? { flex: segment.flex } : null,
              segment.flexShrink != null
                ? { flexShrink: segment.flexShrink }
                : segment.flex == null
                  ? { flexShrink: 0 }
                  : null,
              segment.minWidth != null ? { minWidth: segment.minWidth } : null,
            ]}
          >
            <Text
              allowFontScaling={false}
              numberOfLines={segment.numberOfLines ?? 1}
              ellipsizeMode={segment.ellipsizeMode ?? "tail"}
              style={[typographyStyle, segment.style, { fontSize }]}
            >
              {segment.children}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

ScalingTextGroup.Segment = ScalingTextGroupSegment;

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
  },
  measureLayer: {
    position: "absolute",
    opacity: 0,
    left: 0,
    top: 0,
    width: UNCONSTRAINED_MEASURE_WIDTH,
    maxHeight: 1,
    overflow: "hidden",
  },
  unconstrainedMeasureWrap: {
    width: UNCONSTRAINED_MEASURE_WIDTH,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export { ScalingTextGroup };
