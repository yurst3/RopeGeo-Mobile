import { Button, STANDARD_BUTTON_SIZE } from "@/components/buttons/Button";
import { ADD_MID_WAYPOINT_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";

const BASE = require("@/assets/images/icons/buttons/layered/addMidWaypoint/base.png");
const ACCENT = require("@/assets/images/icons/buttons/layered/addMidWaypoint/accent.png");
const ICON_DESIGN_SCALE = 1.2;

/** Inserts a waypoint between existing points on the selected segment. */
export function AddMidWaypointButton({
  onPress,
  disabled = false,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[ADD_MID_WAYPOINT_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.common.buttons.back,
    STANDARD_BUTTON_SIZE,
    ICON_DESIGN_SCALE,
  );
  return (
    <Button
      onPress={onPress}
      size={size}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={BASE}
      iconColor={buttonColors.icon}
      iconAccent={ACCENT}
      iconAccentColor={buttonColors.iconAccent}
      iconScale={iconScale}
      disabled={disabled}
      accessibilityLabel="Add waypoint"
    />
  );
}
