import { TripReportMarkerIcon } from "@/components/markers/TripReportMarkerIcon";
import { TRIP_REPORT_MARKER_STYLE_LABELS } from "@/constants/tripReport/markerAppearance";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  TRIP_REPORT_MARKER_STYLES,
  type TripReportColor,
  type TripReportMarkerStyle,
} from "ropegeo-common/models";

const COLUMNS = 3;
const GAP = 6;
/** Share of an option's width the marker icon's square fills (the pin has margins inside it). */
const ICON_FRACTION = 0.9;

function MarkerStyleOption({
  markerStyle,
  selected,
  size,
  previewColor,
  onPress,
}: {
  markerStyle: TripReportMarkerStyle;
  selected: boolean;
  size: number;
  previewColor: TripReportColor;
  onPress: () => void;
}) {
  const { text, separator, cardHighlight } = useColorTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          width: size,
          height: size,
          borderColor: selected ? text.primary : separator,
          backgroundColor: selected ? cardHighlight : undefined,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="radio"
      accessibilityLabel={TRIP_REPORT_MARKER_STYLE_LABELS[markerStyle]}
      accessibilityState={{ selected }}
    >
      <TripReportMarkerIcon
        markerStyle={markerStyle}
        color={previewColor}
        size={Math.round(size * ICON_FRACTION)}
      />
    </Pressable>
  );
}

export type MarkerStyleSelectorProps = {
  value: TripReportMarkerStyle;
  onChange: (style: TripReportMarkerStyle) => void;
  /** Color the marker icons are drawn in (the marker's color). */
  previewColor: TripReportColor;
};

/** Grid of square options, one per marker style, each showing its marker icon. */
export function MarkerStyleSelector({ value, onChange, previewColor }: MarkerStyleSelectorProps) {
  const [width, setWidth] = useState(0);
  const optionSize = width > 0 ? Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS) : 0;
  return (
    <View
      style={styles.grid}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="radiogroup"
    >
      {optionSize > 0
        ? TRIP_REPORT_MARKER_STYLES.map((markerStyle) => (
            <MarkerStyleOption
              key={markerStyle}
              markerStyle={markerStyle}
              selected={markerStyle === value}
              size={optionSize}
              previewColor={previewColor}
              onPress={() => onChange(markerStyle)}
            />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  option: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 8,
  },
});
