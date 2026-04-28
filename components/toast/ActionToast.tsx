import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  DOWNLOAD_TOAST_BG,
  SAVED_TOAST_FADE_IN_MS,
  SAVED_TOAST_FADE_OUT_MS,
  TOAST_HORIZONTAL_INSET,
  TOAST_STACK_REPOSITION_MS,
} from "@/constants/toast";

export type ActionToastProps = {
  message: string;
  icon: ImageSourcePropType;
  /** Text and icon tint. */
  color: string;
  /** Panel background; defaults to warning-style yellow panel. */
  backgroundColor?: string;
  top: number;
  horizontalInset?: number;
  zIndex?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
  exiting?: boolean;
  onExitComplete?: () => void;
  onPress: () => void;
  wrapStyle?: StyleProp<ViewStyle>;
};

/**
 * Pressable pill toast (fade in/out matches {@link Toast}).
 */
export function ActionToast({
  message,
  icon,
  color,
  backgroundColor = DOWNLOAD_TOAST_BG,
  top,
  horizontalInset = TOAST_HORIZONTAL_INSET,
  zIndex = 3650,
  fadeInMs = SAVED_TOAST_FADE_IN_MS,
  fadeOutMs = SAVED_TOAST_FADE_OUT_MS,
  exiting = false,
  onExitComplete,
  onPress,
  wrapStyle,
}: ActionToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const topAnim = useRef(new Animated.Value(top)).current;
  const prevTopRef = useRef<number | null>(null);
  const onExitCompleteRef = useRef(onExitComplete);
  onExitCompleteRef.current = onExitComplete;
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

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

  return (
    <Animated.View
      pointerEvents="box-none"
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
        <Pressable
          accessibilityRole="button"
          onPress={() => onPressRef.current()}
          style={({ pressed }) => [
            styles.inner,
            { backgroundColor, opacity: pressed ? 0.92 : 1 },
          ]}
        >
          <Text style={[styles.message, { color }]} numberOfLines={2}>
            {message}
          </Text>
          <Image source={icon} style={[styles.icon, { tintColor: color }]} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44,
  },
  opacityShell: {
    maxWidth: "100%",
    alignItems: "center",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    maxWidth: "100%",
    alignSelf: "center",
  },
  icon: {
    width: 22,
    height: 22,
    flexShrink: 0,
    resizeMode: "contain",
  },
  message: {
    flexGrow: 0,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "left",
  },
});
