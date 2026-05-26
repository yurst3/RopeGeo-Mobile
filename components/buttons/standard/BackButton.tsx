import { FontAwesome5 } from "@expo/vector-icons";
import { BACK_BUTTON_KEY } from "@/constants/buttons";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet } from "react-native";

import {
  Button,
  STANDARD_BUTTON_SIZE,
} from "@/components/buttons/Button";
import { useColorTheme } from "@/context/ColorThemeContext";


/**
 * When `top` is provided the button positions itself absolutely (screen-level usage).
 * Without `top` it renders inline (e.g. inside a header row).
 */
export function BackButton({
  onPress,
  top,
  size = STANDARD_BUTTON_SIZE,
  style,
}: {
  onPress: () => void;
  top?: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[BACK_BUTTON_KEY];
  return (
    <Button
      onPress={onPress}
      size={size}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      iconColor={buttonColors.icon}
      style={[
        top != null && styles.fixed,
        top != null && { top },
        style,
      ]}
      accessibilityLabel="Go back"
    >
      <FontAwesome5
        name="arrow-left"
        size={20}
        color={buttonColors.icon}
      />
    </Button>
  );
}

const styles = StyleSheet.create({
  fixed: {
    position: "absolute",
    left: 16,
    zIndex: 3600,
  },
});
