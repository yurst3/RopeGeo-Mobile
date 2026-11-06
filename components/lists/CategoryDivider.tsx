import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

export type CategoryDividerProps = {
  title: string;
  /** Shown as `Title (count)` when provided. */
  count?: number;
  style?: StyleProp<ViewStyle>;
};

/** Section label followed by a hairline that fills the remaining row width. */
export function CategoryDivider({ title, count, style }: CategoryDividerProps) {
  const { text, separator } = useColorTheme();
  const textStyle = useTextStyle();
  const uiScale = useUiScale();

  return (
    <View style={[styles.row, style]}>
      <ConstantText
        size={uiScale.filter.text.sectionTitle}
        typography={textStyle.filter.sectionTitle}
        style={{ color: text.secondary }}
      >
        {count == null ? title : `${title} (${count})`}
      </ConstantText>
      <View style={[styles.line, { backgroundColor: separator }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  line: {
    flex: 1,
    height: 1,
  },
});
