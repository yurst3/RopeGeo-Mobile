import {
  DEFAULT_WAYPOINT_RECORDING,
  type WaypointRecordingSettings,
} from "@/constants/settings";
import type { LocationObject } from "expo-location";
import type { TripReportWaypoint } from "ropegeo-common/models";
import { acceptWaypointFix, type LastAcceptedWaypoint } from "./acceptWaypointFix";

type Listener = () => void;

/**
 * Hands location fixes from the location task (which runs outside React) to the map block that is
 * recording. Accepted waypoints wait here until that block drains them. Memory only: if the OS
 * kills the app, the unsaved waypoints are lost with it.
 */
class WaypointRecordingStore {
  private mapBlockId: string | null = null;
  private settings: WaypointRecordingSettings = DEFAULT_WAYPOINT_RECORDING;
  private last: LastAcceptedWaypoint | null = null;
  private readonly pending = new Map<string, TripReportWaypoint[]>();
  private readonly listeners = new Set<Listener>();

  get recordingMapBlockId(): string | null {
    return this.mapBlockId;
  }

  /** `lastWaypoint` is the active segment's last point, so resuming respects the deadzone. */
  start(
    mapBlockId: string,
    lastWaypoint: TripReportWaypoint | null,
    settings: WaypointRecordingSettings,
  ): void {
    this.mapBlockId = mapBlockId;
    this.settings = settings;
    this.last = lastWaypoint == null ? null : { waypoint: lastWaypoint, timeMs: null };
  }

  stop(): void {
    this.mapBlockId = null;
    this.last = null;
  }

  updateSettings(settings: WaypointRecordingSettings): void {
    this.settings = settings;
  }

  push(locations: LocationObject[]): void {
    const mapBlockId = this.mapBlockId;
    if (mapBlockId == null) return;
    const ordered = [...locations].sort((a, b) => a.timestamp - b.timestamp);
    const accepted: TripReportWaypoint[] = [];
    for (const location of ordered) {
      const fix = {
        waypoint: [location.coords.longitude, location.coords.latitude] as const,
        timeMs: location.timestamp,
        accuracyMeters: location.coords.accuracy,
      };
      if (!acceptWaypointFix(this.last, fix, this.settings)) continue;
      accepted.push(fix.waypoint);
      this.last = { waypoint: fix.waypoint, timeMs: fix.timeMs };
    }
    if (accepted.length === 0) return;
    this.pending.set(mapBlockId, [...(this.pending.get(mapBlockId) ?? []), ...accepted]);
    for (const listener of this.listeners) listener();
  }

  /** Returns and clears the waypoints waiting for `mapBlockId`. */
  drain(mapBlockId: string): TripReportWaypoint[] {
    const waypoints = this.pending.get(mapBlockId) ?? [];
    this.pending.delete(mapBlockId);
    return waypoints;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const waypointRecordingStore = new WaypointRecordingStore();
