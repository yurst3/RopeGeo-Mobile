import { parseStrokeColor, parseStrokeWidth } from "@/components/minimap/shared/pageMiniMapSegments";
import { useColorTheme } from "@/context/ColorThemeContext";
import { FontAwesome5 } from "@expo/vector-icons";
import type { LegendItem } from "ropegeo-common/models";
import { LegendFeatureType, LineLegendItem, PolygonLegendItem } from "ropegeo-common/models";
import type { ComponentRef } from "react";
import { useEffect, useMemo, useRef } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const EXPAND_MS = 280;
const COLLAPSE_MS = 260;
/** After expand animation, row layouts inside the ScrollView are reliable. */
const SCROLL_AFTER_EXPAND_MS = EXPAND_MS + 48;
const EASE = Easing.out(Easing.cubic);

const POINT_MARKER_IMAGE = require("@/assets/images/icons/markers/marker.png");

export type PageMiniMapLegendProps = {
  /** Server-provided legend rows (parent only mounts when non-empty). */
  legend: Record<string, LegendItem>;
  expanded: boolean;
  selectedKey: string | null;
  /**
   * Parent increments this only when the user selects a line on the map (not when tapping the legend).
   * Used to trigger a one-time scroll so the selected row is visible.
   */
  scrollIntoViewEpoch?: number;
  maxHeight: number;
  maxWidth: number;
  /** Distance from the physical bottom of the overlay to the legend (tab bar + safe area + gap). */
  bottomOffset: number;
  rightInset: number;
  onToggleExpanded: () => void;
  onSelectLegendId: (id: string) => void;
};

function LegendItemSwatch({
  item,
  pointMarkerTint,
  defaultLineStroke,
}: {
  item: LegendItem;
  pointMarkerTint: string;
  defaultLineStroke: string;
}) {
  if (item.featureType === LegendFeatureType.Point) {
    return (
      <View style={styles.swatchWrap} accessibilityIgnoresInvertColors>
        <Image
          source={POINT_MARKER_IMAGE}
          style={[styles.swatchPointMarker, { tintColor: pointMarkerTint }]}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }
  if (item.featureType === LegendFeatureType.Polygon) {
    const G = item as PolygonLegendItem;
    const stroke = parseStrokeColor(
      G.borderColor ?? G.fillColor,
      defaultLineStroke,
    );
    const fillColor =
      G.fillColor !== undefined && String(G.fillColor).trim() !== ""
        ? parseStrokeColor(G.fillColor, defaultLineStroke)
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
  const stroke = parseStrokeColor(L.strokeColor, defaultLineStroke);
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
  scrollIntoViewEpoch = 0,
  maxHeight,
  maxWidth,
  bottomOffset,
  rightInset,
  onToggleExpanded,
  onSelectLegendId,
}: PageMiniMapLegendProps) {
  const themeColors = useColorTheme();
  const { minimap, focusedLineSegment } = themeColors.map;
  const { text, cardHighlight } = themeColors;
  const { bodyBackground, headerBackground, shadow } = minimap.legend;

  const cardStyle = useMemo(
    () => [
      styles.card,
      {
        maxWidth,
        shadowColor: shadow,
      },
    ],
    [maxWidth, shadow],
  );

  const headerStyle = useMemo(
    () => [styles.header, { backgroundColor: headerBackground }],
    [headerBackground],
  );

  const listBodyStyle = useMemo(
    () => ({ backgroundColor: bodyBackground }),
    [bodyBackground],
  );

  const headerTitleStyle = useMemo(
    () => [styles.headerTitle, { color: text.primary }],
    [text.primary],
  );

  const rowStyle = useMemo(
    () => [styles.row, { borderTopColor: themeColors.separator }],
    [themeColors.separator],
  );

  const rowLabelStyle = useMemo(
    () => [styles.rowLabel, { color: text.primary }],
    [text.primary],
  );

  const rowSelectedStyle = useMemo(
    () => ({ backgroundColor: cardHighlight }),
    [cardHighlight],
  );

  const bodyHeight = useSharedValue(0);
  const bodyOpacity = useSharedValue(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const rowYRef = useRef<Record<string, number>>({});
  const prevExpandedRef = useRef(false);
  const selectedKeyRef = useRef<string | null>(null);
  selectedKeyRef.current = selectedKey;

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

  useEffect(() => {
    if (scrollIntoViewEpoch === 0 || !expanded) {
      prevExpandedRef.current = expanded;
      return;
    }
    const id = selectedKeyRef.current;
    if (id == null || id === "") {
      prevExpandedRef.current = expanded;
      return;
    }
    const legendJustOpened = expanded && !prevExpandedRef.current;
    prevExpandedRef.current = expanded;
    const delay = legendJustOpened ? SCROLL_AFTER_EXPAND_MS : 80;
    const t = setTimeout(() => {
      const y = rowYRef.current[id];
      if (y == null || scrollRef.current == null) return;
      scrollRef.current.scrollTo({
        y: Math.max(0, y - 10),
        animated: true,
      });
    }, delay);
    return () => clearTimeout(t);
  }, [scrollIntoViewEpoch, expanded, rowCount]);

  if (rowCount === 0) return null;

  return (
    <View
      style={[styles.anchor, { bottom: bottomOffset, right: rightInset + 12, maxWidth }]}
      pointerEvents="box-none"
    >
      <View style={cardStyle}>
        <Pressable
          onPress={onToggleExpanded}
          style={({ pressed }) => [
            headerStyle,
            pressed && styles.headerPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={expanded ? "Collapse map legend" : "Expand map legend"}
        >
          <Text style={headerTitleStyle}>Map Legend</Text>
          <FontAwesome5
            name={expanded ? "chevron-down" : "chevron-up"}
            size={14}
            color={minimap.legend.collapseIcon}
          />
        </Pressable>
        <Animated.View
          style={[animatedBodyStyle, listBodyStyle]}
          pointerEvents={expanded ? "auto" : "none"}
        >
          <ScrollView
            ref={scrollRef}
            style={[{ maxHeight }, listBodyStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {sortedLegendItems.map((item) => {
              const selected = selectedKey === item.id;
              return (
                <Pressable
                  key={item.id}
                  onLayout={(e) => {
                    rowYRef.current[item.id] = e.nativeEvent.layout.y;
                  }}
                  onPress={() => onSelectLegendId(item.id)}
                  style={[rowStyle, selected && rowSelectedStyle]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <LegendItemSwatch
                    item={item}
                    pointMarkerTint={minimap.legend.markerIcon}
                    defaultLineStroke={focusedLineSegment}
                  />
                  <Text
                    style={[rowLabelStyle, selected && styles.rowLabelSelected]}
                    numberOfLines={3}
                  >
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
    borderRadius: 12,
    overflow: "hidden",
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
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
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
  },
  rowLabelSelected: {
    fontWeight: "600",
  },
});
