import type { StyleProp, ViewStyle } from "react-native";
import { SHARE_BUTTON_KEY } from "@/constants/buttons";
import { StyleSheet } from "react-native";

import { Button, STANDARD_BUTTON_SIZE } from "@/components/buttons/Button";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import { useResolvedButtonDimensions } from "@/utils/resolvers";


export type ShareButtonProps = {
  onPress: () => void;
  /** Absolute top offset (stacked below the save button). */
  top: number;
  style?: StyleProp<ViewStyle>;
};

/** Circular header control for sharing the page (share.png). */
export function ShareButton({ onPress, top, style }: ShareButtonProps) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[SHARE_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.common.buttons.share,
    STANDARD_BUTTON_SIZE,
  );
  return (
    <Button
      onPress={onPress}
      size={size}
      iconScale={iconScale}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={require("@/assets/images/icons/buttons/share.png")}
      iconColor={buttonColors.icon}
      style={[styles.button, { top }, style]}
      accessibilityLabel="Share page"
    />
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 16,
    zIndex: 3600,
  },
});
