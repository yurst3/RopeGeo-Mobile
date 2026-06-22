import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { ScalingText } from "@/components/text/ScalingText";
import type { ToastStyle } from "@/constants/colors/types";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import {
  useResolvedButtonBackgroundScale,
  useResolvedButtonIconScale,
} from "@/utils/resolvers";
import {
  SAVED_TOAST_FADE_IN_MS,
  SAVED_TOAST_FADE_OUT_MS,
  TOAST_HORIZONTAL_INSET,
  TOAST_STACK_REPOSITION_MS,
} from "@/constants/toasts";

export type ActionToastProps = {
  style: ToastStyle;
  message: string;
  icon: ImageSourcePropType;
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
  style,
  message,
  icon,
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
  const { background, text, icon: iconColor } = useColorTheme().toast[style];
  const { uiScale, style: textStyle } = useText();
  const actionSpec = uiScale.toast.buttons.action;
  const backgroundScale = useResolvedButtonBackgroundScale(actionSpec);
  const profileIconScale = useResolvedButtonIconScale(actionSpec);
  const iconSize = Math.round(22 * profileIconScale);
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
            {
              backgroundColor: background,
              opacity: pressed ? 0.92 : 1,
              paddingVertical: 10 * backgroundScale,
              paddingHorizontal: 18 * backgroundScale,
              gap: 10 * backgroundScale,
            },
          ]}
        >
          <ScalingText
            size={uiScale.toast.text.message}
            typography={textStyle.toast.message}
            numberOfLines={2}
            ellipsizeMode="tail"
            measure={{ type: "lineCount", maxLinesAtMaxSize: 2 }}
            containerStyle={styles.messageWrap}
            style={[styles.message, { color: text }]}
          >
            {message}
          </ScalingText>
          <Image source={icon} style={[styles.icon, { width: iconSize, height: iconSize, tintColor: iconColor }]} />
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
    borderRadius: 999,
    maxWidth: "100%",
    alignSelf: "center",
  },
  icon: {
    flexShrink: 0,
    resizeMode: "contain",
  },
  messageWrap: {
    flexGrow: 0,
    flexShrink: 1,
  },
  message: {
    textAlign: "left",
  },
});
