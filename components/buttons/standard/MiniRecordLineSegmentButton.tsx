import { Button } from "@/components/buttons/Button";
import {
  MINI_RECORD_LINE_SEGMENT_BUTTON_KEY,
  RECORD_LINE_SEGMENT_BUTTON_KEY,
} from "@/constants/buttons";
import type { RecordLineSegmentButtonColors } from "@/constants/colors/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { MAP_BUTTON_SIZE } from "@/utils/minimap/fullScreenMapLayout";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

const ICON_SIZE = 16;
const ICON_DESIGN_SCALE = ICON_SIZE / (MAP_BUTTON_SIZE * 0.5);
const DISABLED_OPACITY = 0.45;

/** Diameter of {@link MiniRecordLineSegmentButton} for the current UI scale, for laying out around it. */
export function useMiniRecordLineSegmentButtonSize(): number {
  const uiScale = useUiScale();
  return useResolvedButtonDimensions(
    uiScale.map.buttons.miniRecordLineSegment,
    MAP_BUTTON_SIZE,
    ICON_DESIGN_SCALE,
  ).size;
}

/**
 * Round map button version of {@link RecordLineSegmentButton}: the same record and pause icons
 * without the label. Records one segment, or pauses it while `recording`.
 */
export function MiniRecordLineSegmentButton({
  recording,
  onPress,
  disabled = false,
}: {
  recording: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[MINI_RECORD_LINE_SEGMENT_BUTTON_KEY];
  const recordColors = themeColors.button.nonstandard[
    RECORD_LINE_SEGMENT_BUTTON_KEY
  ] as RecordLineSegmentButtonColors;
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.map.buttons.miniRecordLineSegment,
    MAP_BUTTON_SIZE,
    ICON_DESIGN_SCALE,
  );
  const iconSize = Math.round(size * 0.5 * iconScale);

  return (
    <View style={disabled ? { opacity: DISABLED_OPACITY } : null}>
      <Button
        onPress={onPress}
        disabled={disabled}
        backgroundColor={buttonColors.background}
        shadowColor={themeColors.button.shadowColor}
        size={size}
        accessibilityLabel={recording ? "Pause recording segment" : "Record segment"}
      >
        {recording ? (
          <FontAwesome5 name="pause" size={iconSize} color={recordColors.pauseIcon} />
        ) : (
          <View
            style={[
              styles.recordSquare,
              { width: iconSize, height: iconSize, backgroundColor: recordColors.indicator },
            ]}
          />
        )}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  recordSquare: {
    borderRadius: 2,
  },
});
