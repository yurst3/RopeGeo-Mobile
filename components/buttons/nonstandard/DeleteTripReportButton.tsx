import { ConstantText } from "@/components/text/ConstantText";
import { DELETE_TRIP_REPORT_BUTTON_KEY } from "@/constants/buttons";
import type { DeleteTripReportButtonColors } from "@/constants/colors/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import {
  useResolvedButtonBackgroundScale,
  useResolvedIconSizeScale,
} from "@/utils/theme/resolvers";
import { STANDARD_BUTTON_SHADOW } from "@/utils/theme/standardButtonShadow";
import { Image } from "expo-image";
import { Pressable, StyleSheet } from "react-native";

const REMOVE_ICON = require("@/assets/images/icons/buttons/remove.png");
const BASE_PADDING_VERTICAL = 8;
const BASE_PADDING_HORIZONTAL = 16;
const DESIGN_ICON_SIZE = 18;

/** Red pill that starts deleting the whole trip report. */
export function DeleteTripReportButton({ onPress }: { onPress: () => void }) {
  const colors = useColorTheme().button.nonstandard[
    DELETE_TRIP_REPORT_BUTTON_KEY
  ] as DeleteTripReportButtonColors;
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const backgroundScale = useResolvedButtonBackgroundScale(uiScale.filter.buttons.chip);
  const iconSize = Math.round(DESIGN_ICON_SIZE * useResolvedIconSizeScale());

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.background,
          shadowColor: colors.shadowColor,
          paddingVertical: BASE_PADDING_VERTICAL * backgroundScale,
          paddingHorizontal: BASE_PADDING_HORIZONTAL * backgroundScale,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Delete trip report"
    >
      <ConstantText
        size={uiScale.filter.buttons.chip.text!}
        typography={textStyle.filter.optionLabel}
        style={{ color: colors.text }}
      >
        Delete Trip Report
      </ConstantText>
      <Image
        source={REMOVE_ICON}
        style={{ width: iconSize, height: iconSize, tintColor: colors.icon }}
        contentFit="contain"
        accessibilityElementsHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    ...STANDARD_BUTTON_SHADOW,
  },
});
