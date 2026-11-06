import { Button, STANDARD_BUTTON_SIZE } from "@/components/buttons/Button";
import { ADD_TRIP_REPORT_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";

const ADD_TRIP_REPORT_ICON = require("@/assets/images/icons/buttons/addTripReport.png");
const ADD_TRIP_REPORT_ICON_DESIGN_SCALE = 1.2;

export function AddTripReportButton({ onPress }: { onPress: () => void }) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[ADD_TRIP_REPORT_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.common.buttons.filter,
    STANDARD_BUTTON_SIZE,
    ADD_TRIP_REPORT_ICON_DESIGN_SCALE,
  );
  return (
    <Button
      onPress={onPress}
      size={size}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={ADD_TRIP_REPORT_ICON}
      iconColor={buttonColors.icon}
      iconScale={iconScale}
      accessibilityLabel="Add trip report"
    />
  );
}
