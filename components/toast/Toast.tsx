import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { ScalingText } from "@/components/text/ScalingText";
import type { ThemeColors, ToastStyle } from "@/constants/colors/types";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import {
  SAVED_TOAST_FADE_IN_MS,
  SAVED_TOAST_FADE_OUT_MS,
  TOAST_HORIZONTAL_INSET,
  TOAST_STACK_REPOSITION_MS,
} from "@/constants/toasts";

function paletteForStyle(
  style: ToastStyle,
  toast: ThemeColors["toast"],
) {
  const colors = toast[style];
  return {
    inner: { backgroundColor: colors.background } as ViewStyle,
    primary: { color: colors.text } as TextStyle,
    secondary: { color: colors.text } as TextStyle,
  };
}

export type ToastProps = {
  style: ToastStyle;
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
  /** When true, fades out then calls `onExitComplete`. */
  exiting?: boolean;
  /** Invoked once after exit fade finishes (unless the exit animation is cancelled). */
  onExitComplete?: () => void;
  wrapStyle?: StyleProp<ViewStyle>;
};

/**
 * Pill toast with RN Animated fade-in; fade-out while `exiting` before parent removes the row.
 */
export function Toast({
  style,
  message,
  subtitle,
  top,
  horizontalInset = TOAST_HORIZONTAL_INSET,
  zIndex = 3650,
  fadeInMs = SAVED_TOAST_FADE_IN_MS,
  fadeOutMs = SAVED_TOAST_FADE_OUT_MS,
  exiting = false,
  onExitComplete,
  wrapStyle,
}: ToastProps) {
  const { toast } = useColorTheme();
  const { uiScale, style: textStyle } = useText();
  const opacity = useRef(new Animated.Value(0)).current;
  const topAnim = useRef(new Animated.Value(top)).current;
  const prevTopRef = useRef<number | null>(null);
  const onExitCompleteRef = useRef(onExitComplete);
  onExitCompleteRef.current = onExitComplete;

  useEffect(() => {
    if (exiting) {
      return;
    }
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: fadeInMs,
      useNativeDriver: true,
    }).start();
    return () => {
      opacity.stopAnimation();
    };
  }, [exiting, fadeInMs, opacity]);

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

  const palette = paletteForStyle(style, toast);

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
        <View style={[styles.inner, palette.inner]}>
          <ScalingText
            size={uiScale.toast.text.message}
            typography={textStyle.toast.message}
            numberOfLines={3}
            ellipsizeMode="tail"
            measure={{ type: "lineCount", maxLinesAtMaxSize: 3 }}
            style={[styles.message, palette.primary]}
          >
            {message}
          </ScalingText>
          {subtitle != null && subtitle !== "" ? (
            <ScalingText
              size={uiScale.toast.text.subtitle}
              typography={textStyle.toast.subtitle}
              numberOfLines={4}
              ellipsizeMode="tail"
              measure={{ type: "lineCount", maxLinesAtMaxSize: 4 }}
              style={[styles.subtitle, palette.secondary]}
            >
              {subtitle}
            </ScalingText>
          ) : null}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    justifyContent: "center",
    minHeight: 44,
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
  message: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 4,
  },
});
