import { Button, STANDARD_BUTTON_SIZE } from "@/components/buttons/Button";
import { UNDO_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";

const UNDO_ICON = require("@/assets/images/icons/buttons/undo.png");
const UNDO_ICON_DESIGN_SCALE = 1.2;

export function UndoButton({
  onPress,
  disabled = false,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[UNDO_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.common.buttons.back,
    STANDARD_BUTTON_SIZE,
    UNDO_ICON_DESIGN_SCALE,
  );
  return (
    <Button
      onPress={onPress}
      size={size}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={UNDO_ICON}
      iconColor={buttonColors.icon}
      iconScale={iconScale}
      disabled={disabled}
      accessibilityLabel="Undo"
    />
  );
}
