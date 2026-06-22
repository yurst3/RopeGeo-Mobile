import { Button, STANDARD_BUTTON_SIZE } from "@/components/buttons/Button";
import { FILTER_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import { useResolvedButtonDimensions } from "@/utils/resolvers";

const FILTER_ICON_DESIGN_SCALE = 1.2;


export function FilterButton({
  onPress,
  persisted = false,
}: {
  onPress: () => void;
  /** Solid asset + highlight tint when this filter slot is saved to storage. */
  persisted?: boolean;
}) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[FILTER_BUTTON_KEY];
  const { uiScale } = useText();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.common.buttons.filter,
    STANDARD_BUTTON_SIZE,
    FILTER_ICON_DESIGN_SCALE,
  );
  return (
    <Button
      onPress={onPress}
      size={size}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={
        persisted
          ? require("@/assets/images/icons/buttons/filter-solid.png")
          : require("@/assets/images/icons/buttons/filter.png")
      }
      iconColor={buttonColors.icon}
      iconColorHighlight={buttonColors.iconHighlight}
      highlighted={persisted}
      iconScale={iconScale}
      accessibilityLabel="Filter"
    />
  );
}
