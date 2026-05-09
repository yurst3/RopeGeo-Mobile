import { FontAwesome } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
} from "react-native";

const SIZE = 48;
const FADE_DURATION = 150;

type ResetCameraToPositionButtonProps = {
  onPress: () => void;
  /** When false, button is hidden and non-interactive. Default true. */
  visible?: boolean;
  /** Distance from top edge (e.g. safe area inset + 16). Default 16. Ignored when `stacked`. */
  top?: number;
  /**
   * When true, renders only the circular control (no absolute positioning or opacity animation).
   * Use inside {@link ButtonStack.Slot}; visibility fade is handled by the stack slot.
   */
  stacked?: boolean;
  accessibilityLabel?: string;
};

export function ResetCameraToPositionButton({
  onPress,
  visible = true,
  top = 16,
  stacked = false,
  accessibilityLabel = "Reset camera to position",
}: ResetCameraToPositionButtonProps) {
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
        <FontAwesome name="location-arrow" size={22} color="#333" />
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
        <FontAwesome name="location-arrow" size={22} color="#333" />
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
});
