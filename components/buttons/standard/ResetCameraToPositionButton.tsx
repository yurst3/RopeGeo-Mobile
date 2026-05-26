import { FontAwesome } from "@expo/vector-icons";
import { RESET_CAMERA_TO_POSITION_BUTTON_KEY } from "@/constants/buttons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

import { Button } from "@/components/buttons/Button";
import { useColorTheme } from "@/context/ColorThemeContext";
import { MAP_BUTTON_SIZE } from "@/components/minimap/shared/fullScreenMapLayout";


const FADE_DURATION = 150;

type ResetCameraToPositionButtonProps = {
  onPress: () => void;
  visible?: boolean;
  top?: number;
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
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[RESET_CAMERA_TO_POSITION_BUTTON_KEY];
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
      size={MAP_BUTTON_SIZE}
      accessibilityLabel={accessibilityLabel}
    >
      <FontAwesome name="location-arrow" size={22} color={buttonColors.icon} />
    </Button>
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
