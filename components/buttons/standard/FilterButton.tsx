import { Button } from "@/components/buttons/Button";
import { FILTER_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/ColorThemeContext";


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
  return (
    <Button
      onPress={onPress}
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
      iconScale={1.2}
      accessibilityLabel="Filter"
    />
  );
}
