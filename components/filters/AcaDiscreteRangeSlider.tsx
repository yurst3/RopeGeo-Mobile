import { DEFAULT_BADGE_SIZE } from "@/components/badges/Badge";
import { ConstantText } from "@/components/text/ConstantText";
import { ScalingText } from "@/components/text/ScalingText";
import { useFilterTheme } from "@/components/filters/useFilterTheme";
import { useTextStyle } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import {
  useResolvedMultiSliderThumbScale,
  useResolvedScalingBounds,
} from "@/utils/resolvers";
import React, { type ComponentType } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import type { BadgeThumbProps } from "./acaDifficultyBadgeMaps";
import { FILTER_SHEET_HORIZONTAL_INSET } from "./filterSheetInsets";

const THUMB_HIT = 48;
const TRACK_HEIGHT = 10;
/** Diameter of each step dot on the track */
const TICK_SIZE = 10;
const TICK_RADIUS = TICK_SIZE / 2;

const THUMB_TOP = 0;
const TICK_LABEL_SLOT_W = 40;
const THUMB_TITLE_COL_W = 64;
const THUMB_TITLE_MERGED_W = 168;
const THUMB_LABEL_MAX_LINES = 2;
const TICK_LABEL_MAX_LINES = 1;
const TEXT_LINE_HEIGHT_FACTOR = 1.2;
const LABEL_TRACK_OVERLAP = 8;
const CANVAS_BOTTOM_PAD = 2;
/** Pull tick labels up into the lower hit-band so they sit closer to the track. */
const TICK_LABELS_OVERLAP_INTO_HIT = 10;
/** Thumb titles stay just below scaled badge bottoms (not the full tick row). */
const THUMB_TITLES_GAP_BELOW_BADGE = 0;

function computeMultiSliderCanvasLayout(
  multiSliderThumbScale: number,
  thumbLabelMaxPx: number,
  tickLabelMaxPx: number,
  showTickLabels: boolean,
) {
  const badgeOverflowBelow = Math.max(
    0,
    Math.round((DEFAULT_BADGE_SIZE * multiSliderThumbScale - THUMB_HIT) / 2),
  );
  const tickRowH = Math.ceil(
    tickLabelMaxPx * TICK_LABEL_MAX_LINES * TEXT_LINE_HEIGHT_FACTOR,
  );
  const thumbRowH = Math.ceil(
    thumbLabelMaxPx * THUMB_LABEL_MAX_LINES * TEXT_LINE_HEIGHT_FACTOR,
  );
  const thumbTitlesBelowBadge =
    THUMB_HIT + badgeOverflowBelow + THUMB_TITLES_GAP_BELOW_BADGE;
  const tickLabelsTop = showTickLabels
    ? THUMB_HIT - TICK_LABELS_OVERLAP_INTO_HIT
    : thumbTitlesBelowBadge;
  const thumbTitlesTop = showTickLabels
    ? Math.max(
        tickLabelsTop + tickRowH - LABEL_TRACK_OVERLAP,
        thumbTitlesBelowBadge,
      )
    : thumbTitlesBelowBadge;
  const canvasHeight = thumbTitlesTop + thumbRowH + CANVAS_BOTTOM_PAD;

  return {
    canvasHeight,
    tickLabelsTop,
    tickRowH,
    thumbTitlesTop,
    thumbRowH,
  };
}

function TickLabel({
  children,
  color,
}: {
  children: string;
  color: string;
}) {
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

  return (
    <ScalingText
      size={uiScale.filter.text.multiSliderTickLabel}
      typography={textStyle.filter.note}
      numberOfLines={TICK_LABEL_MAX_LINES}
      ellipsizeMode="tail"
      measure={{ type: "width", widthSafetyMargin: 2 }}
      containerStyle={styles.tickLabelMeasureWrap}
      style={[styles.tickLabelText, { color }]}
    >
      {children}
    </ScalingText>
  );
}

function ThumbLabel({
  children,
  width,
  height,
  color,
}: {
  children: string;
  width: number;
  height: number;
  color: string;
}) {
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

  return (
    <ScalingText
      size={uiScale.filter.text.multiSliderThumbLabel}
      typography={textStyle.filter.sectionTitle}
      numberOfLines={THUMB_LABEL_MAX_LINES}
      ellipsizeMode="tail"
      measure={{ type: "lineCount", maxLinesAtMaxSize: THUMB_LABEL_MAX_LINES }}
      containerStyle={{ width, height }}
      style={[styles.thumbTitleText, { color }]}
    >
      {children}
    </ScalingText>
  );
}

