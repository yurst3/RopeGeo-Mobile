import { FontAwesome5 } from "@expo/vector-icons";
import { BACK_BUTTON_KEY } from "@/constants/buttons";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet } from "react-native";

import {
  Button,
  STANDARD_BUTTON_SIZE,
} from "@/components/buttons/Button";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import {
  useResolvedButtonBackgroundScale,
  useResolvedButtonIconScale,
} from "@/utils/resolvers";

const BASE_ICON_SIZE = 20;


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
  const { uiScale } = useText();
  const buttonSpec = uiScale.common.buttons.back;
  const backgroundScale = useResolvedButtonBackgroundScale(buttonSpec);
  const profileIconScale = useResolvedButtonIconScale(buttonSpec);
  const buttonSize = Math.round(size * backgroundScale);
  const iconSize = Math.round(BASE_ICON_SIZE * profileIconScale);
  return (
    <Button
      onPress={onPress}
      size={buttonSize}
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
        size={iconSize}
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
