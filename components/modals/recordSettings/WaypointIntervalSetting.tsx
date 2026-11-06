import { RecordSettingSlider } from "@/components/modals/recordSettings/RecordSettingSlider";
import {
  WAYPOINT_INTERVAL_STEPS_SECONDS,
  formatWaypointInterval,
  nearestWaypointIntervalIndex,
} from "@/constants/settings";
import { useSettings } from "@/context/app/SettingsContext";

/** "Waypoint Interval" slider: 5–60 seconds by 5 seconds, then 2–10 minutes by 1 minute. */
export function WaypointIntervalSetting() {
  const { settings, setWaypointRecording } = useSettings();

  return (
    <RecordSettingSlider
      title="Waypoint Interval"
      description="How often a new waypoint is created while recording. Lower interval values will have waypoints created more frequently and higher values less frequently."
      stepCount={WAYPOINT_INTERVAL_STEPS_SECONDS.length}
      savedIndex={nearestWaypointIntervalIndex(settings.waypointRecording.intervalSeconds)}
      formatStep={(index) => formatWaypointInterval(WAYPOINT_INTERVAL_STEPS_SECONDS[index])}
      onCommit={(index) =>
        setWaypointRecording({ intervalSeconds: WAYPOINT_INTERVAL_STEPS_SECONDS[index] })
      }
    />
  );
}
