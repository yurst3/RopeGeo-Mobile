import { Button } from "@/components/buttons/Button";
import { EXPAND_MINI_MAP_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/ColorThemeContext";
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
  return (
    <Button
      onPress={onPress ?? (() => {})}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={require("@/assets/images/icons/buttons/expand.png")}
      iconColor={buttonColors.icon}
      size={EXPAND_BUTTON_SIZE}
      style={[minimapStyles.expandButton]}
      accessibilityLabel="Expand map"
    />
  );
}
