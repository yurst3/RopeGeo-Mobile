import { Button, STANDARD_BUTTON_SIZE } from "@/components/buttons/Button";
import { SPLIT_SEGMENT_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";

const BASE = require("@/assets/images/icons/buttons/layered/splitSegment/base.png");
const ACCENT = require("@/assets/images/icons/buttons/layered/splitSegment/accent.png");
const ICON_DESIGN_SCALE = 1.2;

/** Splits the selected segment at the selected waypoint. */
export function SplitSegmentButton({
  onPress,
  disabled = false,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[SPLIT_SEGMENT_BUTTON_KEY];
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
      accessibilityLabel="Split segment"
    />
  );
}
