import { RECORDING_INDICATOR_COLOR } from "@/constants/tripReport/recording";
import { shadeColor } from "@/utils/color/shadeColor";
import { useEffect } from "react";
import {
  cancelAnimation,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

/** One full recording pulse: dimmed → full red → dimmed. */
const RECORDING_PULSE_CYCLE_MS = 3000;
/** How much black is mixed into the red at the dim end of the pulse. */
const RECORDING_PULSE_DIM_BLACK_RATIO = 0.5;

/**
 * Pulse progress (0 = dim, 1 = full red) that loops while `active`. Create it once and share it so
 * every recording indicator (map border, legend dot) pulses in step.
 */
export function useRecordingPulse(active: boolean): SharedValue<number> {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    const half = RECORDING_PULSE_CYCLE_MS / 2;
    progress.value = 0;
    progress.value = withRepeat(
      withSequence(withTiming(1, { duration: half }), withTiming(0, { duration: half })),
      -1,
    );
    return () => cancelAnimation(progress);
  }, [active, progress]);

  return progress;
}

const RECORDING_PULSE_DIM_COLOR = shadeColor(
  RECORDING_INDICATOR_COLOR,
  RECORDING_PULSE_DIM_BLACK_RATIO,
);

/** The recording red and its dimmed (half black) end of the pulse. */
export function useRecordingPulseColors(): { fullColor: string; dimColor: string } {
  return { fullColor: RECORDING_INDICATOR_COLOR, dimColor: RECORDING_PULSE_DIM_COLOR };
}
