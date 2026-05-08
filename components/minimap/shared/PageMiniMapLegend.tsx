import { parseStrokeColor, parseStrokeWidth } from "@/components/minimap/shared/pageMiniMapSegments";
import { FontAwesome5 } from "@expo/vector-icons";
import type { LegendItem } from "ropegeo-common/models";
import { LegendFeatureType, LineLegendItem, PolygonLegendItem } from "ropegeo-common/models";
import { useEffect, useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const EXPAND_MS = 280;
const COLLAPSE_MS = 260;
const EASE = Easing.out(Easing.cubic);

const POINT_MARKER_IMAGE = require("@/assets/images/icons/markers/marker.png");

export type PageMiniMapLegendProps = {
  /** Server-provided legend rows (parent only mounts when non-empty). */
  legend: Record<string, LegendItem>;
  expanded: boolean;
  selectedKey: string | null;
  maxHeight: number;
  maxWidth: number;
  /** Distance from the physical bottom of the overlay to the legend (tab bar + safe area + gap). */
  bottomOffset: number;
  rightInset: number;
  onToggleExpanded: () => void;
  onSelectLegendId: (id: string) => void;
};

function LegendItemSwatch({ item }: { item: LegendItem }) {
  if (item.featureType === LegendFeatureType.Point) {
    return (
      <View style={styles.swatchWrap} accessibilityIgnoresInvertColors>
        <Image source={POINT_MARKER_IMAGE} style={styles.swatchPointMarker} accessibilityIgnoresInvertColors />
      </View>
    );
  }
  if (item.featureType === LegendFeatureType.Polygon) {
    const G = item as PolygonLegendItem;
    const stroke = parseStrokeColor(G.borderColor ?? G.fillColor);
    const fillColor =
      G.fillColor !== undefined && String(G.fillColor).trim() !== ""
        ? parseStrokeColor(G.fillColor)
        : undefined;
    return (
      <View style={styles.swatchWrap} accessibilityIgnoresInvertColors>
        <View
          style={[
            styles.swatchPolygon,
            {
              borderColor: stroke,
              backgroundColor: fillColor ?? "rgba(0,0,0,0.06)",
            },
          ]}
        />
      </View>
    );
  }
  const L = item as LineLegendItem;
  const stroke = parseStrokeColor(L.strokeColor);
  const strokeWidth = parseStrokeWidth(L.strokeWidth);
  return (
    <View style={styles.swatchWrap} accessibilityIgnoresInvertColors>
      <View
        style={[
          styles.swatchLine,
          {
            backgroundColor: stroke,
            height: Math.min(10, Math.max(3, strokeWidth)),
          },
        ]}
      />
    </View>
  );
}

export function PageMiniMapLegend({
  legend,
  expanded,
  selectedKey,
  maxHeight,
  maxWidth,
  bottomOffset,
  rightInset,
  onToggleExpanded,
  onSelectLegendId,
}: PageMiniMapLegendProps) {
  const bodyHeight = useSharedValue(0);
  const bodyOpacity = useSharedValue(0);

  const sortedLegendItems = useMemo(
    () => Object.values(legend).sort((a, b) => a.name.localeCompare(b.name)),
    [legend],
  );

  const rowCount = sortedLegendItems.length;

  useEffect(() => {
    if (rowCount === 0) {
      bodyHeight.value = 0;
      bodyOpacity.value = 0;
      return;
    }
    if (expanded) {
      bodyOpacity.value = withTiming(1, { duration: Math.min(220, EXPAND_MS), easing: EASE });
      bodyHeight.value = withTiming(maxHeight, { duration: EXPAND_MS, easing: EASE });
    } else {
      bodyOpacity.value = withTiming(0, { duration: COLLAPSE_MS * 0.45, easing: EASE });
      bodyHeight.value = withTiming(0, { duration: COLLAPSE_MS, easing: EASE });
    }
  }, [expanded, maxHeight, rowCount]);

  const animatedBodyStyle = useAnimatedStyle(() => ({
    height: bodyHeight.value,
    opacity: bodyOpacity.value,
    overflow: "hidden",
  }));

  if (rowCount === 0) return null;

  return (
    <View
      style={[styles.anchor, { bottom: bottomOffset, right: rightInset + 12, maxWidth }]}
      pointerEvents="box-none"
    >
      <View style={[styles.card, { maxWidth }]}>
        <Pressable
          onPress={onToggleExpanded}
          style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
          accessibilityRole="button"
          accessibilityLabel={expanded ? "Collapse map legend" : "Expand map legend"}
        >
          <Text style={styles.headerTitle}>Map Legend</Text>
          <FontAwesome5 name={expanded ? "chevron-down" : "chevron-up"} size={14} color="#111" />
        </Pressable>
        <Animated.View style={animatedBodyStyle} pointerEvents={expanded ? "auto" : "none"}>
          <ScrollView
            style={{ maxHeight }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {sortedLegendItems.map((item) => {
              const selected = selectedKey === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onSelectLegendId(item.id)}
                  style={({ pressed }) => [
                    styles.row,
                    selected && styles.rowSelected,
                    pressed && !selected && styles.rowPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <LegendItemSwatch item={item} />
                  <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]} numberOfLines={3}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    zIndex: 50,
    alignSelf: "flex-end",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 12,
    minWidth: 160,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerPressed: {
    opacity: 0.85,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  rowPressed: {
    backgroundColor: "#f3f4f6",
  },
  rowSelected: {
    backgroundColor: "#dbeafe",
  },
  swatchWrap: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchLine: {
    width: 28,
    borderRadius: 2,
  },
  swatchPointMarker: {
    width: 18,
    height: 22,
    resizeMode: "contain",
  },
  swatchPolygon: {
    width: 28,
    height: 14,
    borderRadius: 3,
    borderWidth: 2,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    color: "#111",
  },
  rowLabelSelected: {
    fontWeight: "600",
  },
});
