import { Button } from "@/components/buttons/Button";
import { EXPAND_MINI_MAP_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import { useResolvedButtonDimensions } from "@/utils/resolvers";
import {
  EXPAND_BUTTON_SIZE,
  minimapStyles,
} from "@/components/minimap/shared/minimapShared";


type ExpandMiniMapButtonProps = {
  onPress?: () => void;
};

/** Collapsed minimap control: expands the card to full-screen map. */
export function ExpandMiniMapButton({ onPress }: ExpandMiniMapButtonProps) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[EXPAND_MINI_MAP_BUTTON_KEY];
  const { uiScale } = useText();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.map.buttons.expandMiniMap,
    EXPAND_BUTTON_SIZE,
  );
  return (
    <Button
      onPress={onPress ?? (() => {})}
      size={size}
      iconScale={iconScale}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={require("@/assets/images/icons/buttons/expand.png")}
      iconColor={buttonColors.icon}
      style={[minimapStyles.expandButton]}
      accessibilityLabel="Expand map"
    />
  );
}
