import { ConstantText } from "@/components/text/ConstantText";
import { LOGOUT_BUTTON_KEY } from "@/constants/buttons";
import type { LogoutButtonColors } from "@/constants/colors/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonBackgroundScale } from "@/utils/theme/resolvers";
import { STANDARD_BUTTON_SHADOW } from "@/utils/theme/standardButtonShadow";
import { Pressable, StyleSheet } from "react-native";

const BASE_PADDING_VERTICAL = 8;
const BASE_PADDING_HORIZONTAL = 14;

export type LogoutButtonProps = {
  onPress: () => void;
};

/** Rounded text pill for leaving the signed-in profile demo. */
export function LogoutButton({ onPress }: LogoutButtonProps) {
  const colors = useColorTheme().button.nonstandard[
    LOGOUT_BUTTON_KEY
  ] as LogoutButtonColors;
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const backgroundScale = useResolvedButtonBackgroundScale(
    uiScale.filter.buttons.chip,
  );

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
      accessibilityLabel="Log out"
    >
      <ConstantText
        size={uiScale.filter.buttons.chip.text!}
        typography={textStyle.filter.optionLabel}
        style={{ color: colors.text }}
      >
        Log out
      </ConstantText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    ...STANDARD_BUTTON_SHADOW,
  },
});
