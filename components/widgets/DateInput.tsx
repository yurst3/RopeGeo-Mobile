import { ConstantText } from "@/components/text/ConstantText";
import type { TypographySpec } from "@/constants/text/style/types";
import type { ConstantTextSizeSpec } from "@/constants/uiScale/types";
import {
  useColorTheme,
  useColorThemePreference,
} from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import {
  useResolvedConstantSize,
  useResolvedIconSizeScale,
  useResolvedTypography,
} from "@/utils/theme/resolvers";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { measureWidth } from "react-native-text-metrics";
import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type TextStyle as RNTextStyle,
} from "react-native";

const CALENDAR_ICON = require("@/assets/images/icons/buttons/calendar.png");
const DESIGN_ICON_SIZE = 20;
const ICON_GAP = 4;
const HORIZONTAL_PADDING = 10;
const TITLE_HORIZONTAL_PADDING = 4;
const VERTICAL_PADDING = 12;
/** Stable width sample for MMM D, YYYY dates. */
const DATE_WIDTH_SAMPLE = "Sep 30, 9999";

function formatTripDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function measureTextWidth(
  text: string,
  fontSize: number,
  typographyStyle: RNTextStyle,
): number {
  const fontWeight = typographyStyle.fontWeight;
  return Math.ceil(
    measureWidth(text.length > 0 ? text : " ", {
      fontSize,
      fontFamily:
        typeof typographyStyle.fontFamily === "string"
          ? typographyStyle.fontFamily
          : undefined,
      fontWeight: fontWeight == null ? undefined : String(fontWeight),
      letterSpacing:
        typeof typographyStyle.letterSpacing === "number"
          ? typographyStyle.letterSpacing
          : undefined,
      allowFontScaling: false,
    }),
  );
}

export type DateInputProps = {
  value: Date;
  onChange: (date: Date) => void;
  size: ConstantTextSizeSpec;
  typography: TypographySpec;
  accessibilityLabel?: string;
  /** Horizontal text alignment. Defaults to left. */
  align?: "center" | "left";
  /** Optional label drawn over the top-left border of the outline. */
  title?: string;
  /** Earliest selectable date in the picker. */
  minimumDate?: Date;
  /** Latest selectable date in the picker. */
  maximumDate?: Date;
};

export function DateInput({
  value,
  onChange,
  size,
  typography,
  accessibilityLabel,
  align = "left",
  title,
  minimumDate,
  maximumDate,
}: DateInputProps) {
  const { background, text, image, filter } = useColorTheme();
  const colorTheme = useColorThemePreference();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const iconSizeScale = useResolvedIconSizeScale();
  const iconSize = Math.round(DESIGN_ICON_SIZE * iconSizeScale);
  const fontSize = useResolvedConstantSize(size);
  const titleSize = useResolvedConstantSize(uiScale.filter.text.note);
  const typographyStyle = useResolvedTypography(typography);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(value);
  const chromeWidth = iconSize + ICON_GAP + HORIZONTAL_PADDING * 2;
  const textSlotWidth = measureTextWidth(DATE_WIDTH_SAMPLE, fontSize, typographyStyle);
  const fieldWidth = textSlotWidth + chromeWidth;
  const outlineColor = image.profileDisplayNameOutline;
  const displayDate = formatTripDate(value);

  const openPicker = () => {
    setDraftDate(value);
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
  };

  const commitDraft = () => {
    onChange(draftDate);
    setPickerOpen(false);
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setPickerOpen(false);
      if (event.type === "set" && selected != null) {
        onChange(selected);
      }
      return;
    }
    if (selected != null) {
      setDraftDate(selected);
    }
  };

  return (
    <>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? displayDate}
        style={[
          styles.container,
          {
            width: fieldWidth,
            height: Math.max(fontSize, iconSize) + VERTICAL_PADDING,
            borderColor: outlineColor,
          },
        ]}
      >
        {title != null && title.length > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.title,
              {
                backgroundColor: background,
                top: -Math.ceil(titleSize / 2),
              },
            ]}
          >
            <ConstantText
              size={uiScale.filter.text.note}
              typography={textStyle.filter.note}
              style={{ color: text.secondary }}
            >
              {title}
            </ConstantText>
          </View>
        ) : null}
        <ConstantText
          size={size}
          typography={typography}
          numberOfLines={1}
          style={[
            styles.value,
            {
              width: textSlotWidth,
              color: text.primary,
              textAlign: align,
            },
          ]}
        >
          {displayDate}
        </ConstantText>
        <Image
          source={CALENDAR_ICON}
          style={{
            width: iconSize,
            height: iconSize,
            tintColor: text.primary,
          }}
          contentFit="contain"
          accessibilityElementsHidden
        />
      </Pressable>

      {Platform.OS === "android" && pickerOpen ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={onPickerChange}
          themeVariant={colorTheme}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}

      {Platform.OS === "ios" ? (
        <Modal
          visible={pickerOpen}
          transparent
          animationType="fade"
          onRequestClose={closePicker}
        >
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closePicker} />
            <View
              style={[
                styles.modalCard,
                { backgroundColor: filter.dropdown.modalBackground },
              ]}
            >
              <View style={styles.modalHeader}>
                <Pressable
                  onPress={closePicker}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <ConstantText
                    size={uiScale.filter.text.sectionTitle}
                    typography={textStyle.filter.optionLabel}
                    style={{ color: text.secondary }}
                  >
                    Cancel
                  </ConstantText>
                </Pressable>
                <Pressable
                  onPress={commitDraft}
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                >
                  <ConstantText
                    size={uiScale.filter.text.sectionTitle}
                    typography={textStyle.filter.optionLabel}
                    style={{ color: text.link }}
                  >
                    Done
                  </ConstantText>
                </Pressable>
              </View>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display="spinner"
                onChange={onPickerChange}
                themeVariant={colorTheme}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ICON_GAP,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  title: {
    position: "absolute",
    left: HORIZONTAL_PADDING,
    zIndex: 1,
    paddingHorizontal: TITLE_HORIZONTAL_PADDING,
  },
  value: {
    padding: 0,
    margin: 0,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: "hidden",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iosPicker: {
    alignSelf: "stretch",
  },
});
