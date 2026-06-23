import { useEffect, useRef } from "react";
import { RESET_CAMERA_TO_BOUNDS_BUTTON_KEY } from "@/constants/buttons";
import { Animated, StyleSheet } from "react-native";

import { Button } from "@/components/buttons/Button";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import { MAP_BUTTON_SIZE } from "@/components/minimap/shared/fullScreenMapLayout";
import { useResolvedButtonDimensions } from "@/utils/resolvers";

const FADE_DURATION = 150;
const ICON_SIZE = 26;
const BOUNDS_ICON_DESIGN_SCALE = ICON_SIZE / (MAP_BUTTON_SIZE * 0.5);

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
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[RESET_CAMERA_TO_BOUNDS_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.map.buttons.resetCameraToBounds,
    MAP_BUTTON_SIZE,
    BOUNDS_ICON_DESIGN_SCALE,
  );
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (stacked) return;
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: FADE_DURATION,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity, stacked]);

  const control = (
    <Button
      onPress={onPress}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={require("@/assets/images/icons/buttons/fitBounds.png")}
      iconColor={buttonColors.icon}
      iconScale={iconScale}
      size={size}
      accessibilityLabel={accessibilityLabel}
    />
  );

  if (stacked) {
    return control;
  }

  return (
    <Animated.View
      style={[styles.wrapper, { top, opacity }]}
      pointerEvents={visible ? "auto" : "none"}
    >
      {control}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    right: 16,
  },
});
