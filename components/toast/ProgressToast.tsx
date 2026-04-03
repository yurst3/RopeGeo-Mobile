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
  DOWNLOAD_TOAST_TEXT,
  TOAST_HORIZONTAL_INSET,
} from "./constants";

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
  wrapStyle?: StyleProp<ViewStyle>;
};

/**
 * Download-style toast: progress with bar, or success/error pill. Fades in when mounted;
 * opacity stays at 1 while `kind` changes between non-idle states.
 */
export function ProgressToast({
  kind,
  title,
  progress = 0,
  top,
  horizontalInset = TOAST_HORIZONTAL_INSET,
  zIndex = 3651,
  wrapStyle,
}: ProgressToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const prevKindRef = useRef<ProgressToastKind | "idle">("idle");

  const progress01 = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    const prev = prevKindRef.current;
    prevKindRef.current = kind;

    if (prev === "idle") {
      opacity.stopAnimation();
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: DOWNLOAD_TOAST_FADE_IN_MS,
        useNativeDriver: true,
      }).start();
      return;
    }
    opacity.setValue(1);
  }, [kind, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          top,
          left: horizontalInset,
          right: horizontalInset,
          zIndex,
          opacity,
        },
        wrapStyle,
      ]}
    >
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
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
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
