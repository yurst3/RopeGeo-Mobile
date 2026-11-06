import type { WaypointRecordingSettings } from "@/constants/settings";
import { distanceMeters } from "@/utils/geo/distanceMeters";
import type { TripReportWaypoint } from "ropegeo-common/models";

export type WaypointFix = {
  waypoint: TripReportWaypoint;
  timeMs: number;
  /** Horizontal accuracy radius in meters, when the platform reports it. */
  accuracyMeters?: number | null;
};

export type LastAcceptedWaypoint = {
  waypoint: TripReportWaypoint;
  /** Null when resuming a segment whose last waypoint time isn't known. */
  timeMs: number | null;
};

/**
 * Whether a location fix becomes a waypoint: it must be accurate enough, and (after the first
 * waypoint) both the interval must have elapsed and the fix must be outside the deadzone.
 */
export function acceptWaypointFix(
  last: LastAcceptedWaypoint | null,
  fix: WaypointFix,
  settings: WaypointRecordingSettings,
): boolean {
  if (
    settings.maxAccuracyMeters != null &&
    fix.accuracyMeters != null &&
    fix.accuracyMeters > settings.maxAccuracyMeters
  ) {
    return false;
  }
  if (last == null) return true;
  const intervalElapsed =
    last.timeMs == null || fix.timeMs - last.timeMs >= settings.intervalSeconds * 1000;
  return (
    intervalElapsed && distanceMeters(last.waypoint, fix.waypoint) >= settings.deadzoneMeters
  );
}
