import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

const SIZE = 48;
const FADE_DURATION = 150;
const ICON_SIZE = Math.round(26 * 1.5);

const COMPASS_ICON = require("@/assets/images/icons/buttons/compass.png");

type ResetCameraOrientationButtonProps = {
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
  /**
   * Clockwise rotation in degrees applied to the compass asset. To keep north aligned with the
   * map while the camera bears, pass the negative of the camera heading (e.g. `-heading` from
   * Mapbox `onCameraChanged`).
   */
  iconRotation?: number;
  accessibilityLabel?: string;
};

export function ResetCameraOrientationButton({
  onPress,
  visible = true,
  top = 16,
  stacked = false,
  iconRotation = 0,
  accessibilityLabel = "Reset camera orientation",
}: ResetCameraOrientationButtonProps) {
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (stacked) return;
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: FADE_DURATION,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity, stacked]);

  const icon = (
    <View
      style={[
        styles.iconRotate,
        { transform: [{ rotate: `${iconRotation}deg` }] },
      ]}
    >
      <Image
        source={COMPASS_ICON}
        style={styles.icon}
        contentFit="contain"
      />
    </View>
  );

  if (stacked) {
    return (
      <Pressable
        style={styles.button}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {icon}
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
        {icon}
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
  iconRotate: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
