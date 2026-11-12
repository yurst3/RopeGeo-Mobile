import { OriginalColorOption } from "@/components/lineSegments/OriginalColorOption";
import { ColorSwatch } from "@/components/settings/ColorSwatch";
import { lineSegmentColorValue } from "@/constants/tripReport/lineSegmentAppearance";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { Pressable, StyleSheet, View } from "react-native";
import {
  TRIP_REPORT_LINE_COLORS,
  type TripReportColor,
  type TripReportHexColor,
  type TripReportLineColor,
} from "ropegeo-common/models";

/** Ring drawn around the selected color swatch. */
const SWATCH_RING_WIDTH = 2;
const SWATCH_RING_PADDING = 2;

const COLOR_LABELS: Record<TripReportLineColor, string> = {
  black: "Black",
  white: "White",
  red: "Red",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  cyan: "Cyan",
  blue: "Blue",
  violet: "Violet",
  pink: "Pink",
};

export type TripReportColorSelectorProps = {
  value: TripReportColor;
  onChange: (color: TripReportColor) => void;
  /** Color from the imported map file, offered below the palette when present. */
  originalColor: TripReportHexColor | null;
};

/**
 * Swatches for the line segment and marker palette, with the original color below them (labeled)
 * when there is one.
 */
export function TripReportColorSelector({
  value,
  onChange,
  originalColor,
}: TripReportColorSelectorProps) {
  const { text, map } = useColorTheme();
  const ringBackground = map.minimap.legend.bodyBackground;

  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      <View style={styles.grid}>
        {TRIP_REPORT_LINE_COLORS.map((color) => (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            hitSlop={4}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            accessibilityRole="radio"
            accessibilityLabel={COLOR_LABELS[color]}
            accessibilityState={{ selected: color === value }}
          >
            <View
              style={[
                styles.swatchRing,
                { borderColor: color === value ? text.primary : ringBackground },
              ]}
            >
              <ColorSwatch primaryColor={lineSegmentColorValue(color)} />
            </View>
          </Pressable>
        ))}
      </View>
      {originalColor != null ? (
        <OriginalColorOption
          color={originalColor}
          selected={originalColor === value}
          onPress={() => onChange(originalColor)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  swatchRing: {
    borderWidth: SWATCH_RING_WIDTH,
    borderRadius: 999,
    padding: SWATCH_RING_PADDING,
  },
});
