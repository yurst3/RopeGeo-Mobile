import { ConstantText } from "@/components/text/ConstantText";
import { RECORD_LINE_SEGMENT_BUTTON_KEY } from "@/constants/buttons";
import type { RecordLineSegmentButtonColors } from "@/constants/colors/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import {
  useResolvedButtonBackgroundScale,
  useResolvedButtonDimensions,
  useResolvedIconSizeScale,
} from "@/utils/theme/resolvers";
import { STANDARD_BUTTON_SHADOW } from "@/utils/theme/standardButtonShadow";
import { FontAwesome5 } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

const BASE_PADDING_HORIZONTAL = 12;
const DESIGN_ICON_SIZE = 12;
/**
 * Height of the pill before UI scaling. Buttons placed beside it (e.g. the record settings
 * button) use this as their size so the row lines up.
 */
export const RECORD_CONTROL_DESIGN_SIZE = 36;

export type RecordLineSegmentButtonProps = {
  recording: boolean;
  onPress: () => void;
  /** Another map is recording: the button is dimmed and explains why it can't be used. */
  blockedByOtherRecording?: boolean;
};

/** Pill that starts ("Record Segment") or pauses ("Pause Recording") recording on a map. */
export function RecordLineSegmentButton({
  recording,
  onPress,
  blockedByOtherRecording = false,
}: RecordLineSegmentButtonProps) {
  const colors = useColorTheme().button.nonstandard[
    RECORD_LINE_SEGMENT_BUTTON_KEY
  ] as RecordLineSegmentButtonColors;
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const backgroundScale = useResolvedButtonBackgroundScale(uiScale.filter.buttons.chip);
  const { size: height } = useResolvedButtonDimensions(
    uiScale.common.buttons.filter,
    RECORD_CONTROL_DESIGN_SIZE,
  );
  const iconSizeScale = useResolvedIconSizeScale();
  const iconSize = Math.round(DESIGN_ICON_SIZE * iconSizeScale);
  const label = blockedByOtherRecording
    ? "Recording another map"
    : recording
      ? "Pause Recording"
      : "Record Segment";

  return (
    <Pressable
      onPress={onPress}
      disabled={blockedByOtherRecording}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.background,
          shadowColor: colors.shadowColor,
          height,
          paddingHorizontal: BASE_PADDING_HORIZONTAL * backgroundScale,
          opacity: blockedByOtherRecording ? 0.5 : pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blockedByOtherRecording }}
    >
      <ConstantText
        size={uiScale.filter.buttons.chip.text!}
        typography={textStyle.filter.optionLabel}
        style={{ color: colors.text }}
      >
        {label}
      </ConstantText>
      {recording ? (
        <FontAwesome5 name="pause" size={iconSize} color={colors.pauseIcon} />
      ) : (
        <View
          style={[
            styles.recordSquare,
            { width: iconSize, height: iconSize, backgroundColor: colors.indicator },
          ]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    ...STANDARD_BUTTON_SHADOW,
  },
  recordSquare: {
    borderRadius: 2,
  },
});
