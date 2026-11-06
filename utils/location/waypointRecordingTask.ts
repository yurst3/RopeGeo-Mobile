import type { WaypointRecordingSettings } from "@/constants/settings";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { waypointRecordingStore } from "./waypointRecordingStore";

export const WAYPOINT_RECORDING_TASK = "ropegeo-waypoint-recording";

/** `background` uses the OS location task; `foreground` only works while RopeGeo is on screen. */
export type WaypointRecordingMode = "background" | "foreground";

let taskDefined = false;
let foregroundSubscription: Location.LocationSubscription | null = null;

/** Must run at app startup so the OS can deliver updates to the task after a relaunch. */
export function ensureWaypointRecordingTaskDefined(): void {
  if (taskDefined) return;
  taskDefined = true;

  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
    WAYPOINT_RECORDING_TASK,
    async ({ data, error }) => {
      if (error != null) {
        console.warn("[WaypointRecordingTask] location error", error);
        return;
      }
      if (data?.locations != null) waypointRecordingStore.push(data.locations);
    },
  );
}

function sharedOptions(settings: WaypointRecordingSettings) {
  return {
    accuracy: Location.Accuracy.High,
    timeInterval: settings.intervalSeconds * 1000,
    distanceInterval: settings.deadzoneMeters,
  };
}

/** Starts (or restarts with new settings) the location updates that feed the recording store. */
export async function startWaypointLocationUpdates(
  settings: WaypointRecordingSettings,
  mode: WaypointRecordingMode,
): Promise<void> {
  await stopWaypointLocationUpdates();
  if (mode === "background") {
    ensureWaypointRecordingTaskDefined();
    await Location.startLocationUpdatesAsync(WAYPOINT_RECORDING_TASK, {
      ...sharedOptions(settings),
      activityType: Location.ActivityType.Fitness,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Recording segment",
        notificationBody: "RopeGeo is adding your location to a trip report map.",
      },
    });
    return;
  }
  foregroundSubscription = await Location.watchPositionAsync(
    sharedOptions(settings),
    (location) => waypointRecordingStore.push([location]),
  );
}

export async function stopWaypointLocationUpdates(): Promise<void> {
  foregroundSubscription?.remove();
  foregroundSubscription = null;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(WAYPOINT_RECORDING_TASK)) {
      await Location.stopLocationUpdatesAsync(WAYPOINT_RECORDING_TASK);
    }
  } catch (error) {
    console.warn("[WaypointRecordingTask] stop failed", error);
  }
}

ensureWaypointRecordingTaskDefined();
