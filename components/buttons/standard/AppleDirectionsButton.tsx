import { Image } from "expo-image";

import { Button } from "@/components/buttons/Button";
import { EXPAND_BUTTON_SIZE } from "@/components/minimap/shared/miniMapOverlayLayout";
import { APPLE_DIRECTIONS_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/ColorThemeContext";

const APPLE_DIRECTIONS_ICON = require("@/assets/images/icons/buttons/apple-directions.png");

/** 30px icon inside the 40pt minimap overlay circle. */
const DIRECTIONS_ICON_SIZE = 30;

export type AppleDirectionsButtonProps = {
  onPress: () => void;
};

/** Opens Apple Maps at the given coordinates (colored icon, themed circle background). */
export function AppleDirectionsButton({ onPress }: AppleDirectionsButtonProps) {
  const themeColors = useColorTheme();
  const { background } = themeColors.button.standard[APPLE_DIRECTIONS_BUTTON_KEY];

  return (
    <Button
      onPress={onPress}
      backgroundColor={background}
      shadowColor={themeColors.button.shadowColor}
      size={EXPAND_BUTTON_SIZE}
      accessibilityLabel="Open Apple Maps"
    >
      <Image
        source={APPLE_DIRECTIONS_ICON}
        style={{ width: DIRECTIONS_ICON_SIZE, height: DIRECTIONS_ICON_SIZE }}
        contentFit="contain"
      />
    </Button>
  );
}
