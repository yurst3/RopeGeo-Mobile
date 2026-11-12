import { ConstantText } from "@/components/text/ConstantText";
import { ScalingText } from "@/components/text/ScalingText";
import { TextInput } from "@/components/widgets/TextInput";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { FontAwesome5 } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type EntryAnimationsValues,
  type ExitAnimationsValues,
  type LayoutAnimation,
} from "react-native-reanimated";

const DESIGN_DELETE_ICON_SIZE = 13;
const BODY_PADDING = 12;
/** Space kept between the panel and the top of the on-screen keyboard. */
const KEYBOARD_GAP = 8;
/** Same timing as the legend expanding and collapsing beside it. */
const ENTER_MS = 280;
/** How long a panel takes to slide out; a panel replacing it can wait this long to enter. */
export const TRIP_REPORT_EDIT_PANEL_EXIT_MS = 260;
const ENTER_EASING = Easing.out(Easing.cubic);
const EXIT_EASING = Easing.in(Easing.cubic);
/** Body collapse and expand, timed like the legend's. */
const BODY_EXPAND_MS = 280;
const BODY_COLLAPSE_MS = 260;
const BODY_EASING = Easing.out(Easing.cubic);
const CHEVRON_SIZE = 14;

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
  const config = { duration: TRIP_REPORT_EDIT_PANEL_EXIT_MS, easing: EXIT_EASING };
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

/**
 * Name field for the item `itemId`. The draft only resets when a different item is shown; the
 * saved name is trimmed, so syncing on every name change would strip spaces while typing. Blank
 * drafts aren't saved, and blurring restores the saved name.
 */
export function TripReportEditPanelNameInput({
  itemId,
  savedName,
  onSaveName,
  contentWidth,
  placeholder,
}: {
  itemId: string;
  savedName: string;
  onSaveName: (name: string) => void;
  contentWidth: number;
  placeholder: string;
}) {
  const { map } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const [draft, setDraft] = useState(savedName);
  const [draftItemId, setDraftItemId] = useState(itemId);
  if (draftItemId !== itemId) {
    setDraftItemId(itemId);
    setDraft(savedName);
  }
  if (contentWidth <= 0) return null;
  return (
    <TextInput
      value={draft}
      onChangeText={(name) => {
        setDraft(name);
        if (name.trim().length > 0) onSaveName(name);
      }}
      onBlur={() => setDraft(savedName)}
      placeholder={placeholder}
      size={uiScale.filter.text.sectionTitle}
      typography={textStyle.filter.optionLabel}
      align="left"
      minWidth={contentWidth}
      maxWidth={contentWidth}
      title="Name"
      titleBackgroundColor={map.minimap.legend.bodyBackground}
      accessibilityLabel={placeholder}
    />
  );
}

/** A labeled group of controls in an edit panel. */
export function TripReportEditPanelSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const { text } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  return (
    <View style={styles.section}>
      <ConstantText
        size={uiScale.filter.text.note}
        typography={textStyle.filter.note}
        style={{ color: text.secondary }}
      >
        {label}
      </ConstantText>
      {children}
    </View>
  );
}

/** Red trash button at the bottom of an edit panel. */
export function TripReportEditPanelDeleteButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { text } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const deleteIconSize = Math.round(DESIGN_DELETE_ICON_SIZE * useResolvedIconSizeScale());
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.6 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <FontAwesome5 name="trash-alt" size={deleteIconSize} color={text.error} />
      <ConstantText
        size={uiScale.filter.buttons.chip.text!}
        typography={textStyle.filter.optionLabel}
        style={{ color: text.error }}
      >
        {label}
      </ConstantText>
    </Pressable>
  );
}

export type TripReportEditPanelProps = {
  title: string;
  /** Shown after the title, e.g. a recording dot. */
  titleAccessory?: ReactNode;
  /** Accessibility name of what's edited, e.g. "segment" ("Collapse segment editor"). */
  itemLabel: string;
  /** Floats above the card's left edge, riding along as the body expands and collapses. */
  aboveCard?: ReactNode;
  /** Height `aboveCard` takes, including its gap to the card; counts toward `maxHeight`. */
  aboveCardHeight?: number;
  /** Tallest the panel gets, including anything above the card. */
  maxHeight: number;
  leftOffset: number;
  /** Distance from the window's right edge (positions the card left of the legend). */
  rightOffset: number;
  bottomOffset: number;
  /** Wait before sliding in, e.g. for the previous panel to finish sliding out. */
  enterDelayMs?: number;
  /** The body's controls, given the width available to them. */
  children: (contentWidth: number) => ReactNode;
};

/**
 * Card for editing an item selected in the trip report legend. Sits left of the legend and rises
 * above the keyboard while a field is edited. Slides up from the bottom of the screen when shown,
 * and back down while fading out when hidden. Like the legend, its header collapses and expands
 * the body.
 */
export function TripReportEditPanel({
  title,
  titleAccessory,
  itemLabel,
  aboveCard,
  aboveCardHeight = 0,
  maxHeight,
  leftOffset,
  rightOffset,
  bottomOffset,
  enterDelayMs = 0,
  children,
}: TripReportEditPanelProps) {
  const entering = useMemo(() => slideUpFromBottom(enterDelayMs), [enterDelayMs]);
  const themeColors = useColorTheme();
  const { text } = themeColors;
  const { bodyBackground, headerBackground, shadow, collapseIcon } = themeColors.map.minimap.legend;
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const chevronSize = Math.round(CHEVRON_SIZE * useResolvedIconSizeScale());
  const keyboardHeight = useKeyboardHeight();
  const [contentWidth, setContentWidth] = useState(0);

  const [bodyExpanded, setBodyExpanded] = useState(true);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const bodyHeight = useSharedValue(0);
  const bodyOpacity = useSharedValue(1);
  // Until the content is measured the body takes its natural height; the first measurement then
  // sets the animated height without animating, so the panel doesn't grow in after sliding up.
  const bodyMaxHeight = Math.max(0, maxHeight - aboveCardHeight);
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
      {aboveCard}
      <View style={[styles.card, { shadowColor: shadow }]}>
        <Pressable
          onPress={toggleBodyExpanded}
          style={({ pressed }) => [
            styles.header,
            { backgroundColor: headerBackground },
            pressed && styles.headerPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            bodyExpanded ? `Collapse ${itemLabel} editor` : `Expand ${itemLabel} editor`
          }
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
              {title}
            </ScalingText>
            {titleAccessory}
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
              {children(contentWidth)}
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
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
});
