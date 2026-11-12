import {
  CUTOUT_TRIP_REPORT_MARKER_STYLES,
  PIN_SILHOUETTE_ICON,
  TRIP_REPORT_MARKER_ICONS,
} from "@/constants/tripReport/markerAppearance";
import {
  isLightLineSegmentColor,
  lineSegmentColorValue,
} from "@/constants/tripReport/lineSegmentAppearance";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { Image, StyleSheet, View } from "react-native";
import type { TripReportColor, TripReportMarkerStyle } from "ropegeo-common/models";

/** Directions the outline copies are shifted in, so they form an even ring around the icon. */
const OUTLINE_DIRECTIONS: readonly [number, number][] = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

export type TripReportMarkerIconProps = {
  markerStyle: TripReportMarkerStyle;
  color: TripReportColor;
  /** Width and height of the square the icon is fitted into, in points. */
  size: number;
  /** Outline width in points. */
  outlineWidth?: number;
};

/**
 * A trip report marker as it looks on the map: the style's marker image in the marker's color,
 * outlined like the map's markers (and line segments) so light colors stay visible. Except for
 * the cut-out styles, the symbol is filled with the outline color: the outline is drawn from the
 * solid pin, which then shows through the symbol.
 */
export function TripReportMarkerIcon({
  markerStyle,
  color,
  size,
  outlineWidth = 1,
}: TripReportMarkerIconProps) {
  const { lineCasing, lightLineOutline } = useColorTheme().map.minimap.recordedSegment;
  const outlineColor = isLightLineSegmentColor(color) ? lightLineOutline : lineCasing;
  const source = TRIP_REPORT_MARKER_ICONS[markerStyle];
  const outlineSource = CUTOUT_TRIP_REPORT_MARKER_STYLES.has(markerStyle)
    ? source
    : PIN_SILHOUETTE_ICON;
  return (
    <View style={{ width: size, height: size }} accessibilityIgnoresInvertColors>
      {OUTLINE_DIRECTIONS.map(([dx, dy]) => (
        <Image
          key={`${dx},${dy}`}
          source={outlineSource}
          resizeMode="contain"
          style={[
            styles.layer,
            {
              tintColor: outlineColor,
              transform: [{ translateX: dx * outlineWidth }, { translateY: dy * outlineWidth }],
            },
          ]}
        />
      ))}
      <Image
        source={source}
        resizeMode="contain"
        style={[styles.layer, { tintColor: lineSegmentColorValue(color) }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
});
