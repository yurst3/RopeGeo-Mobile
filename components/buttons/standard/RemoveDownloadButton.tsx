import type { StyleProp, ViewStyle } from "react-native";
import { REMOVE_DOWNLOAD_BUTTON_KEY } from "@/constants/buttons";

import { Button } from "@/components/buttons/Button";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useText } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";

const REMOVE_BUTTON_SIZE = 40;
const REMOVE_ICON_SIZE = 20;

/** Icon scale so remove.png renders at {@link REMOVE_ICON_SIZE}px inside the 40px circle. */
const REMOVE_ICON_SCALE = REMOVE_ICON_SIZE / (REMOVE_BUTTON_SIZE * 0.5);

const REMOVE_ICON = require("@/assets/images/icons/buttons/remove.png");

export type RemoveDownloadButtonProps = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Circular control to remove an offline download (shown beside {@link DownloadButton}). */
export function RemoveDownloadButton({ onPress, style }: RemoveDownloadButtonProps) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[REMOVE_DOWNLOAD_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.pageScreen.buttons.removeDownload,
    REMOVE_BUTTON_SIZE,
    REMOVE_ICON_SCALE,
  );

  return (
    <Button
      onPress={onPress}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={REMOVE_ICON}
      iconColor={buttonColors.icon}
      size={size}
      iconScale={iconScale}
      style={style}
      accessibilityLabel="Remove offline download"
    />
  );
}
