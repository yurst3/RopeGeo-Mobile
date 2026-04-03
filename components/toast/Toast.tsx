import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import {
  DOWNLOAD_FAIL_BG,
  DOWNLOAD_FAIL_TEXT,
  SAVED_TOAST_BG,
  SAVED_TOAST_FADE_IN_MS,
  SAVED_TOAST_FADE_OUT_MS,
  SAVED_TOAST_TEXT,
  TOAST_HORIZONTAL_INSET,
} from "./constants";

export type ToastVariant = "success" | "error";

const VARIANT_STYLES: Record<
  ToastVariant,
  { inner: ViewStyle; primary: TextStyle; secondary: TextStyle }
> = {
  success: {
    inner: { backgroundColor: SAVED_TOAST_BG },
    primary: { color: SAVED_TOAST_TEXT },
    secondary: { color: SAVED_TOAST_TEXT },
  },
  error: {
    inner: { backgroundColor: DOWNLOAD_FAIL_BG },
    primary: { color: DOWNLOAD_FAIL_TEXT },
    secondary: { color: DOWNLOAD_FAIL_TEXT },
  },
};

export type ToastProps = {
  /** When false, fades out then calls {@link onHidden}. */
  visible: boolean;
  variant: ToastVariant;
  /** Primary line (e.g. title or single message). */
  message: string;
  /** Optional detail line (e.g. error body). */
  subtitle?: string;
  /** Distance from top of screen (typically safe area + header offset). */
  top: number;
  horizontalInset?: number;
  zIndex?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
  wrapStyle?: StyleProp<ViewStyle>;
  onHidden?: () => void;
};

/**
 * Pill toast with RN Animated fade in/out. Used for “Page saved”, global errors, etc.
 */
export function Toast({
  visible,
  variant,
  message,
  subtitle,
  top,
  horizontalInset = TOAST_HORIZONTAL_INSET,
  zIndex = 3650,
  fadeInMs = SAVED_TOAST_FADE_IN_MS,
  fadeOutMs = SAVED_TOAST_FADE_OUT_MS,
  wrapStyle,
  onHidden,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(visible ? 0 : 0)).current;
  const onHiddenRef = useRef(onHidden);
  onHiddenRef.current = onHidden;

  useEffect(() => {
    opacity.stopAnimation();
    if (visible) {
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: fadeInMs,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: fadeOutMs,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onHiddenRef.current?.();
      });
    }
  }, [visible, opacity, fadeInMs, fadeOutMs]);

  const v = VARIANT_STYLES[variant];

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
      <View style={[styles.inner, v.inner]}>
        <Text style={[styles.message, v.primary]} numberOfLines={3}>
          {message}
        </Text>
        {subtitle != null && subtitle !== "" ? (
          <Text style={[styles.subtitle, v.secondary]} numberOfLines={4}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  inner: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  message: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
  },
});
