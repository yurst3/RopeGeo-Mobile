import {
  AddLineSegmentButton,
  useAddLineSegmentButtonSize,
} from "@/components/buttons/standard/AddLineSegmentButton";
import { LineSegmentPreview } from "@/components/lineSegments/LineSegmentPreview";
import { ConstantText } from "@/components/text/ConstantText";
import { ScalingText } from "@/components/text/ScalingText";
import { RECORD_LINE_SEGMENT_BUTTON_KEY } from "@/constants/buttons";
import type { RecordLineSegmentButtonColors } from "@/constants/colors/types";
import {
  LINE_SEGMENT_COLORS,
  LINE_SEGMENT_WIDTHS,
} from "@/constants/tripReport/lineSegmentAppearance";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { FontAwesome5 } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import type { TripReportLineSegment } from "ropegeo-common/models";
import { DESIGN_RECORDING_DOT_SIZE, RecordingDot } from "../shared/RecordingDot";

const EXPAND_MS = 280;
const COLLAPSE_MS = 260;
const EASE = Easing.out(Easing.cubic);
const LEGEND_CHEVRON_SIZE = 14;
const LEGEND_SWATCH_COLUMN_WIDTH = 28;
const LEGEND_SWATCH_LINE_WIDTH = 20;
const LEGEND_SWATCH_DASH_COUNT = 2;
const DESIGN_RECORD_ICON_SIZE = 12;
const EMPTY_STATE_PADDING = 10;
/** Space between the add line segment button and the top of the legend card. */
const ADD_BUTTON_GAP = 8;

export type TripReportLegendProps = {
  segments: readonly TripReportLineSegment[];
  expanded: boolean;
  /** Tallest the expanded legend gets, including the add line segment button above it. */
  maxHeight: number;
  /** Left edge of the legend panel (typically half the window width). */
  leftOffset: number;
  /** Distance from the physical bottom of the overlay to the legend. */
  bottomOffset: number;
  /** Right edge inset already including the scaled overlay gap. */
  rightInset: number;
  onToggleExpanded: () => void;
  /** Segment open in the segment panel; its row is highlighted. */
  selectedSegmentId: string | null;
  /** Tapping a row selects that segment, or deselects it if it was already selected. */
  onSelectSegment: (segmentId: string | null) => void;
  /** Same state and action as the map's record button, used by the empty-state prompt. */
  recording: boolean;
  /** Segment being recorded; its row shows the pulsing recording dot. */
  recordingSegmentId: string | null;
  /** Shared pulse driving the recording dot, so it stays in step with the map's border. */
  recordingPulse: SharedValue<number>;
  blockedByOtherRecording: boolean;
  onToggleRecording: () => void;
  /** Starts a new line segment at the user's position. */
  onAddSegment: () => void;
  /** Disables the add line segment button, e.g. without location access. */
  addSegmentDisabled: boolean;
  /** When false, panel stays visible but does not accept presses. */
  interactive?: boolean;
};

/** Short sample of a segment's line: its color, thickness, and solid/dashed/dotted style. */
function SegmentSwatch({
  segment,
  iconScale,
}: {
  segment: TripReportLineSegment;
  iconScale: number;
}) {
  const columnWidth = Math.round(LEGEND_SWATCH_COLUMN_WIDTH * iconScale);
  return (
    <View
      style={[styles.swatchWrap, { width: columnWidth }]}
      accessibilityIgnoresInvertColors
    >
      <LineSegmentPreview
        color={LINE_SEGMENT_COLORS[segment.color]}
        lineStyle={segment.style}
        thickness={LINE_SEGMENT_WIDTHS[segment.thickness]}
        width={Math.round(LEGEND_SWATCH_LINE_WIDTH * iconScale)}
        pieceCount={LEGEND_SWATCH_DASH_COUNT}
      />
    </View>
  );
}

/**
 * Trip report variant of the expanded minimap legend. Lists the map block's line segments; with
 * none, shows a dashed "Record new line segment" prompt that behaves like the record button.
 * An add line segment button floats above its right edge and rides along as it expands and
 * collapses.
 */
