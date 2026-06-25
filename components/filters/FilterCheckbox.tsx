import { useText } from "@/context/typography/TextContext";
import { useResolvedTypography } from "@/utils/theme/resolvers";
import { StyleSheet, Text, View } from "react-native";
import { useFilterCheckboxMetrics } from "@/utils/filters/useFilterCheckboxMetrics";
import { useFilterTheme } from "@/utils/filters/useFilterTheme";

export type FilterCheckboxProps = {
  checked: boolean;
};

export function FilterCheckbox({ checked }: FilterCheckboxProps) {
  const { filter, text } = useFilterTheme();
  const { style: textStyle } = useText();
  const { checkbox } = filter;
  const metrics = useFilterCheckboxMetrics();
  const markTypography = useResolvedTypography(textStyle.filter.sectionTitle);

  return (
    <View
      style={[
        styles.box,
        {
          width: metrics.boxSize,
          height: metrics.boxSize,
          borderRadius: metrics.borderRadius,
          borderWidth: metrics.borderWidth,
          marginRight: metrics.marginRight,
          borderColor: checkbox.uncheckedOutline,
        },
        checked && {
          borderColor: checkbox.checkedOutline,
          backgroundColor: checkbox.checkedFill,
        },
      ]}
    >
      {checked ? (
        <Text
          allowFontScaling={false}
          style={[
            markTypography,
            styles.mark,
            {
              fontSize: metrics.markFontSize,
              lineHeight: metrics.markFontSize,
              color: text.link,
            },
          ]}
        >
          ✓
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    justifyContent: "center",
    alignItems: "center",
  },
  mark: {
    includeFontPadding: false,
    textAlign: "center",
    textAlignVertical: "center",
  },
});
