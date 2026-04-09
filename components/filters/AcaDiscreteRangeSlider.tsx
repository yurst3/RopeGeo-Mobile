import React, { type ComponentType } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import type { BadgeThumbProps } from "./acaDifficultyBadgeMaps";

const THUMB_HIT = 48;
const THUMB_VISUAL_SCALE = 0.8;
const TRACK_HEIGHT = 10;
/** Diameter of each step dot on the track */
const TICK_SIZE = 10;
const TICK_RADIUS = TICK_SIZE / 2;

const THUMB_TOP = 0;
/** Bottom of the band where thumbs overlap the track (before tick text row). */
const TICK_LABEL_ROW_TOP = 32;
const TICK_LABEL_ROW_H = 14;
const THUMB_TITLE_TOP = TICK_LABEL_ROW_TOP + TICK_LABEL_ROW_H + 6;
const THUMB_TITLE_ROW_H = 36;
const TICK_LABEL_SLOT_W = 40;
const THUMB_TITLE_COL_W = 64;

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

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.trackWrap} onLayout={onTrackLayout}>
        <View style={styles.trackInner}>
          <View style={styles.trackBg} />
          {trackW > 0 && n > 0 ? (
            <View
              style={[
                styles.trackFill,
                {
                  left: fillLeft,
                  width: Math.max(fillWidth, TRACK_HEIGHT),
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
              <View style={styles.thumbScale}>
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
              <View style={styles.thumbScale}>
                {React.createElement(HighBadge, {})}
              </View>
            </View>
          </GestureDetector>
        ) : null}

        {trackW > 0 && n > 0
          ? Array.from({ length: n }, (_, i) => {
              const v = orderedValues[i];
              if (v === undefined) return null;
              const coveredByThumb = i === lowIdx || i === highIdx;
              if (coveredByThumb) return null;
              const cx = thumbCenterX(i, tw, n);
              return (
                <View
                  key={`tick-lbl-${String(v)}`}
                  style={[
                    styles.tickLabelSlot,
                    {
                      left: cx - TICK_LABEL_SLOT_W / 2,
                      top: TICK_LABEL_ROW_TOP,
                    },
                  ]}
                  pointerEvents="none"
                >
                  <Text style={styles.tickLabelText} numberOfLines={1}>
                    {formatTickLabel(v)}
                  </Text>
                </View>
              );
            })
          : null}

        {trackW > 0 && mergedTitle != null ? (
          <View
            style={[
              styles.thumbTitleMergedWrap,
              {
                left: (xLow + xHigh) / 2,
                top: THUMB_TITLE_TOP,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.thumbTitleText} numberOfLines={2}>
              {mergedTitle}
            </Text>
          </View>
        ) : null}
        {trackW > 0 && !sameThumbValue && lowVal != null ? (
          <View
            style={[
              styles.thumbTitleCol,
              {
                left: xLow - THUMB_TITLE_COL_W / 2,
                top: THUMB_TITLE_TOP,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.thumbTitleText} numberOfLines={2}>
              {lowTitle}
            </Text>
          </View>
        ) : null}
        {trackW > 0 && !sameThumbValue && highVal != null ? (
          <View
            style={[
              styles.thumbTitleCol,
              {
                left: xHigh - THUMB_TITLE_COL_W / 2,
                top: THUMB_TITLE_TOP,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.thumbTitleText} numberOfLines={2}>
              {highTitle}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  trackWrap: {
    minHeight:
      THUMB_TITLE_TOP + THUMB_TITLE_ROW_H + 6,
    justifyContent: "flex-start",
    position: "relative",
  },
  trackInner: {
    width: "100%",
    height: THUMB_HIT,
    justifyContent: "center",
  },
  trackBg: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: "#e5e7eb",
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
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#64748b",
  },
  trackFill: {
    position: "absolute",
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: "#93c5fd",
    top: (THUMB_HIT - TRACK_HEIGHT) / 2,
  },
  thumbWrap: {
    position: "absolute",
    width: THUMB_HIT,
    height: THUMB_HIT,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbScale: {
    transform: [{ scale: THUMB_VISUAL_SCALE }],
  },
  tickLabelSlot: {
    position: "absolute",
    width: TICK_LABEL_SLOT_W,
    height: TICK_LABEL_ROW_H,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  tickLabelText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6b7280",
    textAlign: "center",
  },
  thumbTitleCol: {
    position: "absolute",
    width: THUMB_TITLE_COL_W,
    minHeight: THUMB_TITLE_ROW_H,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  thumbTitleMergedWrap: {
    position: "absolute",
    width: 168,
    marginLeft: -84,
    minHeight: THUMB_TITLE_ROW_H,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  thumbTitleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
});
