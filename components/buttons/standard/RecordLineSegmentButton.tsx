import { Button } from "@/components/buttons/Button";
import { RECORD_LINE_SEGMENT_BUTTON_KEY } from "@/constants/buttons";
import { RECORDING_INDICATOR_COLOR } from "@/constants/tripReport/recording";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { MAP_BUTTON_SIZE } from "@/utils/minimap/fullScreenMapLayout";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";
import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

const LINE_SEGMENT_ICON = require("@/assets/images/icons/buttons/lineSegment.png");
/**
 * Size of the record button on a collapsed trip report map. The record settings button beside it
 * uses the same size so the row lines up.
 */
export const RECORD_CONTROL_DESIGN_SIZE = 48;
/** Icon sizes on a {@link MAP_BUTTON_SIZE} button; they scale with the button. */
const DESIGN_SQUARE_SIZE = 16;
const DESIGN_LINE_SEGMENT_ICON_SIZE = 26;
const DESIGN_PAUSE_ICON_SIZE = 16;
/**
 * Red square in the line segment icon's top-right corner, where the add-line "+" sat:
 * centered 75% across and 25% down, sized relative to the icon.
 */
const CORNER_SQUARE_CENTER_X = 0.75;
const CORNER_SQUARE_CENTER_Y = 0.25;
const CORNER_SQUARE_SIZE_RATIO = 0.3;
const DISABLED_OPACITY = 0.45;

/** Diameter of {@link RecordLineSegmentButton} for the current UI scale, for laying out around it. */
export function useRecordLineSegmentButtonSize(designSize: number = MAP_BUTTON_SIZE): number {
  const uiScale = useUiScale();
  return useResolvedButtonDimensions(uiScale.map.buttons.recordLineSegment, designSize).size;
}

/**
 * Round button that starts recording (a red square) or pauses it (a pause icon while
 * `recording`). With `showLineSegment`, the square sits in the corner of a line segment icon
 * tinted with the theme's icon color; the square is always red.
 */
export function RecordLineSegmentButton({
  recording,
  onPress,
  disabled = false,
  showLineSegment = false,
  designSize = MAP_BUTTON_SIZE,
  accessibilityLabel,
}: {
  recording: boolean;
  onPress: () => void;
  disabled?: boolean;
  /** Draws the record square in the corner of a line segment icon instead of on its own. */
  showLineSegment?: boolean;
  /** Button diameter before UI scaling. */
  designSize?: number;
  /** Defaults to "Pause recording" / "Record segment". */
  accessibilityLabel?: string;
}) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[RECORD_LINE_SEGMENT_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.map.buttons.recordLineSegment,
    designSize,
  );
  const iconPx = (designIconSize: number) =>
    Math.round((size * iconScale * designIconSize) / MAP_BUTTON_SIZE);

  let icon;
  if (recording) {
    icon = (
      <FontAwesome5
        name="pause"
        size={iconPx(DESIGN_PAUSE_ICON_SIZE)}
        color={buttonColors.icon}
      />
    );
  } else if (showLineSegment) {
    const iconSize = iconPx(DESIGN_LINE_SEGMENT_ICON_SIZE);
    const squareSize = Math.round(iconSize * CORNER_SQUARE_SIZE_RATIO);
    icon = (
      <View style={{ width: iconSize, height: iconSize }}>
        <Image
          source={LINE_SEGMENT_ICON}
          style={{ width: iconSize, height: iconSize, tintColor: buttonColors.icon }}
          contentFit="contain"
        />
        <View
          style={[
            styles.square,
            styles.cornerSquare,
            {
              left: iconSize * CORNER_SQUARE_CENTER_X - squareSize / 2,
              top: iconSize * CORNER_SQUARE_CENTER_Y - squareSize / 2,
              width: squareSize,
              height: squareSize,
            },
          ]}
        />
      </View>
    );
  } else {
    const squareSize = iconPx(DESIGN_SQUARE_SIZE);
    icon = <View style={[styles.square, { width: squareSize, height: squareSize }]} />;
  }

  return (
    <View style={disabled ? { opacity: DISABLED_OPACITY } : null}>
      <Button
        onPress={onPress}
        disabled={disabled}
        backgroundColor={buttonColors.background}
        shadowColor={themeColors.button.shadowColor}
        size={size}
        accessibilityLabel={
          accessibilityLabel ?? (recording ? "Pause recording" : "Record segment")
        }
      >
        {icon}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  square: {
    borderRadius: 2,
    backgroundColor: RECORDING_INDICATOR_COLOR,
  },
  cornerSquare: {
    position: "absolute",
  },
});
