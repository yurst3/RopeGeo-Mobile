import { Button, STANDARD_BUTTON_SIZE } from "@/components/buttons/Button";
import { EDIT_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";

const EDIT_ICON = require("@/assets/images/icons/buttons/edit.png");
const EDIT_ICON_SOLID = require("@/assets/images/icons/buttons/edit-solid.png");
const EDIT_ICON_DESIGN_SCALE = 1.2;

export function EditButton({
  onPress,
  editing = false,
}: {
  onPress: () => void;
  /** Solid asset + highlight tint while the parent is in an editing state. */
  editing?: boolean;
}) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[EDIT_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.common.buttons.filter,
    STANDARD_BUTTON_SIZE,
    EDIT_ICON_DESIGN_SCALE,
  );
  return (
    <Button
      onPress={onPress}
      size={size}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={editing ? EDIT_ICON_SOLID : EDIT_ICON}
      iconColor={buttonColors.icon}
      iconColorHighlight={buttonColors.iconHighlight}
      highlighted={editing}
      iconScale={iconScale}
      accessibilityLabel={editing ? "Done editing" : "Edit"}
    />
  );
}
