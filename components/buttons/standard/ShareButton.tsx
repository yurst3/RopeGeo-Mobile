import type { StyleProp, ViewStyle } from "react-native";
import { SHARE_BUTTON_KEY } from "@/constants/buttons";
import { StyleSheet } from "react-native";

import { Button } from "@/components/buttons/Button";
import { useColorTheme } from "@/context/ColorThemeContext";


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
  return (
    <Button
      onPress={onPress}
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
