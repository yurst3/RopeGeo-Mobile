import { Button } from "@/components/buttons/Button";
import { ADD_LINE_SEGMENT_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { MAP_BUTTON_SIZE } from "@/utils/minimap/fullScreenMapLayout";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";
import { View } from "react-native";

const ADD_LINE_SEGMENT_ICON = require("@/assets/images/icons/buttons/addLineSegment.png");
const ICON_SIZE = 26;
const ICON_DESIGN_SCALE = ICON_SIZE / (MAP_BUTTON_SIZE * 0.5);
const DISABLED_OPACITY = 0.45;

/** Diameter of {@link AddLineSegmentButton} for the current UI scale, for laying out around it. */
export function useAddLineSegmentButtonSize(): number {
  const uiScale = useUiScale();
  return useResolvedButtonDimensions(
    uiScale.map.buttons.addLineSegment,
    MAP_BUTTON_SIZE,
    ICON_DESIGN_SCALE,
  ).size;
}

/** Round map button that starts a new line segment at the user's position. */
export function AddLineSegmentButton({
  onPress,
  disabled = false,
  accessibilityLabel = "Add line segment",
}: {
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[ADD_LINE_SEGMENT_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.map.buttons.addLineSegment,
    MAP_BUTTON_SIZE,
    ICON_DESIGN_SCALE,
  );

  return (
    <View style={disabled ? { opacity: DISABLED_OPACITY } : null}>
      <Button
        onPress={onPress}
        disabled={disabled}
        backgroundColor={buttonColors.background}
        shadowColor={themeColors.button.shadowColor}
        icon={ADD_LINE_SEGMENT_ICON}
        iconColor={buttonColors.icon}
        iconScale={iconScale}
        size={size}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}
