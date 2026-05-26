import { Image } from "expo-image";
import { RESET_CAMERA_ORIENTATION_BUTTON_KEY } from "@/constants/buttons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { Button } from "@/components/buttons/Button";
import { useColorTheme } from "@/context/ColorThemeContext";
import { MAP_BUTTON_SIZE } from "@/components/minimap/shared/fullScreenMapLayout";


const FADE_DURATION = 150;
const ICON_SIZE = Math.round(26 * 1.5);

const COMPASS_ICON = require("@/assets/images/icons/buttons/compass.png");

type ResetCameraOrientationButtonProps = {
  onPress: () => void;
  visible?: boolean;
  top?: number;
  stacked?: boolean;
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
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[RESET_CAMERA_ORIENTATION_BUTTON_KEY];
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
        style={{ width: ICON_SIZE, height: ICON_SIZE }}
        contentFit="contain"
        tintColor={buttonColors.icon}
      />
    </View>
  );

  const control = (
    <Button
      onPress={onPress}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      size={MAP_BUTTON_SIZE}
      accessibilityLabel={accessibilityLabel}
    >
      {icon}
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
  iconRotate: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
});
