import { useSettings } from "@/context/app/SettingsContext";
import { requestRecordingPermission } from "@/utils/location/recordingPermission";
import { waypointRecordingStore } from "@/utils/location/waypointRecordingStore";
import {
  startWaypointLocationUpdates,
  stopWaypointLocationUpdates,
  type WaypointRecordingMode,
} from "@/utils/location/waypointRecordingTask";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { TripReportWaypoint } from "ropegeo-common/models";

type TripReportRecordingContextValue = {
  /** The map block currently recording, or null. Only one block records at a time. */
  recordingMapBlockId: string | null;
  /**
   * The segment of {@link recordingMapBlockId} being recorded, or null for the block's active (last)
   * segment.
   */
  recordingSegmentId: string | null;
  /**
   * Asks for location access if needed, then records into `segmentId` of `mapBlockId`, or its active
   * segment when `segmentId` is null. Any other recording stops first. `lastWaypoint` is the
   * segment's last point, so the deadzone and interval apply from it. Does nothing when location
   * access is denied.
   */
  startRecording: (
    mapBlockId: string,
    lastWaypoint: TripReportWaypoint | null,
    segmentId?: string | null,
  ) => Promise<void>;
  pauseRecording: () => void;
  /** Pauses only if `mapBlockId` is the one recording (e.g. when that block is removed). */
  pauseRecordingFor: (mapBlockId: string) => void;
};

const TripReportRecordingContext = createContext<TripReportRecordingContextValue | null>(null);

export function TripReportRecordingProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const waypointSettings = settings.waypointRecording;
  const [recordingMapBlockId, setRecordingMapBlockId] = useState<string | null>(null);
  const [recordingSegmentId, setRecordingSegmentId] = useState<string | null>(null);
  const modeRef = useRef<WaypointRecordingMode | null>(null);
  const startingRef = useRef(false);
  const waypointSettingsRef = useRef(waypointSettings);
  waypointSettingsRef.current = waypointSettings;

  const pauseRecording = useCallback(() => {
    modeRef.current = null;
    waypointRecordingStore.stop();
    setRecordingMapBlockId(null);
    setRecordingSegmentId(null);
    void stopWaypointLocationUpdates();
  }, []);

  const startRecording = useCallback(
    async (
      mapBlockId: string,
      lastWaypoint: TripReportWaypoint | null,
      segmentId: string | null = null,
    ) => {
      if (startingRef.current) return;
      startingRef.current = true;
      try {
        const permission = await requestRecordingPermission();
        if (permission !== "background" && permission !== "foregroundOnly") return;
        const mode: WaypointRecordingMode =
          permission === "background" ? "background" : "foreground";
        const current = waypointSettingsRef.current;
        waypointRecordingStore.start(mapBlockId, lastWaypoint, current);
        modeRef.current = mode;
        setRecordingMapBlockId(mapBlockId);
        setRecordingSegmentId(segmentId);
        await startWaypointLocationUpdates(current, mode);
      } catch (error) {
        console.warn("[TripReportRecording] start failed", error);
        pauseRecording();
      } finally {
        startingRef.current = false;
      }
    },
    [pauseRecording],
  );

  const pauseRecordingFor = useCallback(
    (mapBlockId: string) => {
      if (waypointRecordingStore.recordingMapBlockId === mapBlockId) pauseRecording();
    },
    [pauseRecording],
  );

  // Restart location updates when the global waypoint settings change mid-recording.
  useEffect(() => {
    waypointRecordingStore.updateSettings(waypointSettings);
    const mode = modeRef.current;
    if (mode == null) return;
    void startWaypointLocationUpdates(waypointSettings, mode).catch((error) => {
      console.warn("[TripReportRecording] restart failed", error);
    });
  }, [waypointSettings]);

  useEffect(() => pauseRecording, [pauseRecording]);

  const value = useMemo<TripReportRecordingContextValue>(
    () => ({
      recordingMapBlockId,
      recordingSegmentId,
      startRecording,
      pauseRecording,
      pauseRecordingFor,
    }),
    [recordingMapBlockId, recordingSegmentId, startRecording, pauseRecording, pauseRecordingFor],
  );

  return (
    <TripReportRecordingContext.Provider value={value}>
      {children}
    </TripReportRecordingContext.Provider>
  );
}

export function useTripReportRecording(): TripReportRecordingContextValue {
  const ctx = useContext(TripReportRecordingContext);
  if (ctx == null) {
    throw new Error("useTripReportRecording must be used within TripReportRecordingProvider");
  }
  return ctx;
}
