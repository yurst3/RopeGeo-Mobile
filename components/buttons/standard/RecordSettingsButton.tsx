import { Button } from "@/components/buttons/Button";
import { RECORD_SETTINGS_BUTTON_KEY } from "@/constants/buttons";
import { RECORDING_INDICATOR_COLOR } from "@/constants/tripReport/recording";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { MAP_BUTTON_SIZE } from "@/utils/minimap/fullScreenMapLayout";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

const SETTINGS_ICON = require("@/assets/images/icons/tabs/settings.png");
/** Gear size relative to the button, matching {@link SettingsButton}. */
const GEAR_SIZE_RATIO = 0.5 * 1.2;
/** Red dot over the gear's bottom-right corner, relative to the gear. */
const DOT_SIZE_RATIO = 0.45;
const DOT_OVERHANG_RATIO = 0.08;
/** Ring in the button's color that separates the dot from the gear under it. */
const DOT_RING_WIDTH = 1.5;

/**
 * Round button that opens the waypoint recording settings: the settings gear with a red recording
 * dot on its bottom-right corner. The gear follows the theme; the dot is always red.
 */
export function RecordSettingsButton({
  onPress,
  designSize = MAP_BUTTON_SIZE,
}: {
  onPress: () => void;
  /** Button diameter before UI scaling. */
  designSize?: number;
}) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[RECORD_SETTINGS_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.map.buttons.recordSettings,
    designSize,
  );
  const gearSize = Math.round(size * GEAR_SIZE_RATIO * iconScale);
  const dotSize = Math.round(gearSize * DOT_SIZE_RATIO);
  const dotOffset = -Math.round(gearSize * DOT_OVERHANG_RATIO);

  return (
    <Button
      onPress={onPress}
      size={size}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      accessibilityLabel="Recording settings"
    >
      <View style={{ width: gearSize, height: gearSize }}>
        <Image
          source={SETTINGS_ICON}
          style={{ width: gearSize, height: gearSize, tintColor: buttonColors.icon }}
          contentFit="contain"
        />
        <View
          style={[
            styles.dot,
            {
              right: dotOffset,
              bottom: dotOffset,
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              borderColor: buttonColors.background,
            },
          ]}
        />
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    borderWidth: DOT_RING_WIDTH,
    backgroundColor: RECORDING_INDICATOR_COLOR,
  },
});
