import Animated, {
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { useRecordingPulseColors } from "./recordingPulse";

/** Design size of the dot before icon scaling. */
export const DESIGN_RECORDING_DOT_SIZE = 12;

/** Red dot pulsing with the recording border; marks the segment being recorded. */
export function RecordingDot({ size, progress }: { size: number; progress: SharedValue<number> }) {
  const { fullColor, dimColor } = useRecordingPulseColors();
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [dimColor, fullColor]),
  }));
  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size / 2 }, animatedStyle]}
      accessibilityLabel="Recording"
    />
  );
}