export function TripReportLegend({
  segments,
  expanded,
  maxHeight,
  leftOffset,
  bottomOffset,
  rightInset,
  onToggleExpanded,
  selectedSegmentId,
  onSelectSegment,
  recording,
  recordingSegmentId,
  recordingPulse,
  blockedByOtherRecording,
  onToggleRecording,
  onAddSegment,
  addSegmentDisabled,
  interactive = true,
}: TripReportLegendProps) {
  const themeColors = useColorTheme();
  const { text, separator, preview, cardHighlight } = themeColors;
  const { minimap } = themeColors.map;
  const { bodyBackground, headerBackground, shadow, collapseIcon } = minimap.legend;
  const recordColors = themeColors.button.nonstandard[
    RECORD_LINE_SEGMENT_BUTTON_KEY
  ] as RecordLineSegmentButtonColors;
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const iconScale = useResolvedIconSizeScale();
  const chevronSize = Math.round(LEGEND_CHEVRON_SIZE * iconScale);
  const recordIconSize = Math.round(DESIGN_RECORD_ICON_SIZE * iconScale);
  const recordingDotSize = Math.round(DESIGN_RECORDING_DOT_SIZE * iconScale);

  const addButtonSize = useAddLineSegmentButtonSize();
  // The add button floats above the card, so it counts toward the legend's maximum height.
  const bodyMaxHeight = Math.max(0, maxHeight - addButtonSize - ADD_BUTTON_GAP);

  const [contentHeight, setContentHeight] = useState(0);
  const bodyHeight = useSharedValue(0);
  const bodyOpacity = useSharedValue(0);
  const empty = segments.length === 0;
  // The empty-state prompt fills the full legend height; segment lists only take what they need.
  const targetHeight = empty ? bodyMaxHeight : Math.min(contentHeight, bodyMaxHeight);

  useEffect(() => {
    if (expanded) {
      bodyOpacity.value = withTiming(1, { duration: Math.min(220, EXPAND_MS), easing: EASE });
      bodyHeight.value = withTiming(targetHeight, { duration: EXPAND_MS, easing: EASE });
    } else {
      bodyOpacity.value = withTiming(0, { duration: COLLAPSE_MS * 0.45, easing: EASE });
      bodyHeight.value = withTiming(0, { duration: COLLAPSE_MS, easing: EASE });
    }
  }, [expanded, targetHeight, bodyHeight, bodyOpacity]);

  const animatedBodyStyle = useAnimatedStyle(() => ({
    height: bodyHeight.value,
    opacity: bodyOpacity.value,
    overflow: "hidden",
  }));

  const emptyLabel = blockedByOtherRecording
    ? "Recording another map"
    : recording
      ? "Pause Recording"
      : "Record new line segment";

  return (
    <View
      style={[
        styles.anchor,
        { bottom: bottomOffset, left: leftOffset, right: rightInset },
        !interactive ? styles.dimmed : null,
      ]}
      pointerEvents={interactive ? "box-none" : "none"}
    >
      <View style={styles.addButtonRow} pointerEvents="box-none">
        <AddLineSegmentButton onPress={onAddSegment} disabled={addSegmentDisabled} />
      </View>
      <View style={[styles.card, { shadowColor: shadow }]}>
        <Pressable
          onPress={onToggleExpanded}
          style={({ pressed }) => [
            styles.header,
            { backgroundColor: headerBackground },
            pressed && styles.headerPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={expanded ? "Collapse map legend" : "Expand map legend"}
        >
          <ScalingText
            size={uiScale.map.text.legendTitle}
            typography={textStyle.map.legendTitle}
            numberOfLines={1}
            measure={{ type: "width" }}
            containerStyle={styles.headerTitleWrap}
            style={{ color: text.primary }}
          >
            Map Legend
          </ScalingText>
          <View
            style={[styles.chevronSlot, { width: chevronSize }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <FontAwesome5
              name={expanded ? "chevron-down" : "chevron-up"}
              size={chevronSize}
              color={collapseIcon}
            />
          </View>
        </Pressable>
        <Animated.View
          style={[animatedBodyStyle, { backgroundColor: bodyBackground }]}
          pointerEvents={expanded ? "auto" : "none"}
        >
          {empty ? (
            <View style={[styles.emptyPad, { height: bodyMaxHeight }]}>
              <Pressable
                onPress={onToggleRecording}
                disabled={blockedByOtherRecording}
                style={({ pressed }) => [
                  styles.emptyOutline,
                  {
                    borderColor: preview.page.selectionOutline,
                    opacity: blockedByOtherRecording ? 0.5 : pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={emptyLabel}
                accessibilityState={{ disabled: blockedByOtherRecording }}
              >
                <View style={styles.emptyGroup}>
                  <ConstantText
                    size={uiScale.filter.buttons.chip.text!}
                    typography={textStyle.filter.optionLabel}
                    style={[styles.emptyLabel, { color: text.primary }]}
                  >
                    {emptyLabel}
                  </ConstantText>
                  {recording ? (
                    <FontAwesome5
                      name="pause"
                      size={recordIconSize}
                      color={recordColors.pauseIcon}
                    />
                  ) : (
                    <View
                      style={[
                        styles.recordSquare,
                        {
                          width: recordIconSize,
                          height: recordIconSize,
                          backgroundColor: recordColors.indicator,
                        },
                      ]}
                    />
                  )}
                </View>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: bodyMaxHeight }}
              onContentSizeChange={(_, height) => setContentHeight(height)}
              showsVerticalScrollIndicator
            >
              {segments.map((segment, index) => {
                const selected = segment.id === selectedSegmentId;
                return (
                  <Pressable
                    key={segment.id}
                    onPress={() => onSelectSegment(selected ? null : segment.id)}
                    style={[
                      styles.row,
                      index > 0 && { borderTopWidth: StyleSheet.hairlineWidth },
                      { borderTopColor: separator },
                      selected && { backgroundColor: cardHighlight },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <SegmentSwatch segment={segment} iconScale={iconScale} />
                    <ScalingText
                      size={uiScale.map.text.legendItem}
                      typography={textStyle.map.legendItem}
                      numberOfLines={3}
                      ellipsizeMode="tail"
                      measure={{ type: "lineCount", maxLinesAtMaxSize: 3 }}
                      containerStyle={styles.rowLabelWrap}
                      style={[
                        { color: text.primary },
                        selected && { fontWeight: "600" as const },
                      ]}
                    >
                      {segment.name}
                    </ScalingText>
                    {segment.id === recordingSegmentId ? (
                      <RecordingDot size={recordingDotSize} progress={recordingPulse} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    zIndex: 50,
  },
  addButtonRow: {
    alignItems: "flex-end",
    marginBottom: ADD_BUTTON_GAP,
  },
  dimmed: {
    opacity: 0.45,
  },
  card: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 12,
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
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  chevronSlot: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  swatchWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabelWrap: {
    flex: 1,
    minWidth: 0,
  },
  emptyPad: {
    padding: EMPTY_STATE_PADDING,
  },
  emptyOutline: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 10,
  },
  emptyGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emptyLabel: {
    flexShrink: 1,
    textAlign: "center",
  },
  recordSquare: {
    borderRadius: 2,
  },
});
