import { Image } from "expo-image";
import { RESET_CAMERA_ORIENTATION_BUTTON_KEY } from "@/constants/buttons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { Button } from "@/components/buttons/Button";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import { MAP_BUTTON_SIZE } from "@/components/minimap/shared/fullScreenMapLayout";
import {
  useResolvedButtonBackgroundScale,
  useResolvedButtonIconScale,
} from "@/utils/resolvers";

const FADE_DURATION = 150;
const BASE_ICON_SIZE = Math.round(26 * 1.5);

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
  const uiScale = useUiScale();
  const buttonSpec = uiScale.map.buttons.resetCameraOrientation;
  const backgroundScale = useResolvedButtonBackgroundScale(buttonSpec);
  const profileIconScale = useResolvedButtonIconScale(buttonSpec);
  const buttonSize = Math.round(MAP_BUTTON_SIZE * backgroundScale);
  const iconSize = Math.round(BASE_ICON_SIZE * profileIconScale);
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
        style={{ width: iconSize, height: iconSize }}
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
      size={buttonSize}
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
    justifyContent: "center",
    alignItems: "center",
  },
});
