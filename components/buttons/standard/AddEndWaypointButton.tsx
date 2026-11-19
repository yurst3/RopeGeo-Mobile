import { Button } from "@/components/buttons/Button";
import { ADD_END_WAYPOINT_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { MAP_BUTTON_SIZE } from "@/utils/minimap/fullScreenMapLayout";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";

const BASE = require("@/assets/images/icons/buttons/layered/addEndWaypoint/base.png");
const ACCENT = require("@/assets/images/icons/buttons/layered/addEndWaypoint/accent.png");
const ICON_SIZE = 26;
const ICON_DESIGN_SCALE = ICON_SIZE / (MAP_BUTTON_SIZE * 0.5);

/** Appends a waypoint at the end of the selected segment (segment panel chrome). */
export function AddEndWaypointButton({
  onPress,
  disabled = false,
  accessibilityLabel = "Add end waypoint",
}: {
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[ADD_END_WAYPOINT_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.map.buttons.addMarker,
    MAP_BUTTON_SIZE,
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
      accessibilityLabel={accessibilityLabel}
    />
  );
}
