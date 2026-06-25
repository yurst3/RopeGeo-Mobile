import type { ImageSourcePropType } from "react-native";
import { EXTERNAL_LINK_BUTTON_KEY } from "@/constants/buttons";
import * as WebBrowser from "expo-web-browser";

import { MAP_BUTTON_SIZE } from "@/utils/minimap/fullScreenMapLayout";
import { Button } from "@/components/buttons/Button";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useText } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";

const EXTERNAL_LINK_ICON_DESIGN_SCALE = 28 / (MAP_BUTTON_SIZE * 0.5);


export type ExternalLinkButtonProps = {
  icon: ImageSourcePropType;
  link: string;
  accessibilityLabel?: string;
  /** When true, the control is visible but does not open the browser. */
  disabled?: boolean;
};

export function ExternalLinkButton({
  icon,
  link,
  accessibilityLabel = "Open in browser",
  disabled = false,
}: ExternalLinkButtonProps) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[EXTERNAL_LINK_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.common.buttons.externalLink,
    MAP_BUTTON_SIZE,
    EXTERNAL_LINK_ICON_DESIGN_SCALE,
  );
  const handlePress = async () => {
    if (disabled) return;
    try {
      await WebBrowser.openBrowserAsync(link);
    } catch {
      // Ignore if user cancels or link fails
    }
  };

  return (
    <Button
      onPress={handlePress}
      disabled={disabled}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      borderColor={buttonColors.border}
      icon={icon}
      iconScale={iconScale}
      size={size}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
