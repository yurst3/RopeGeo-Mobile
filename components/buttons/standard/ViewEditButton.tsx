import { Button, STANDARD_BUTTON_SIZE } from "@/components/buttons/Button";
import { VIEW_EDIT_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";
import type { StyleProp, ViewStyle } from "react-native";

const EDIT_ICON = require("@/assets/images/icons/buttons/edit.png");
const VIEW_ICON = require("@/assets/images/icons/view.png");
const ICON_DESIGN_SCALE = 1.2;

/**
 * Toggles between editing and viewing. Shows the action it will take: the view icon while
 * editing, the edit icon while viewing.
 */
export function ViewEditButton({
  onPress,
  editing,
  style,
}: {
  onPress: () => void;
  editing: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[VIEW_EDIT_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.common.buttons.filter,
    STANDARD_BUTTON_SIZE,
    ICON_DESIGN_SCALE,
  );
  return (
    <Button
      onPress={onPress}
      size={size}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={editing ? VIEW_ICON : EDIT_ICON}
      iconColor={buttonColors.icon}
      iconScale={iconScale}
      style={style}
      accessibilityLabel={editing ? "View trip report" : "Edit trip report"}
    />
  );
}
