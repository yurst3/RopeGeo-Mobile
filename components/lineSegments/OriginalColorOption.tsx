import { ColorSwatch } from "@/components/settings/ColorSwatch";
import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { Pressable, StyleSheet } from "react-native";
import type { TripReportHexColor } from "ropegeo-common/models";

/** Matches the ring around the selected palette swatch. */
const OUTLINE_WIDTH = 2;
const OUTLINE_PADDING_VERTICAL = 2;
/** Space between the outline and both the label and the swatch. */
const OUTLINE_PADDING_HORIZONTAL = 6;

export type OriginalColorOptionProps = {
  /** The color from the imported map file. */
  color: TripReportHexColor;
  selected: boolean;
  onPress: () => void;
};

/**
 * "Original Color" label with a swatch of the imported color to its right. When selected, a
 * rounded rectangle outlines both.
 */
export function OriginalColorOption({ color, selected, onPress }: OriginalColorOptionProps) {
  const { text, map } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.option,
        {
          borderColor: selected ? text.primary : map.minimap.legend.bodyBackground,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="radio"
      accessibilityLabel="Original Color"
      accessibilityState={{ selected }}
    >
      <ConstantText
        size={uiScale.filter.buttons.chip.text!}
        typography={textStyle.filter.optionLabel}
        style={{ color: text.primary }}
      >
        Original Color:
      </ConstantText>
      <ColorSwatch primaryColor={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    borderWidth: OUTLINE_WIDTH,
    borderRadius: 8,
    paddingVertical: OUTLINE_PADDING_VERTICAL,
    paddingHorizontal: OUTLINE_PADDING_HORIZONTAL,
  },
});
