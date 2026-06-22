import type { StyleProp, ViewStyle } from "react-native";
import { SAVE_BUTTON_KEY } from "@/constants/buttons";
import { StyleSheet } from "react-native";

import { Button, STANDARD_BUTTON_SIZE } from "@/components/buttons/Button";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import { useResolvedButtonDimensions } from "@/utils/resolvers";


export type SaveButtonProps = {
  saved: boolean;
  onPress: () => void;
  /** Absolute top offset (e.g. `insets.top + 8`). */
  top: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Circular header control toggling saved state (saved.png / saved-solid.png + highlight tint when saved).
 */
export function SaveButton({ saved, onPress, top, style }: SaveButtonProps) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[SAVE_BUTTON_KEY];
  const { uiScale } = useText();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.common.buttons.save,
    STANDARD_BUTTON_SIZE,
  );
  return (
    <Button
      onPress={onPress}
      size={size}
      iconScale={iconScale}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={
        saved
          ? require("@/assets/images/icons/buttons/saved-solid.png")
          : require("@/assets/images/icons/buttons/saved.png")
      }
      iconColor={buttonColors.icon}
      iconColorHighlight={buttonColors.iconHighlight}
      highlighted={saved}
      style={[styles.button, { top }, style]}
      accessibilityLabel={saved ? "Remove from saved" : "Save page"}
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
