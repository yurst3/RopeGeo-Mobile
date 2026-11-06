import { StyleSheet, View } from "react-native";
import type { TripReportLineStyle } from "ropegeo-common/models";

export type LineSegmentPreviewProps = {
  color: string;
  lineStyle: TripReportLineStyle;
  /** Line thickness in points. */
  thickness: number;
  /** Length of the sample line in points. */
  width: number;
  /**
   * For dashed lines, draws exactly this many dashes stretched to fill `width`. By default as many
   * map-proportioned dashes as fit are drawn.
   */
  pieceCount?: number;
};

/** Short horizontal sample of a line segment drawn solid, dashed, or dotted. */
export function LineSegmentPreview({
  color,
  lineStyle,
  thickness,
  width,
  pieceCount,
}: LineSegmentPreviewProps) {
  if (lineStyle === "solid") {
    return (
      <View style={{ width, height: thickness, borderRadius: 2, backgroundColor: color }} />
    );
  }
  const dotted = lineStyle === "dotted";
  const gap = dotted ? thickness : thickness * 1.5;
  const fixedCount = !dotted && pieceCount != null && pieceCount > 0 ? pieceCount : null;
  const pieceLength =
    fixedCount != null
      ? Math.max(1, (width - gap * (fixedCount - 1)) / fixedCount)
      : dotted
        ? thickness
        : thickness * 2;
  const count = fixedCount ?? Math.max(1, Math.floor((width + gap) / (pieceLength + gap)));
  return (
    <View style={[styles.pieces, { width, gap }]}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            width: pieceLength,
            height: thickness,
            borderRadius: dotted ? thickness / 2 : 1,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pieces: {
    flexDirection: "row",
    overflow: "hidden",
  },
});
