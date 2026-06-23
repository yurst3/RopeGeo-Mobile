import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { ToastTextLine } from "@/components/toast/ToastTextLine";
import type { ToastStyle } from "@/constants/colors/types";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useTextStyle } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import {
  DOWNLOAD_TOAST_FADE_IN_MS,
  DOWNLOAD_TOAST_FADE_OUT_MS,
  TOAST_HORIZONTAL_INSET,
  TOAST_STACK_REPOSITION_MS,
} from "@/constants/toasts";

import type { ProgressToastKind } from "@/constants/toasts/types";

export type { ProgressToastKind } from "@/constants/toasts/types";

export type ProgressToastProps = {
  kind: ProgressToastKind;
  style: ToastStyle;
  /** Primary line; caller formats (e.g. phase label, success copy). */
  title: string;
  /** When set, title uses {@link ScalingText}; otherwise {@link ConstantText}. */
  titleMaxLines?: number;
  /** 0–1 bar width when `kind === 'progress'`; ignored for success/error. */
  progress?: number;
  top: number;
  horizontalInset?: number;
  zIndex?: number;
  fadeOutMs?: number;
  /** When true, fades out then calls `onExitComplete`. */
  exiting?: boolean;
  /** Invoked once after exit fade finishes (unless the exit animation is cancelled). */
  onExitComplete?: () => void;
  /** Reports the measured height of the positioned wrap for stack layout. */
  onMeasuredHeight?: (height: number) => void;
  wrapStyle?: StyleProp<ViewStyle>;
};

/**
 * Download-style toast: progress with bar, or success/error pill. Fades in on first paint;
 * opacity stays at 1 while `kind` changes between non-idle states; fade-out while `exiting`.
 */
export function ProgressToast({
  kind,
  style,
  title,
  titleMaxLines,
  progress = 0,
  top,
  horizontalInset = TOAST_HORIZONTAL_INSET,
  zIndex = 3651,
  fadeOutMs = DOWNLOAD_TOAST_FADE_OUT_MS,
  exiting = false,
  onExitComplete,
  onMeasuredHeight,
  wrapStyle,
}: ProgressToastProps) {
  const { background, text, filledTrack, unfilledTrack } =
    useColorTheme().toast[style];
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const opacity = useRef(new Animated.Value(0)).current;
  const topAnim = useRef(new Animated.Value(top)).current;
  const prevTopRef = useRef<number | null>(null);
  const prevKindRef = useRef<ProgressToastKind | "idle">("idle");
  const onExitCompleteRef = useRef(onExitComplete);
  onExitCompleteRef.current = onExitComplete;
  const onMeasuredHeightRef = useRef(onMeasuredHeight);
  onMeasuredHeightRef.current = onMeasuredHeight;

  const progress01 = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    if (prevTopRef.current === null) {
      topAnim.setValue(top);
      prevTopRef.current = top;
    } else if (prevTopRef.current !== top) {
      prevTopRef.current = top;
      topAnim.stopAnimation();
      Animated.timing(topAnim, {
        toValue: top,
        duration: TOAST_STACK_REPOSITION_MS,
        useNativeDriver: false,
      }).start();
    }
  }, [top, topAnim]);

  useEffect(() => {
    return () => {
      topAnim.stopAnimation();
    };
  }, [topAnim]);

  useEffect(() => {
    if (exiting) {
      return;
    }
    opacity.stopAnimation();
    const prev = prevKindRef.current;
    prevKindRef.current = kind;

    if (prev === "idle") {
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: DOWNLOAD_TOAST_FADE_IN_MS,
        useNativeDriver: true,
      }).start();
      return;
    }
    opacity.setValue(1);
  }, [exiting, kind, opacity]);

  useEffect(() => {
    if (!exiting) {
      return;
    }
    opacity.stopAnimation();
    Animated.timing(opacity, {
      toValue: 0,
      duration: fadeOutMs,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onExitCompleteRef.current?.();
      }
    });
    return () => {
      opacity.stopAnimation();
    };
  }, [exiting, fadeOutMs, opacity]);

  const titleLine = (
    <ToastTextLine
      maxLines={titleMaxLines}
      size={uiScale.toast.text.message}
      typography={textStyle.toast.message}
      style={[styles.title, { color: text }]}
    >
      {title}
    </ToastTextLine>
  );

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={(event) => {
        onMeasuredHeightRef.current?.(event.nativeEvent.layout.height);
      }}
      style={[
        styles.wrap,
        {
          top: topAnim,
          left: horizontalInset,
          right: horizontalInset,
          zIndex,
        },
        wrapStyle,
      ]}
    >
      <Animated.View style={[styles.opacityShell, { opacity }]}>
        {kind === "progress" ? (
          <View style={[styles.inner, { backgroundColor: background }]}>
            {titleLine}
            <View style={[styles.track, { backgroundColor: unfilledTrack }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.round(progress01 * 100)}%`,
                    backgroundColor: filledTrack,
                  },
                ]}
              />
            </View>
          </View>
        ) : null}
        {kind === "success" || kind === "error" ? (
          <View style={[styles.inner, { backgroundColor: background }]}>
            {titleLine}
          </View>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    justifyContent: "center",
  },
  opacityShell: {
    alignItems: "center",
    alignSelf: "stretch",
  },
  inner: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  title: {
    textAlign: "center",
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
});