/**
 * Pan must move this many px horizontally before the thumb gesture activates,
 * so slight vertical motion doesn’t hand off to the parent ScrollView first.
 */
const THUMB_PAN_ACTIVE_OFFSET_X = 10;
/**
 * Allow this much vertical wander (px) before the pan fails; larger = more
 * forgiving diagonal drags, but very vertical scrolls may feel stickier first.
 */
const THUMB_PAN_FAIL_OFFSET_Y = 40;

function thumbCenterX(index: number, trackWidth: number, n: number): number {
  if (n <= 1) return trackWidth / 2;
  const inner = Math.max(0, trackWidth - THUMB_HIT);
  return THUMB_HIT / 2 + (index / (n - 1)) * inner;
}

/** Gap between 48px hit boxes when min === max so both thumbs stay grabbable. */
const THUMB_GAP_WHEN_COLLAPSED = 24;

/**
 * When low and high share the same discrete index, nudge centers apart (with edge clamp)
 * so PanResponder hit areas do not stack.
 */
function thumbDisplayCenters(
  lowIdx: number,
  highIdx: number,
  trackWidth: number,
  n: number,
): { xLow: number; xHigh: number } {
  const baseLow = thumbCenterX(lowIdx, trackWidth, n);
  const baseHigh = thumbCenterX(highIdx, trackWidth, n);
  if (lowIdx !== highIdx) {
    return { xLow: baseLow, xHigh: baseHigh };
  }
  const halfSep = (THUMB_HIT + THUMB_GAP_WHEN_COLLAPSED) / 4;
  let xLow = baseLow - halfSep;
  let xHigh = baseHigh + halfSep;
  const minC = THUMB_HIT / 2;
  const maxC = trackWidth - THUMB_HIT / 2;
  if (xLow < minC) {
    const shift = minC - xLow;
    xLow = minC;
    xHigh = Math.min(maxC, xHigh + shift);
  }
  if (xHigh > maxC) {
    const shift = xHigh - maxC;
    xHigh = maxC;
    xLow = Math.max(minC, xLow - shift);
  }
  return { xLow, xHigh };
}

function mergedThumbLabelBounds(
  centerX: number,
  trackWidth: number,
  maxW: number = THUMB_TITLE_MERGED_W,
  horizontalBleed: number = FILTER_SHEET_HORIZONTAL_INSET,
): { left: number; width: number } {
  const halfAvailable = Math.min(
    centerX + horizontalBleed,
    trackWidth - centerX + horizontalBleed,
  );
  const width = Math.min(maxW, Math.max(0, halfAvailable * 2));
  return {
    left: centerX - width / 2,
    width,
  };
}

export type AcaDiscreteRangeSliderProps<T extends string> = {
  label: string;
  orderedValues: readonly T[];
  min: T;
  max: T;
  onChange: (min: T, max: T) => void;
  badges: Record<T, ComponentType<BadgeThumbProps>>;
  /** Descriptive titles under thumbs (same copy as badge `showLabel`). */
  thumbTitles: Record<T, string>;
  /** Short label under each tick (defaults to the enum/string value). */
  formatTickLabel?: (value: T) => string;
};

/**
 * Two-thumb discrete range: each stop shows the ACA badge for that rating value.
 */
