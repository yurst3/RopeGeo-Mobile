import { LineSegmentPreview } from "@/components/lineSegments/LineSegmentPreview";
import { LINE_SEGMENT_WIDTHS } from "@/constants/tripReport/lineSegmentAppearance";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { Pressable, StyleSheet, View } from "react-native";
import {
  TRIP_REPORT_LINE_THICKNESSES,
  type TripReportLineStyle,
  type TripReportLineThickness,
} from "ropegeo-common/models";

const DESIGN_OPTION_HEIGHT = 32;
const DESIGN_PREVIEW_WIDTH = 32;
const DASHED_PREVIEW_DASH_COUNT = 3;

const THICKNESS_LABELS: Record<TripReportLineThickness, string> = {
  thin: "Thin",
  medium: "Medium",
  thick: "Thick",
};

export type LineThicknessSelectorProps = {
  value: TripReportLineThickness;
  onChange: (thickness: TripReportLineThickness) => void;
  /** Color the sample lines are drawn in (the segment's color). */
  previewColor: string;
  /** Style the sample lines are drawn in (the segment's style). */
  previewStyle: TripReportLineStyle;
};

/** Row of equal-width options showing a thin, medium, and thick sample line. */
export function LineThicknessSelector({
  value,
  onChange,
  previewColor,
  previewStyle,
}: LineThicknessSelectorProps) {
  const { text, separator, cardHighlight } = useColorTheme();
  const iconScale = useResolvedIconSizeScale();
  const height = Math.round(DESIGN_OPTION_HEIGHT * iconScale);
  const previewWidth = Math.round(DESIGN_PREVIEW_WIDTH * iconScale);

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {TRIP_REPORT_LINE_THICKNESSES.map((thickness) => {
        const selected = thickness === value;
        return (
          <Pressable
            key={thickness}
            onPress={() => onChange(thickness)}
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
            accessibilityLabel={THICKNESS_LABELS[thickness]}
            accessibilityState={{ selected }}
          >
            <LineSegmentPreview
              color={previewColor}
              lineStyle={previewStyle}
              thickness={LINE_SEGMENT_WIDTHS[thickness]}
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
