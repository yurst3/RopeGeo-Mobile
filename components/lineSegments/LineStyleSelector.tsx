import { LineSegmentPreview } from "@/components/lineSegments/LineSegmentPreview";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { Pressable, StyleSheet, View } from "react-native";
import { TRIP_REPORT_LINE_STYLES, type TripReportLineStyle } from "ropegeo-common/models";

const DESIGN_OPTION_HEIGHT = 32;
const DESIGN_PREVIEW_WIDTH = 32;
const DASHED_PREVIEW_DASH_COUNT = 3;

const STYLE_LABELS: Record<TripReportLineStyle, string> = {
  solid: "Solid",
  dashed: "Dashed",
  dotted: "Dotted",
};

export type LineStyleSelectorProps = {
  value: TripReportLineStyle;
  onChange: (style: TripReportLineStyle) => void;
  /** Color the sample lines are drawn in (the segment's color). */
  previewColor: string;
  /** Thickness of the sample lines in points (the segment's thickness). */
  previewThickness: number;
};

/** Row of equal-width options showing a solid, dashed, and dotted sample line. */
export function LineStyleSelector({
  value,
  onChange,
  previewColor,
  previewThickness,
}: LineStyleSelectorProps) {
  const { text, separator, cardHighlight } = useColorTheme();
  const iconScale = useResolvedIconSizeScale();
  const height = Math.round(DESIGN_OPTION_HEIGHT * iconScale);
  const previewWidth = Math.round(DESIGN_PREVIEW_WIDTH * iconScale);

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {TRIP_REPORT_LINE_STYLES.map((lineStyle) => {
        const selected = lineStyle === value;
        return (
          <Pressable
            key={lineStyle}
            onPress={() => onChange(lineStyle)}
            style={({ pressed }) => [
              styles.option,
              {
                height,
                borderColor: selected ? text.primary : separator,
                backgroundColor: selected ? cardHighlight : undefined,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="radio"
            accessibilityLabel={STYLE_LABELS[lineStyle]}
            accessibilityState={{ selected }}
          >
            <LineSegmentPreview
              color={previewColor}
              lineStyle={lineStyle}
              thickness={previewThickness}
              width={previewWidth}
              pieceCount={DASHED_PREVIEW_DASH_COUNT}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 6,
  },
  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 8,
  },
});
