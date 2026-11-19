import { Button } from "@/components/buttons/Button";
import { ADD_MARKER_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { MAP_BUTTON_SIZE } from "@/utils/minimap/fullScreenMapLayout";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";

const ADD_MARKER_BASE = require("@/assets/images/icons/buttons/layered/addMarker/base.png");
const ADD_MARKER_ACCENT = require("@/assets/images/icons/buttons/layered/addMarker/accent.png");
const ICON_SIZE = 26;
const ICON_DESIGN_SCALE = ICON_SIZE / (MAP_BUTTON_SIZE * 0.5);

/** Round map button that adds a new marker. */
export function AddMarkerButton({
  onPress,
  accessibilityLabel = "Add marker",
}: {
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[ADD_MARKER_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.map.buttons.addMarker,
    MAP_BUTTON_SIZE,
    ICON_DESIGN_SCALE,
  );

  return (
    <Button
      onPress={onPress}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={ADD_MARKER_BASE}
      iconColor={buttonColors.icon}
      iconAccent={ADD_MARKER_ACCENT}
      iconAccentColor={buttonColors.iconAccent}
      iconScale={iconScale}
      size={size}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
