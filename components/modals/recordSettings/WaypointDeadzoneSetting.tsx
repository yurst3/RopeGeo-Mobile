import { RecordSettingSlider } from "@/components/modals/recordSettings/RecordSettingSlider";
import {
  WAYPOINT_DEADZONE_STEP_COUNT,
  formatWaypointDeadzoneStep,
  nearestWaypointDeadzoneIndex,
  waypointDeadzoneStepMeters,
} from "@/constants/settings";
import { useSettings } from "@/context/app/SettingsContext";

/**
 * "Last Waypoint Deadzone" slider: 0–100 m by 5 m with metric units, otherwise 0–300 ft by
 * 15 ft. Always saved in meters.
 */
export function WaypointDeadzoneSetting() {
  const { settings, setWaypointRecording } = useSettings();
  const units = settings.lengthMeasurementSystem;

  return (
    <RecordSettingSlider
      title="Last Waypoint Deadzone"
      description="Minimum distance from the last waypoint at which a new waypoint can be created. While inside the deadzone, waypoint creation is paused until you leave it."
      stepCount={WAYPOINT_DEADZONE_STEP_COUNT}
      savedIndex={nearestWaypointDeadzoneIndex(settings.waypointRecording.deadzoneMeters, units)}
      formatStep={(index) => formatWaypointDeadzoneStep(index, units)}
      onCommit={(index) =>
        setWaypointRecording({ deadzoneMeters: waypointDeadzoneStepMeters(index, units) })
      }
    />
  );
}
