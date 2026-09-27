import { Button, STANDARD_BUTTON_SIZE } from "@/components/buttons/Button";
import { SETTINGS_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";

const SETTINGS_ICON = require("@/assets/images/icons/tabs/settings.png");
const SETTINGS_ICON_DESIGN_SCALE = 1.2;

export function SettingsButton({ onPress }: { onPress: () => void }) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[SETTINGS_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.common.buttons.filter,
    STANDARD_BUTTON_SIZE,
    SETTINGS_ICON_DESIGN_SCALE,
  );
  return (
    <Button
      onPress={onPress}
      size={size}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={SETTINGS_ICON}
      iconColor={buttonColors.icon}
      iconScale={iconScale}
      accessibilityLabel="Settings"
    />
  );
}