export function AcaDiscreteRangeSlider<T extends string>({
  label,
  orderedValues,
  min,
  max,
  badges,
  onChange,
  thumbTitles,
  formatTickLabel = (v: T) => String(v),
}: AcaDiscreteRangeSliderProps<T>) {
  const { filter, sectionLabel, text } = useFilterTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const { badgeSlider } = filter;
  const multiSliderThumbScale = useResolvedMultiSliderThumbScale();
  const { maxFontSize: thumbLabelMaxPx } = useResolvedScalingBounds(
    uiScale.filter.text.multiSliderThumbLabel,
  );
  const { maxFontSize: tickLabelMaxPx } = useResolvedScalingBounds(
    uiScale.filter.text.multiSliderTickLabel,
  );
  const n = orderedValues.length;
  const minIndex = Math.max(0, orderedValues.indexOf(min));
  const maxIndexRaw = orderedValues.indexOf(max);
  const maxIndex =
    maxIndexRaw >= 0 ? maxIndexRaw : Math.max(0, n - 1);

  const [lowIdx, setLowIdx] = useState(() =>
    Math.min(minIndex, Math.max(0, n - 1)),
  );
  const [highIdx, setHighIdx] = useState(() =>
    Math.min(Math.max(maxIndex, minIndex), Math.max(0, n - 1)),
  );

  const lowIdxRef = useRef(lowIdx);
  const highIdxRef = useRef(highIdx);
  lowIdxRef.current = lowIdx;
  highIdxRef.current = highIdx;

  const trackWRef = useRef(0);
  const [trackW, setTrackW] = useState(0);

  const startLowIdx = useRef(0);
  const startHighIdx = useRef(0);

  const clampLow = useCallback(
    (idx: number) =>
      Math.max(0, Math.min(highIdxRef.current, Math.round(idx))),
    [],
  );
  const clampHigh = useCallback(
    (idx: number) =>
      Math.max(lowIdxRef.current, Math.min(n - 1, Math.round(idx))),
    [n],
  );

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const emit = useCallback(
    (lo: number, hi: number) => {
      const a = orderedValues[lo];
      const b = orderedValues[hi];
      if (a !== undefined && b !== undefined) {
        onChangeRef.current(a, b);
      }
    },
    [orderedValues],
  );

  useEffect(() => {
    const lo = Math.min(minIndex, Math.max(0, n - 1));
    const hi = Math.min(Math.max(maxIndex, lo), Math.max(0, n - 1));
    setLowIdx(lo);
    setHighIdx(hi);
  }, [min, max, minIndex, maxIndex, n]);

  const onLowPanStart = useCallback(() => {
    startLowIdx.current = lowIdxRef.current;
  }, []);

  const onLowPanUpdate = useCallback(
    (translationX: number) => {
      const w = trackWRef.current;
      if (w <= 0 || n <= 1) return;
      const step = (Math.max(0, w - THUMB_HIT)) / (n - 1);
      if (step <= 0) return;
      const delta = Math.round(translationX / step);
      const next = clampLow(startLowIdx.current + delta);
      if (next !== lowIdxRef.current) {
        setLowIdx(next);
        emit(next, highIdxRef.current);
      }
    },
    [n, clampLow, emit],
  );

  const onHighPanStart = useCallback(() => {
    startHighIdx.current = highIdxRef.current;
  }, []);

  const onHighPanUpdate = useCallback(
    (translationX: number) => {
      const w = trackWRef.current;
      if (w <= 0 || n <= 1) return;
      const step = (Math.max(0, w - THUMB_HIT)) / (n - 1);
      if (step <= 0) return;
      const delta = Math.round(translationX / step);
      const next = clampHigh(startHighIdx.current + delta);
      if (next !== highIdxRef.current) {
        setHighIdx(next);
        emit(lowIdxRef.current, next);
      }
    },
    [n, clampHigh, emit],
  );

  const panLowGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(n > 0)
        .activeOffsetX([
          -THUMB_PAN_ACTIVE_OFFSET_X,
          THUMB_PAN_ACTIVE_OFFSET_X,
        ])
        .failOffsetY([-THUMB_PAN_FAIL_OFFSET_Y, THUMB_PAN_FAIL_OFFSET_Y])
        .onStart(() => {
          runOnJS(onLowPanStart)();
        })
        .onUpdate((e) => {
          runOnJS(onLowPanUpdate)(e.translationX);
        }),
    [n, onLowPanStart, onLowPanUpdate],
  );

  const panHighGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(n > 0)
        .activeOffsetX([
          -THUMB_PAN_ACTIVE_OFFSET_X,
          THUMB_PAN_ACTIVE_OFFSET_X,
        ])
        .failOffsetY([-THUMB_PAN_FAIL_OFFSET_Y, THUMB_PAN_FAIL_OFFSET_Y])
        .onStart(() => {
          runOnJS(onHighPanStart)();
        })
        .onUpdate((e) => {
          runOnJS(onHighPanUpdate)(e.translationX);
        }),
    [n, onHighPanStart, onHighPanUpdate],
  );

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWRef.current = w;
    setTrackW(w);
  }, []);

  const lowVal = orderedValues[lowIdx];
  const highVal = orderedValues[highIdx];
  const LowBadge = lowVal != null ? badges[lowVal] : null;
  const HighBadge = highVal != null ? badges[highVal] : null;

  const tw = trackW || 0;
  const { xLow, xHigh } = thumbDisplayCenters(lowIdx, highIdx, tw, n);
  const fillLeft = Math.min(xLow, xHigh);
  const fillWidth = Math.abs(xHigh - xLow);

  const sameThumbValue = lowIdx === highIdx;
  const lowTitle = lowVal != null ? thumbTitles[lowVal] : "";
  const highTitle = highVal != null ? thumbTitles[highVal] : "";
  const mergedTitle =
    sameThumbValue && lowVal != null ? thumbTitles[lowVal] : null;
  const mergedThumbBounds =
    trackW > 0 && mergedTitle != null
      ? mergedThumbLabelBounds((xLow + xHigh) / 2, tw)
      : { left: 0, width: THUMB_TITLE_MERGED_W };
  const showTickLabelsBand = n > 2;
  const canvasLayout = useMemo(
    () =>
      computeMultiSliderCanvasLayout(
        multiSliderThumbScale,
        thumbLabelMaxPx,
        tickLabelMaxPx,
        showTickLabelsBand,
      ),
    [
      multiSliderThumbScale,
      thumbLabelMaxPx,
      tickLabelMaxPx,
      showTickLabelsBand,
    ],
  );

  return (
    <View style={styles.block}>
      <ConstantText
        size={uiScale.filter.text.sectionTitle}
        typography={textStyle.filter.sectionTitle}
        style={[styles.label, sectionLabel]}
      >
        {label}
      </ConstantText>
      <View
        style={[styles.sliderCanvas, { height: canvasLayout.canvasHeight }]}
        onLayout={onTrackLayout}
      >
        <View style={styles.trackBand}>
          <View style={styles.trackInner}>
            <View
              style={[styles.trackBg, { backgroundColor: badgeSlider.unfilledBar }]}
            />
          {trackW > 0 && n > 0 ? (
            <View
              style={[
                styles.trackFill,
                {
                  left: fillLeft,
                  width: Math.max(fillWidth, TRACK_HEIGHT),
                  backgroundColor: badgeSlider.filledBar,
                },
              ]}
            />
          ) : null}
          {trackW > 0 && n > 0 ? (
            <View style={styles.tickLayer} pointerEvents="none">
              {Array.from({ length: n }, (_, i) => {
                const cx = thumbCenterX(i, tw, n);
                return (
                  <View
                    key={i}
                    style={[
                      styles.tick,
                      {
                        left: cx - TICK_RADIUS,
                        backgroundColor: badgeSlider.tick,
                      },
                    ]}
                  />
                );
              })}
            </View>
          ) : null}
        </View>
        {trackW > 0 && LowBadge != null ? (
          <GestureDetector gesture={panLowGesture}>
            <View
              style={[
                styles.thumbWrap,
                {
                  left: xLow - THUMB_HIT / 2,
                  top: THUMB_TOP,
                  zIndex: 2,
                },
              ]}
            >
              <View
                style={[
                  styles.thumbScale,
                  { transform: [{ scale: multiSliderThumbScale }] },
                ]}
              >
                {React.createElement(LowBadge, {})}
              </View>
            </View>
          </GestureDetector>
        ) : null}
        {trackW > 0 && HighBadge != null ? (
          <GestureDetector gesture={panHighGesture}>
            <View
              style={[
                styles.thumbWrap,
                {
                  left: xHigh - THUMB_HIT / 2,
                  top: THUMB_TOP,
                  zIndex: 2,
                },
              ]}
            >
              <View
                style={[
                  styles.thumbScale,
                  { transform: [{ scale: multiSliderThumbScale }] },
                ]}
              >
                {React.createElement(HighBadge, {})}
              </View>
            </View>
          </GestureDetector>
        ) : null}
        </View>

        {showTickLabelsBand ? (
          <View
            style={[
              styles.tickLabelsLayer,
              {
                top: canvasLayout.tickLabelsTop,
                height: canvasLayout.tickRowH,
              },
            ]}
            pointerEvents="none"
          >
            {trackW > 0
              ? Array.from({ length: n }, (_, i) => {
                  const v = orderedValues[i];
                  if (v === undefined) return null;
                  const coveredByThumb = i === lowIdx || i === highIdx;
                  const cx = thumbCenterX(i, tw, n);
                  return (
                    <View
                      key={`tick-lbl-${String(v)}`}
                      style={[
                        styles.tickLabelSlot,
                        {
                          left: cx - TICK_LABEL_SLOT_W / 2,
                          height: canvasLayout.tickRowH,
                          opacity: coveredByThumb ? 0 : 1,
                        },
                      ]}
                    >
                      <TickLabel color={text.tertiary}>
                        {formatTickLabel(v)}
                      </TickLabel>
                    </View>
                  );
                })
              : null}
          </View>
        ) : null}

        <View
          style={[
            styles.thumbTitlesLayer,
            {
              top: canvasLayout.thumbTitlesTop,
              height: canvasLayout.thumbRowH,
            },
          ]}
          pointerEvents="none"
        >
          {trackW > 0 && mergedTitle != null ? (
            <View
              style={[
                styles.thumbTitleMergedWrap,
                {
                  left: mergedThumbBounds.left,
                  width: mergedThumbBounds.width,
                  height: canvasLayout.thumbRowH,
                },
              ]}
            >
              <ThumbLabel
                width={mergedThumbBounds.width}
                height={canvasLayout.thumbRowH}
                color={text.secondary}
              >
                {mergedTitle}
              </ThumbLabel>
            </View>
          ) : null}
          {trackW > 0 && !sameThumbValue && lowVal != null ? (
            <View
              style={[
                styles.thumbTitleCol,
                {
                  left: xLow - THUMB_TITLE_COL_W / 2,
                  height: canvasLayout.thumbRowH,
                },
              ]}
            >
              <ThumbLabel
                width={THUMB_TITLE_COL_W}
                height={canvasLayout.thumbRowH}
                color={text.secondary}
              >
                {lowTitle}
              </ThumbLabel>
            </View>
          ) : null}
          {trackW > 0 && !sameThumbValue && highVal != null ? (
            <View
              style={[
                styles.thumbTitleCol,
                {
                  left: xHigh - THUMB_TITLE_COL_W / 2,
                  height: canvasLayout.thumbRowH,
                },
              ]}
            >
              <ThumbLabel
                width={THUMB_TITLE_COL_W}
                height={canvasLayout.thumbRowH}
                color={text.secondary}
              >
                {highTitle}
              </ThumbLabel>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 10,
  },
  label: {
    marginBottom: 6,
  },
  sliderCanvas: {
    position: "relative",
    width: "100%",
    overflow: "visible",
  },
  trackBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: THUMB_HIT,
  },
  trackInner: {
    width: "100%",
    height: THUMB_HIT,
    justifyContent: "center",
  },
  trackBg: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  tickLayer: {
    ...StyleSheet.absoluteFillObject,
    height: THUMB_HIT,
    width: "100%",
  },
  tick: {
    position: "absolute",
    width: TICK_SIZE,
    height: TICK_SIZE,
    borderRadius: TICK_RADIUS,
    top: (THUMB_HIT - TICK_SIZE) / 2,
  },
  trackFill: {
    position: "absolute",
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    top: (THUMB_HIT - TRACK_HEIGHT) / 2,
  },
  thumbWrap: {
    position: "absolute",
    width: THUMB_HIT,
    height: THUMB_HIT,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbScale: {},
  tickLabelsLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1,
  },
  tickLabelMeasureWrap: {
    width: TICK_LABEL_SLOT_W,
    alignItems: "center",
  },
  tickLabelSlot: {
    position: "absolute",
    top: 0,
    width: TICK_LABEL_SLOT_W,
    alignItems: "center",
  },
  tickLabelText: {
    textAlign: "center",
  },
  thumbTitlesLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2,
  },
  thumbTitleCol: {
    position: "absolute",
    top: 0,
    width: THUMB_TITLE_COL_W,
    alignItems: "center",
  },
  thumbTitleMergedWrap: {
    position: "absolute",
    top: 0,
    alignItems: "center",
  },
  thumbTitleText: {
    textAlign: "center",
  },
});
