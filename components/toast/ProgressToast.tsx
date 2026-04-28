import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  DOWNLOAD_COMPLETE_BG,
  DOWNLOAD_COMPLETE_TEXT,
  DOWNLOAD_FAIL_BG,
  DOWNLOAD_FAIL_TEXT,
  DOWNLOAD_TOAST_BG,
  DOWNLOAD_TOAST_FADE_IN_MS,
  DOWNLOAD_TOAST_FADE_OUT_MS,
  DOWNLOAD_TOAST_TEXT,
  TOAST_HORIZONTAL_INSET,
  TOAST_STACK_REPOSITION_MS,
} from "@/constants/toast";

export type ProgressToastKind = "progress" | "success" | "error";

export type ProgressToastProps = {
  kind: ProgressToastKind;
  /** Primary line; caller formats (e.g. phase label, success copy). */
  title: string;
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
  wrapStyle?: StyleProp<ViewStyle>;
};

/**
 * Download-style toast: progress with bar, or success/error pill. Fades in on first paint;
 * opacity stays at 1 while `kind` changes between non-idle states; fade-out while `exiting`.
 */
export function ProgressToast({
  kind,
  title,
  progress = 0,
  top,
  horizontalInset = TOAST_HORIZONTAL_INSET,
  zIndex = 3651,
  fadeOutMs = DOWNLOAD_TOAST_FADE_OUT_MS,
  exiting = false,
  onExitComplete,
  wrapStyle,
}: ProgressToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const topAnim = useRef(new Animated.Value(top)).current;
  const prevTopRef = useRef<number | null>(null);
  const prevKindRef = useRef<ProgressToastKind | "idle">("idle");
  const onExitCompleteRef = useRef(onExitComplete);
  onExitCompleteRef.current = onExitComplete;

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

  return (
    <Animated.View
      pointerEvents="none"
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
          <View style={[styles.inner, styles.innerProgress]}>
            <Text style={styles.titleProgress} numberOfLines={4}>
              {title}
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.round(progress01 * 100)}%` },
                ]}
              />
            </View>
          </View>
        ) : null}
        {kind === "success" ? (
          <View style={[styles.inner, styles.innerSuccess]}>
            <Text style={styles.titleSuccess} numberOfLines={4}>
              {title}
            </Text>
          </View>
        ) : null}
        {kind === "error" ? (
          <View style={[styles.inner, styles.innerError]}>
            <Text style={styles.titleError} numberOfLines={4}>
              {title}
            </Text>
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
  innerProgress: {
    backgroundColor: DOWNLOAD_TOAST_BG,
  },
  titleProgress: {
    color: DOWNLOAD_TOAST_TEXT,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: DOWNLOAD_TOAST_TEXT,
  },
  innerSuccess: {
    backgroundColor: DOWNLOAD_COMPLETE_BG,
  },
  titleSuccess: {
    color: DOWNLOAD_COMPLETE_TEXT,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  innerError: {
    backgroundColor: DOWNLOAD_FAIL_BG,
  },
  titleError: {
    color: DOWNLOAD_FAIL_TEXT,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
