import { ConstantText } from "@/components/text/ConstantText";
import { ADD_RELEVANT_PAGE_BUTTON_KEY } from "@/constants/buttons";
import type { AddRelevantPageButtonColors } from "@/constants/colors/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { FontAwesome5 } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

/** Matches the {@link PagePreview} card: 96px thumbnail plus 3px padding on each side. */
const PAGE_PREVIEW_HEIGHT = 96 + 3 * 2;
const PAGE_PREVIEW_BORDER_RADIUS = 12;
const DESIGN_ICON_SIZE = 18;

export type AddRelevantPageButtonProps = {
  onPress: () => void;
};

/** Dashed placeholder card, shaped like a page preview, for linking pages to a trip report. */
export function AddRelevantPageButton({ onPress }: AddRelevantPageButtonProps) {
  const colors = useColorTheme().button.nonstandard[
    ADD_RELEVANT_PAGE_BUTTON_KEY
  ] as AddRelevantPageButtonColors;
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const iconSizeScale = useResolvedIconSizeScale();
  const iconSize = Math.round(DESIGN_ICON_SIZE * iconSizeScale);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { borderColor: colors.outline, opacity: pressed ? 0.7 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Add pages that are relevant to this trip report"
    >
      <ConstantText
        size={uiScale.filter.text.sectionTitle}
        typography={textStyle.filter.optionLabel}
        style={[styles.label, { color: colors.text }]}
      >
        Add pages that are relevant to this trip report
      </ConstantText>
      <FontAwesome5 name="search" size={iconSize} color={colors.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "stretch",
    height: PAGE_PREVIEW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: PAGE_PREVIEW_BORDER_RADIUS,
    backgroundColor: "transparent",
  },
  label: {
    flexShrink: 1,
    textAlign: "center",
  },
});
