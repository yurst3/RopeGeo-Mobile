import { FontAwesome } from "@expo/vector-icons";
import { RESET_CAMERA_TO_POSITION_BUTTON_KEY } from "@/constants/buttons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

import { Button } from "@/components/buttons/Button";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useText } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { MAP_BUTTON_SIZE } from "@/utils/minimap/fullScreenMapLayout";
import {
  useResolvedButtonBackgroundScale,
  useResolvedButtonIconScale,
} from "@/utils/theme/resolvers";

const BASE_ICON_SIZE = 22;


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
  const uiScale = useUiScale();
  const buttonSpec = uiScale.map.buttons.resetCameraToPosition;
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

  const control = (
    <Button
      onPress={onPress}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      size={buttonSize}
      accessibilityLabel={accessibilityLabel}
    >
      <FontAwesome name="location-arrow" size={iconSize} color={buttonColors.icon} />
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
