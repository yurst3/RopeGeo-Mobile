import type { ScalingTextSizeSpec } from "@/constants/uiScale/types";
import type { TypographySpec } from "@/constants/text/style/types";
import {
  useResolvedScalingBounds,
  useResolvedTypography,
  useTextMeasureKey,
} from "@/utils/resolvers";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import {
  computeScalingTextFontSizeFromLineCount,
  computeScalingTextFontSizeFromLongestWord,
  computeScalingTextFontSizeFromWidth,
  measureUnconstrainedTextWidth,
  scalingTextWords,
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
  size: ScalingTextSizeSpec;
  typography: TypographySpec;
  numberOfLines: number;
  ellipsizeMode?: "clip" | "head" | "middle" | "tail";
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  measureTextStyle?: StyleProp<TextStyle>;
  measure: ScalingTextMeasure;
  hideWhenEmpty?: boolean;
  /** Custom visible label; `children` is still used for measurement. */
  renderLabel?: (fontSize: number) => ReactNode;
  /** Called when the computed font size changes (e.g. to sync sibling labels). */
  onFontSizeChange?: (fontSize: number) => void;
  /**
   * When true, applies platform line-break settings that prefer word boundaries over
   * mid-word wraps (iOS {@link TextProps.lineBreakStrategyIOS}, Android
   * {@link TextProps.textBreakStrategy} / {@link TextProps.android_hyphenationFrequency}).
   */
  avoidMidWordLineBreaks?: boolean;
};

function midWordLineBreakTextProps(
  avoidMidWordLineBreaks: boolean | undefined,
): Pick<
  TextProps,
  "lineBreakStrategyIOS" | "textBreakStrategy" | "android_hyphenationFrequency"
> {
  if (!avoidMidWordLineBreaks) {
    return {};
  }
  return {
    lineBreakStrategyIOS: "push-out",
    textBreakStrategy: "highQuality",
    android_hyphenationFrequency: "none",
  };
}

export function ScalingText({
  children,
  size,
  typography,
  numberOfLines,
  ellipsizeMode = "clip",
  style,
  containerStyle,
  measureTextStyle,
  measure,
  hideWhenEmpty = false,
  renderLabel,
  onFontSizeChange,
  avoidMidWordLineBreaks = false,
}: ScalingTextProps) {
  const { maxFontSize, minFontSize } = useResolvedScalingBounds(size);
  const typographyStyle = useResolvedTypography(typography);
  const measureKey = useTextMeasureKey();

  const [containerWidth, setContainerWidth] = useState(0);
  const [widthAtMax, setWidthAtMax] = useState(0);
  const [lineCountAtMax, setLineCountAtMax] = useState(0);
  const [longestWordWidthAtMax, setLongestWordWidthAtMax] = useState(0);
  const prevMeasureKeyRef = useRef(measureKey);

  const measureWords = useMemo(
    () => (avoidMidWordLineBreaks ? scalingTextWords(children) : []),
    [avoidMidWordLineBreaks, children],
  );

  useLayoutEffect(() => {
    const measureKeyChanged = prevMeasureKeyRef.current !== measureKey;
    prevMeasureKeyRef.current = measureKey;
    if (measureKeyChanged) {
      setWidthAtMax(0);
      setLineCountAtMax(0);
      setLongestWordWidthAtMax(0);
    }
  }, [measureKey]);

  useLayoutEffect(() => {
    if (!avoidMidWordLineBreaks) {
      return;
    }
    setLongestWordWidthAtMax(0);
  }, [avoidMidWordLineBreaks, children, measureKey]);

  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  const widthSafetyMargin = measure.widthSafetyMargin ?? 0;

  const fontSize = useMemo(() => {
    const wordFitOptions = {
      maxFontSize,
      minFontSize,
      widthSafetyMargin,
    };
    const capByLongestWord = (size: number) => {
      if (
        !avoidMidWordLineBreaks ||
        longestWordWidthAtMax <= 0 ||
        containerWidth <= 0
      ) {
        return size;
      }
      return Math.min(
        size,
        computeScalingTextFontSizeFromLongestWord(
          containerWidth,
          longestWordWidthAtMax,
          wordFitOptions,
        ),
      );
    };

    if (measure.type === "width") {
      return capByLongestWord(
        computeScalingTextFontSizeFromWidth(containerWidth, widthAtMax, {
          maxFontSize,
          minFontSize,
          widthSafetyMargin: measure.widthSafetyMargin ?? 0,
        }),
      );
    }
    return capByLongestWord(
      computeScalingTextFontSizeFromLineCount(lineCountAtMax, {
        maxFontSize,
        minFontSize,
        maxLinesAtMaxSize: measure.maxLinesAtMaxSize ?? numberOfLines,
      }),
    );
  }, [
    measure,
    containerWidth,
    widthAtMax,
    lineCountAtMax,
    longestWordWidthAtMax,
    avoidMidWordLineBreaks,
    maxFontSize,
    minFontSize,
    numberOfLines,
    widthSafetyMargin,
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

  const measureStyle = useMemo(
    () => [typographyStyle, measureTextStyle, { fontSize: maxFontSize }],
    [typographyStyle, measureTextStyle, maxFontSize],
  );

  const visibleStyle = useMemo(
    () => [typographyStyle, style, { fontSize }],
    [typographyStyle, style, fontSize],
  );

  const lineBreakProps = useMemo(
    () => midWordLineBreakTextProps(avoidMidWordLineBreaks),
    [avoidMidWordLineBreaks],
  );

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
            key={`${children}-${measureKey}`}
            allowFontScaling={false}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            {...lineBreakProps}
            style={measureStyle}
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
      {avoidMidWordLineBreaks && measureWords.length > 0
        ? measureWords.map((word, index) => (
            <View
              key={`${measureKey}-${index}-${word}`}
              style={styles.unconstrainedMeasureWrap}
              pointerEvents="none"
            >
              <Text
                allowFontScaling={false}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
                style={measureStyle}
                onTextLayout={(event) => {
                  const width = measureUnconstrainedTextWidth(
                    event.nativeEvent.lines,
                  );
                  if (width > 0) {
                    setLongestWordWidthAtMax((prev) => Math.max(prev, width));
                  }
                }}
              >
                {word}
              </Text>
            </View>
          ))
        : null}
      {renderLabel != null ? (
        renderLabel(fontSize)
      ) : (
        <Text
          allowFontScaling={false}
          numberOfLines={numberOfLines}
          ellipsizeMode={ellipsizeMode}
          {...lineBreakProps}
          style={[visibleStyle, styles.visibleText]}
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
  visibleText: {
    alignSelf: "stretch",
    width: "100%",
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
