import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
} from "react-native";

const SIZE = 48;
const FADE_DURATION = 150;
const ICON_SIZE = 26;

type ResetCameraToBoundsButtonProps = {
  onPress: () => void;
  /** When false, button is hidden and non-interactive. Default true. */
  visible?: boolean;
  /** Distance from top edge (e.g. safe area inset + 16). Default 16. Ignored when `stacked`. */
  top?: number;
  /** When true, no absolute layout or opacity animation — for use inside {@link ButtonStack.Slot}. */
  stacked?: boolean;
  accessibilityLabel?: string;
};

export function ResetCameraToBoundsButton({
  onPress,
  visible = true,
  top = 16,
  stacked = false,
  accessibilityLabel = "Reset camera to bounds",
}: ResetCameraToBoundsButtonProps) {
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (stacked) return;
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: FADE_DURATION,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity, stacked]);

  if (stacked) {
    return (
      <Pressable
        style={styles.button}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <Image
          source={require("@/assets/images/icons/buttons/fitBounds.png")}
          style={styles.icon}
          contentFit="contain"
        />
      </Pressable>
    );
  }

  return (
    <Animated.View
      style={[styles.wrapper, { top, opacity }]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <Pressable
        style={styles.button}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <Image
          source={require("@/assets/images/icons/buttons/fitBounds.png")}
          style={styles.icon}
          contentFit="contain"
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    right: 16,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
