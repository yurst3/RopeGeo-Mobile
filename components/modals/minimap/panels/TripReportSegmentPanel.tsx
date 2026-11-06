import {
  MiniRecordLineSegmentButton,
  useMiniRecordLineSegmentButtonSize,
} from "@/components/buttons/standard/MiniRecordLineSegmentButton";
import { LineStyleSelector } from "@/components/lineSegments/LineStyleSelector";
import { LineThicknessSelector } from "@/components/lineSegments/LineThicknessSelector";
import { ColorSwatch } from "@/components/settings/ColorSwatch";
import { ConstantText } from "@/components/text/ConstantText";
import { ScalingText } from "@/components/text/ScalingText";
import { TextInput } from "@/components/widgets/TextInput";
import {
  LINE_SEGMENT_COLORS,
  LINE_SEGMENT_WIDTHS,
} from "@/constants/tripReport/lineSegmentAppearance";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { FontAwesome5 } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type EntryAnimationsValues,
  type ExitAnimationsValues,
  type LayoutAnimation,
  type SharedValue,
} from "react-native-reanimated";
import { DESIGN_RECORDING_DOT_SIZE, RecordingDot } from "../shared/RecordingDot";
import {
  TRIP_REPORT_LINE_COLORS,
  type TripReportLineColor,
  type TripReportLineSegment,
} from "ropegeo-common/models";

const DESIGN_DELETE_ICON_SIZE = 13;
const BODY_PADDING = 12;
/** Space kept between the panel and the top of the on-screen keyboard. */
const KEYBOARD_GAP = 8;
/** Ring drawn around the selected color swatch. */
const SWATCH_RING_WIDTH = 2;
const SWATCH_RING_PADDING = 2;
/** Same timing as the legend expanding and collapsing beside it. */
const ENTER_MS = 280;
/** How long the panel takes to slide out; a panel replacing it can wait this long to enter. */
export const TRIP_REPORT_SEGMENT_PANEL_EXIT_MS = 260;
const ENTER_EASING = Easing.out(Easing.cubic);
const EXIT_EASING = Easing.in(Easing.cubic);
/** Body collapse and expand, timed like the legend's. */
const BODY_EXPAND_MS = 280;
const BODY_COLLAPSE_MS = 260;
const BODY_EASING = Easing.out(Easing.cubic);
const CHEVRON_SIZE = 14;
/** Space between the record button and the top of the panel card. */
const RECORD_BUTTON_GAP = 8;

/** Slides the panel up into place from below the bottom of the screen after `delayMs`. */
function slideUpFromBottom(delayMs: number) {
  return (values: EntryAnimationsValues): LayoutAnimation => {
    "worklet";
    const slide = withTiming(0, { duration: ENTER_MS, easing: ENTER_EASING });
    return {
      initialValues: { transform: [{ translateY: values.windowHeight - values.targetOriginY }] },
      animations: {
        transform: [{ translateY: delayMs > 0 ? withDelay(delayMs, slide) : slide }],
      },
    };
  };
}

/** Slides the panel down past the bottom of the screen while fading it out. */
function slideDownAndFadeOut(values: ExitAnimationsValues): LayoutAnimation {
  "worklet";
  const config = { duration: TRIP_REPORT_SEGMENT_PANEL_EXIT_MS, easing: EXIT_EASING };
  return {
    initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
    animations: {
      opacity: withTiming(0, config),
      transform: [
        { translateY: withTiming(values.windowHeight - values.currentOriginY, config) },
      ],
    },
  };
}

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

/** Height of the on-screen keyboard, or 0 while it is hidden. */
function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

export type TripReportSegmentPanelProps = {
  segment: TripReportLineSegment;
  /** Tallest the panel gets, including the record button above it. */
  maxHeight: number;
  leftOffset: number;
  /** Distance from the window's right edge (positions the card left of the legend). */
  rightOffset: number;
  bottomOffset: number;
  /** Wait before sliding in, e.g. for the previous segment's panel to finish sliding out. */
  enterDelayMs?: number;
  /** This segment is the one being recorded: the record button shows pause. */
  recording: boolean;
  /** Shared pulse driving the title's recording dot, so it stays in step with the map's border. */
  recordingPulse: SharedValue<number>;
  /** Starts recording this segment, or pauses it while it's recording. */
  onToggleRecording: () => void;
  /** Disables the record button, e.g. without location access. */
  recordDisabled: boolean;
  onUpdate: (update: (segment: TripReportLineSegment) => TripReportLineSegment) => void;
  onDelete: () => void;
};

