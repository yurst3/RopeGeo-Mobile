import { RecordSettingSlider } from "@/components/modals/recordSettings/RecordSettingSlider";
import {
  WAYPOINT_MAX_ACCURACY_STEP_COUNT,
  formatWaypointMaxAccuracyStep,
  nearestWaypointMaxAccuracyIndex,
  waypointMaxAccuracyStepMeters,
} from "@/constants/settings";
import { useSettings } from "@/context/app/SettingsContext";

/**
 * "Max Position Accuracy" slider: 5–100 m by 5 m with metric units, otherwise 15–300 ft by
 * 15 ft, with a last "∞" stop that accepts any accuracy. Always saved in meters (null for ∞).
 */
export function WaypointMaxAccuracySetting() {
  const { settings, setWaypointRecording } = useSettings();
  const units = settings.lengthMeasurementSystem;

  return (
    <RecordSettingSlider
      title="Max Position Accuracy"
      description="Maximum position accuracy at which waypoints can be created. Waypoint creation will be paused until your current position is accurate to within this vaue. Use a high value if you're deep within a canyon."
      stepCount={WAYPOINT_MAX_ACCURACY_STEP_COUNT}
      savedIndex={nearestWaypointMaxAccuracyIndex(
        settings.waypointRecording.maxAccuracyMeters,
        units,
      )}
      formatStep={(index) => formatWaypointMaxAccuracyStep(index, units)}
      onCommit={(index) =>
        setWaypointRecording({ maxAccuracyMeters: waypointMaxAccuracyStepMeters(index, units) })
      }
    />
  );
}
