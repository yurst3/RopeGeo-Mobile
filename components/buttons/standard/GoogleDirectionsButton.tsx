import { Image } from "expo-image";

import { Button } from "@/components/buttons/Button";
import { EXPAND_BUTTON_SIZE } from "@/components/minimap/shared/miniMapOverlayLayout";
import { GOOGLE_DIRECTIONS_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import {
  useResolvedButtonBackgroundScale,
  useResolvedButtonIconScale,
} from "@/utils/resolvers";

const GOOGLE_DIRECTIONS_ICON = require("@/assets/images/icons/buttons/google-directions.png");

/** 30px icon inside the 40pt minimap overlay circle. */
const DIRECTIONS_ICON_SIZE = 30;

export type GoogleDirectionsButtonProps = {
  onPress: () => void;
};

/** Opens Google Maps at the given coordinates (colored icon, themed circle background). */
export function GoogleDirectionsButton({ onPress }: GoogleDirectionsButtonProps) {
  const themeColors = useColorTheme();
  const { background } = themeColors.button.standard[GOOGLE_DIRECTIONS_BUTTON_KEY];
  const { uiScale } = useText();
  const buttonSpec = uiScale.map.buttons.googleDirections;
  const backgroundScale = useResolvedButtonBackgroundScale(buttonSpec);
  const profileIconScale = useResolvedButtonIconScale(buttonSpec);
  const buttonSize = Math.round(EXPAND_BUTTON_SIZE * backgroundScale);
  const iconSize = Math.round(DIRECTIONS_ICON_SIZE * profileIconScale);

  return (
    <Button
      onPress={onPress}
      backgroundColor={background}
      shadowColor={themeColors.button.shadowColor}
      size={buttonSize}
      accessibilityLabel="Open Google Maps"
    >
      <Image
        source={GOOGLE_DIRECTIONS_ICON}
        style={{ width: iconSize, height: iconSize }}
        contentFit="contain"
      />
    </Button>
  );
}