/**
 * Editor for the line segment selected in the trip report legend: name, color, and line style,
 * plus delete. Sits left of the legend and rises above the keyboard while the name is edited.
 * Slides up from the bottom of the screen when shown, and back down while fading out when hidden.
 * Like the legend, its header collapses and expands the body. A record button floats above its
 * left edge, riding along as it expands and collapses.
 */
export function TripReportSegmentPanel({
  segment,
  maxHeight,
  leftOffset,
  rightOffset,
  bottomOffset,
  enterDelayMs = 0,
  recording,
  recordingPulse,
  onToggleRecording,
  recordDisabled,
  onUpdate,
  onDelete,
}: TripReportSegmentPanelProps) {
  const entering = useMemo(() => slideUpFromBottom(enterDelayMs), [enterDelayMs]);
  const themeColors = useColorTheme();
  const { text } = themeColors;
  const { bodyBackground, headerBackground, shadow, collapseIcon } = themeColors.map.minimap.legend;
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const iconScale = useResolvedIconSizeScale();
  const deleteIconSize = Math.round(DESIGN_DELETE_ICON_SIZE * iconScale);
  const chevronSize = Math.round(CHEVRON_SIZE * iconScale);
  const recordingDotSize = Math.round(DESIGN_RECORDING_DOT_SIZE * iconScale);
  const keyboardHeight = useKeyboardHeight();
  const [contentWidth, setContentWidth] = useState(0);

  const [bodyExpanded, setBodyExpanded] = useState(true);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const bodyHeight = useSharedValue(0);
  const bodyOpacity = useSharedValue(1);
  // Until the content is measured the body takes its natural height; the first measurement then
  // sets the animated height without animating, so the panel doesn't grow in after sliding up.
  // The record button floats above the card, so it counts toward the panel's maximum height.
  const recordButtonSize = useMiniRecordLineSegmentButtonSize();
  const bodyMaxHeight = Math.max(0, maxHeight - recordButtonSize - RECORD_BUTTON_GAP);
  const targetBodyHeight =
    contentHeight == null ? null : Math.min(contentHeight, bodyMaxHeight);
  const bodyHeightAppliedRef = useRef(false);
  useEffect(() => {
    if (targetBodyHeight == null) return;
    const height = bodyExpanded ? targetBodyHeight : 0;
    if (!bodyHeightAppliedRef.current) {
      bodyHeightAppliedRef.current = true;
      bodyHeight.value = height;
      bodyOpacity.value = bodyExpanded ? 1 : 0;
      return;
    }
    if (bodyExpanded) {
      bodyOpacity.value = withTiming(1, { duration: 220, easing: BODY_EASING });
      bodyHeight.value = withTiming(height, { duration: BODY_EXPAND_MS, easing: BODY_EASING });
    } else {
      bodyOpacity.value = withTiming(0, { duration: BODY_COLLAPSE_MS * 0.45, easing: BODY_EASING });
      bodyHeight.value = withTiming(0, { duration: BODY_COLLAPSE_MS, easing: BODY_EASING });
    }
  }, [bodyExpanded, targetBodyHeight, bodyHeight, bodyOpacity]);
  const animatedBodyStyle = useAnimatedStyle(() => ({
    height: bodyHeight.value,
    opacity: bodyOpacity.value,
    overflow: "hidden",
  }));

  const toggleBodyExpanded = () => {
    if (bodyExpanded) Keyboard.dismiss();
    setBodyExpanded(!bodyExpanded);
  };

  // Draft only resets when a different segment is selected; the saved name is trimmed, so syncing
  // on every name change would strip spaces while typing.
  const [nameDraft, setNameDraft] = useState(segment.name);
  const [draftSegmentId, setDraftSegmentId] = useState(segment.id);
  if (draftSegmentId !== segment.id) {
    setDraftSegmentId(segment.id);
    setNameDraft(segment.name);
  }

  const changeName = (name: string) => {
    setNameDraft(name);
    if (name.trim().length > 0) onUpdate((current) => current.withName(name));
  };

  const confirmDelete = () => {
    const count = segment.waypoints.length;
    Alert.alert(
      "Delete segment?",
      `"${segment.name}" and its ${count} ${count === 1 ? "waypoint" : "waypoints"} will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ],
    );
  };

  const sectionLabel = (label: string) => (
    <ConstantText
      size={uiScale.filter.text.note}
      typography={textStyle.filter.note}
      style={{ color: text.secondary }}
    >
      {label}
    </ConstantText>
  );

  return (
    <Animated.View
      entering={entering}
      exiting={slideDownAndFadeOut}
      style={[
        styles.anchor,
        {
          bottom: Math.max(bottomOffset, keyboardHeight + KEYBOARD_GAP),
          left: leftOffset,
          right: rightOffset,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.recordButtonRow} pointerEvents="box-none">
        <MiniRecordLineSegmentButton
          recording={recording}
          onPress={onToggleRecording}
          disabled={recordDisabled}
        />
      </View>
      <View style={[styles.card, { shadowColor: shadow }]}>
        <Pressable
          onPress={toggleBodyExpanded}
          style={({ pressed }) => [
            styles.header,
            { backgroundColor: headerBackground },
            pressed && styles.headerPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={bodyExpanded ? "Collapse segment editor" : "Expand segment editor"}
        >
          <View style={styles.headerTitleRow}>
            <ScalingText
              size={uiScale.map.text.legendTitle}
              typography={textStyle.map.legendTitle}
              numberOfLines={1}
              measure={{ type: "width" }}
              containerStyle={styles.headerTitleWrap}
              style={{ color: text.primary }}
            >
              Edit Segment
            </ScalingText>
            {recording ? <RecordingDot size={recordingDotSize} progress={recordingPulse} /> : null}
          </View>
          <View
            style={[styles.chevronSlot, { width: chevronSize }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <FontAwesome5
              name={bodyExpanded ? "chevron-down" : "chevron-up"}
              size={chevronSize}
              color={collapseIcon}
            />
          </View>
        </Pressable>
        <Animated.View
          style={[
            targetBodyHeight != null ? animatedBodyStyle : null,
            { backgroundColor: bodyBackground },
          ]}
          pointerEvents={bodyExpanded ? "auto" : "none"}
        >
          <ScrollView
            style={{ maxHeight: bodyMaxHeight }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            onContentSizeChange={(_, height) => setContentHeight(height)}
          >
            <View
              style={styles.body}
              onLayout={(e) =>
                setContentWidth(Math.max(0, e.nativeEvent.layout.width - BODY_PADDING * 2))
              }
            >
              {contentWidth > 0 ? (
                <TextInput
                  value={nameDraft}
                  onChangeText={changeName}
                  onBlur={() => setNameDraft(segment.name)}
                  placeholder="Segment name"
                  size={uiScale.filter.text.sectionTitle}
                  typography={textStyle.filter.optionLabel}
                  align="left"
                  minWidth={contentWidth}
                  maxWidth={contentWidth}
                  title="Name"
                  titleBackgroundColor={bodyBackground}
                  accessibilityLabel="Segment name"
                />
              ) : null}

              <View style={styles.section}>
                {sectionLabel("Color")}
                <View style={styles.swatchGrid} accessibilityRole="radiogroup">
                  {TRIP_REPORT_LINE_COLORS.map((color) => {
                    const selected = color === segment.color;
                    return (
                      <Pressable
                        key={color}
                        onPress={() => onUpdate((current) => current.withColor(color))}
                        hitSlop={4}
                        style={({ pressed }) => [
                          styles.swatchRing,
                          {
                            borderColor: selected ? text.primary : bodyBackground,
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                        accessibilityRole="radio"
                        accessibilityLabel={COLOR_LABELS[color]}
                        accessibilityState={{ selected }}
                      >
                        <ColorSwatch primaryColor={LINE_SEGMENT_COLORS[color]} />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                {sectionLabel("Style")}
                <LineStyleSelector
                  value={segment.style}
                  onChange={(style) => onUpdate((current) => current.withStyle(style))}
                  previewColor={LINE_SEGMENT_COLORS[segment.color]}
                  previewThickness={LINE_SEGMENT_WIDTHS[segment.thickness]}
                />
              </View>

              <View style={styles.section}>
                {sectionLabel("Thickness")}
                <LineThicknessSelector
                  value={segment.thickness}
                  onChange={(thickness) => onUpdate((current) => current.withThickness(thickness))}
                  previewColor={LINE_SEGMENT_COLORS[segment.color]}
                  previewStyle={segment.style}
                />
              </View>

              <Pressable
                onPress={confirmDelete}
                style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.6 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Delete segment"
              >
                <FontAwesome5 name="trash-alt" size={deleteIconSize} color={text.error} />
                <ConstantText
                  size={uiScale.filter.buttons.chip.text!}
                  typography={textStyle.filter.optionLabel}
                  style={{ color: text.error }}
                >
                  Delete Segment
                </ConstantText>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    zIndex: 50,
  },
  recordButtonRow: {
    alignItems: "flex-start",
    marginBottom: RECORD_BUTTON_GAP,
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
  headerTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitleWrap: {
    flexShrink: 1,
    minWidth: 0,
  },
  chevronSlot: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: BODY_PADDING,
    paddingTop: BODY_PADDING + 6,
    gap: 14,
  },
  section: {
    gap: 6,
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  swatchRing: {
    borderWidth: SWATCH_RING_WIDTH,
    borderRadius: 999,
    padding: SWATCH_RING_PADDING,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
});
