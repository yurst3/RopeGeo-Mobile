import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
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
  computeScalingTextFontSizeFromLineCount,
  computeScalingTextFontSizeFromWidth,
  measureUnconstrainedTextWidth,
} from "@/utils/scalingText";

const UNCONSTRAINED_MEASURE_WIDTH = 10000;

export type ScalingTextWidthMeasure = {
  type: "width";
  widthSafetyMargin?: number;
};

export type ScalingTextLineCountMeasure = {
  type: "lineCount";
  /** Line budget at max font size; defaults to `numberOfLines`. */
  maxLinesAtMaxSize?: number;
  widthSafetyMargin?: number;
};

export type ScalingTextMeasure =
  | ScalingTextWidthMeasure
  | ScalingTextLineCountMeasure;

export type ScalingTextProps = {
  children: string;
  maxFontSize: number;
  minFontSize: number;
  numberOfLines: number;
  ellipsizeMode?: "clip" | "head" | "middle" | "tail";
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  measureTextStyle?: StyleProp<TextStyle>;
  measure: ScalingTextMeasure;
  /** Bumps hidden remeasurement when layout inputs change (e.g. fontScale). */
  measureKey?: string | number;
  hideWhenEmpty?: boolean;
  /** Custom visible label; `children` is still used for measurement. */
  renderLabel?: (fontSize: number) => ReactNode;
  /** Called when the computed font size changes (e.g. to sync sibling labels). */
  onFontSizeChange?: (fontSize: number) => void;
};

export function ScalingText({
  children,
  maxFontSize,
  minFontSize,
  numberOfLines,
  ellipsizeMode = "clip",
  style,
  containerStyle,
  measureTextStyle,
  measure,
  measureKey,
  hideWhenEmpty = false,
  renderLabel,
  onFontSizeChange,
}: ScalingTextProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [widthAtMax, setWidthAtMax] = useState(0);
  const [lineCountAtMax, setLineCountAtMax] = useState(0);
  const prevTextRef = useRef(children);
  const prevMeasureKeyRef = useRef(measureKey);

  useLayoutEffect(() => {
    if (
      prevTextRef.current === children &&
      prevMeasureKeyRef.current === measureKey
    ) {
      return;
    }
    prevTextRef.current = children;
    prevMeasureKeyRef.current = measureKey;
    setWidthAtMax(0);
    setLineCountAtMax(0);
  }, [children, measureKey]);

  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  const widthSafetyMargin = measure.widthSafetyMargin ?? 0;

  const fontSize = useMemo(() => {
    if (measure.type === "width") {
      return computeScalingTextFontSizeFromWidth(containerWidth, widthAtMax, {
        maxFontSize,
        minFontSize,
        widthSafetyMargin: measure.widthSafetyMargin ?? 0,
      });
    }
    return computeScalingTextFontSizeFromLineCount(lineCountAtMax, {
      maxFontSize,
      minFontSize,
      maxLinesAtMaxSize: measure.maxLinesAtMaxSize ?? numberOfLines,
    });
  }, [
    measure,
    containerWidth,
    widthAtMax,
    lineCountAtMax,
    maxFontSize,
    minFontSize,
    numberOfLines,
  ]);

  useLayoutEffect(() => {
    onFontSizeChange?.(fontSize);
  }, [fontSize, onFontSizeChange]);

  const measureWidth =
    measure.type === "width"
      ? UNCONSTRAINED_MEASURE_WIDTH
      : Math.max(0, containerWidth - widthSafetyMargin);

  const showMeasure =
    measure.type === "width" || (measure.type === "lineCount" && measureWidth > 0);

  if (hideWhenEmpty && children === "") {
    return null;
  }

  return (
    <View
      style={[styles.container, containerStyle]}
      onLayout={onContainerLayout}
    >
      {showMeasure ? (
        <View
          style={[
            measure.type === "width"
              ? styles.unconstrainedMeasureWrap
              : styles.constrainedMeasureWrap,
            measure.type === "lineCount" ? { width: measureWidth } : null,
          ]}
          pointerEvents="none"
        >
          <Text
            key={`${children}-${measureKey ?? ""}`}
            allowFontScaling={false}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={[
              measureTextStyle,
              { fontSize: maxFontSize },
            ]}
            onTextLayout={(event) => {
              const lines = event.nativeEvent.lines;
              if (measure.type === "width") {
                setWidthAtMax(measureUnconstrainedTextWidth(lines));
              } else {
                setLineCountAtMax(lines.length);
              }
            }}
          >
            {children}
          </Text>
        </View>
      ) : null}
      {renderLabel != null ? (
        renderLabel(fontSize)
      ) : (
        <Text
          allowFontScaling={false}
          numberOfLines={numberOfLines}
          ellipsizeMode={ellipsizeMode}
          style={[style, { fontSize }]}
        >
          {children}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
  },
  unconstrainedMeasureWrap: {
    position: "absolute",
    opacity: 0,
    left: 0,
    top: 0,
    width: UNCONSTRAINED_MEASURE_WIDTH,
    maxHeight: 1,
    overflow: "hidden",
  },
  constrainedMeasureWrap: {
    position: "absolute",
    opacity: 0,
    left: 0,
    top: 0,
    overflow: "hidden",
  },
});
