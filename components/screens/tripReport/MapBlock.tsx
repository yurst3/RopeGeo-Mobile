import { TripReportMiniMap } from "@/components/modals/minimap/TripReportMiniMap";
import { CornerRemoveButton } from "@/components/screens/tripReport/CornerRemoveButton";
import { RecordingPermissionNotice } from "@/components/screens/tripReport/RecordingPermissionNotice";
import { useTripReportRecording } from "@/components/screens/tripReport/TripReportRecordingContext";
import { UploadMapFileArea } from "@/components/screens/tripReport/UploadMapFileArea";
import {
  MINI_MAP_BORDER_RADIUS,
  MINI_MAP_EXPANDED_Z_INDEX,
} from "@/components/modals/minimap/shared/minimapShared";
import { defaultLineColorForLightPreset } from "@/constants/tripReport/lineSegmentAppearance";
import { useSettings } from "@/context/app/SettingsContext";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useToast } from "@/context/ui/ToastContext";
import { useRecordingPermission } from "@/utils/location/recordingPermission";
import { waypointRecordingStore } from "@/utils/location/waypointRecordingStore";
import {
  uploadMapFile,
  useMapFileUploadDelivery,
  useMapFileUploadInProgress,
} from "@/utils/tripReport/mapFileUpload";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { StyleSheet, View } from "react-native";
import type {
  TripReportLineColor,
  TripReportLineSegment,
  TripReportMapBlock,
  TripReportWaypoint,
} from "ropegeo-common/models";

const OUTLINE_PADDING = 8;
const DESIGN_REMOVE_BUTTON_SIZE = 24;
/** How far the X button hangs past the block's top-right corner. */
const REMOVE_BUTTON_OFFSET = 12;

export type MapBlockProps = {
  /** The trip report this block belongs to; uploads finishing off screen are saved into it. */
  tripReportId: string;
  block: TripReportMapBlock;
  onChange: (update: (block: TripReportMapBlock) => TripReportMapBlock) => void;
  /** Fullscreen frame the map expands into (the screen root). */
  expandAnchorRef: RefObject<View | null>;
  /** Lets the screen pause scrolling and hide its chrome while the map is fullscreen. */
  onExpandedChange: (expanded: boolean) => void;
  onRemove: () => void;
};

function appendWaypoints(
  block: TripReportMapBlock,
  waypoints: TripReportWaypoint[],
  newSegmentColor: TripReportLineColor,
): TripReportMapBlock {
  return waypoints.reduce(
    (current, point) => current.withWaypointAppendedToActive(point, newSegmentColor),
    block,
  );
}

/**
 * Trip report map section: a {@link TripReportMiniMap} inside a dashed, rounded outline, with a
 * corner X to remove it while collapsed. While this block holds the recording lock, recorded
 * waypoints are appended to the segment being recorded: its active (last) segment from the record
 * button, or the segment chosen in the segment panel. Map files uploaded from below the map are
 * merged in when they finish processing.
 */
export function MapBlock({
  tripReportId,
  block,
  onChange,
  expandAnchorRef,
  onExpandedChange,
  onRemove,
}: MapBlockProps) {
  const { preview, map } = useColorTheme();
  const { settings } = useSettings();
  const mapSlotRef = useRef<View>(null);
  const [expanded, setExpanded] = useState(false);
  const {
    recordingMapBlockId,
    recordingSegmentId,
    startRecording,
    pauseRecording,
    pauseRecordingFor,
  } = useTripReportRecording();
  const permission = useRecordingPermission();
  const blockId = block.id;
  const recording = recordingMapBlockId === blockId;
  const blockedByOtherRecording = recordingMapBlockId != null && !recording;
  /** The segment receiving recorded waypoints, or null when this block isn't recording. */
  const recordedSegmentId = recording
    ? (recordingSegmentId ?? block.activeSegment?.id ?? null)
    : null;
  // Only follows the context while this block records, so waypoints flushed after recording moves
  // to another map still land on this block's segment.
  const recordingTargetRef = useRef<string | null>(null);
  if (recording) recordingTargetRef.current = recordingSegmentId;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // New segments contrast with the map's time of day at the moment they're created.
  const newSegmentColorRef = useRef<TripReportLineColor>("black");
  newSegmentColorRef.current = defaultLineColorForLightPreset(settings.mapLightPreset);

  const flushRecordedWaypoints = useCallback(() => {
    const waypoints = waypointRecordingStore.drain(blockId);
    if (waypoints.length === 0) return;
    const newSegmentColor = newSegmentColorRef.current;
    const targetSegmentId = recordingTargetRef.current;
    onChangeRef.current((current) =>
      targetSegmentId == null
        ? appendWaypoints(current, waypoints, newSegmentColor)
        : current.withSegmentUpdated(targetSegmentId, (segment) =>
            waypoints.reduce((next, point) => next.withWaypointAppended(point), segment),
          ),
    );
  }, [blockId]);

  useEffect(() => {
    if (!recording) return;
    flushRecordedWaypoints();
    const unsubscribe = waypointRecordingStore.subscribe(flushRecordedWaypoints);
    return () => {
      unsubscribe();
      flushRecordedWaypoints();
    };
  }, [recording, flushRecordedWaypoints]);

  useEffect(() => () => pauseRecordingFor(blockId), [blockId, pauseRecordingFor]);

  const toast = useToast();
  const uploadInProgress = useMapFileUploadInProgress();
  useMapFileUploadDelivery(blockId, onChange);
  const startMapFileUpload = () => {
    void uploadMapFile(
      { tripReportId, mapBlockId: blockId, newSegmentColor: newSegmentColorRef.current },
      toast,
    );
  };

  const toggleRecording = () => {
    if (recording) {
      pauseRecording();
    } else {
      void startRecording(blockId, block.activeSegment?.lastWaypoint ?? null);
    }
  };

  const locationGranted = permission === "background" || permission === "foregroundOnly";

  /**
   * Pauses `segmentId` if it's the segment being recorded; otherwise starts recording it,
   * continuing from its last waypoint. Recording anywhere else stops first, keeping the waypoints
   * recorded so far on the segment they were recorded for.
   */
  const toggleSegmentRecording = (segmentId: string) => {
    if (recordedSegmentId === segmentId) {
      pauseRecording();
      return;
    }
    const segment = block.segments.find((s) => s.id === segmentId);
    if (segment == null) return;
    if (recording) flushRecordedWaypoints();
    void startRecording(blockId, segment.lastWaypoint, segmentId);
  };

  /**
   * Starts a new segment at `waypoint`. While any map is recording, recording moves to the new
   * segment: this block's waypoints so far stay on the segment they were recorded on, and the
   * new segment's first waypoint becomes the starting point for the next ones.
   */
  const addSegmentAt = (waypoint: TripReportWaypoint) => {
    const newSegmentColor = newSegmentColorRef.current;
    if (recording) flushRecordedWaypoints();
    onChange((current) =>
      current.withNewSegment(newSegmentColor).withWaypointAppendedToActive(waypoint),
    );
    if (recordingMapBlockId != null) void startRecording(blockId, waypoint);
  };

  const updateSegment = (
    segmentId: string,
    update: (segment: TripReportLineSegment) => TripReportLineSegment,
  ) => onChange((current) => current.withSegmentUpdated(segmentId, update));

  const removeSegment = (segmentId: string) => {
    // Deleting the segment being recorded discards its unsaved waypoints and stops recording,
    // so they don't land on the previous segment.
    if (recordedSegmentId === segmentId) {
      waypointRecordingStore.drain(blockId);
      pauseRecording();
    }
    onChange((current) => current.withSegmentRemoved(segmentId));
  };

  const setExpandedAndNotify = useCallback(
    (next: boolean) => {
      setExpanded(next);
      onExpandedChange(next);
    },
    [onExpandedChange],
  );

  return (
    <View
      style={[
        styles.outline,
        { borderColor: preview.page.selectionOutline },
        expanded && styles.raised,
      ]}
    >
      <RecordingPermissionNotice permission={permission} />
      <View
        ref={mapSlotRef}
        collapsable={false}
        style={[
          styles.mapSlot,
          { backgroundColor: map.minimap.background },
          expanded ? styles.raised : styles.mapSlotClip,
        ]}
      >
        <TripReportMiniMap
          mountNativeMap
          expanded={expanded}
          expandAnchorRef={expandAnchorRef}
          collapsedMeasureRef={mapSlotRef}
          onExpand={() => setExpandedAndNotify(true)}
          onCollapse={() => setExpandedAndNotify(false)}
          segments={block.segments}
          features={block.features}
          legend={block.legend}
          recording={recording}
          blockedByOtherRecording={blockedByOtherRecording}
          onToggleRecording={toggleRecording}
          recordingSegmentId={recordedSegmentId}
          onToggleSegmentRecording={toggleSegmentRecording}
          onAddSegment={addSegmentAt}
          locationDisabled={!locationGranted}
          onUpdateSegment={updateSegment}
          onRemoveSegment={removeSegment}
        />
      </View>
      <View style={styles.divider}>
        <View style={[styles.dividerDashes, { borderColor: preview.page.selectionOutline }]} />
      </View>
      <UploadMapFileArea onPress={startMapFileUpload} disabled={uploadInProgress} />
      {!expanded ? (
        <CornerRemoveButton
          onPress={onRemove}
          accessibilityLabel="Remove map block"
          designSize={DESIGN_REMOVE_BUTTON_SIZE}
          offset={REMOVE_BUTTON_OFFSET}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outline: {
    alignSelf: "stretch",
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: OUTLINE_PADDING,
  },
  mapSlot: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
  },
  mapSlotClip: {
    overflow: "hidden",
    borderRadius: MINI_MAP_BORDER_RADIUS,
  },
  raised: {
    zIndex: MINI_MAP_EXPANDED_Z_INDEX,
    elevation: 1000,
  },
  // iOS can't dash a single border side, so the divider clips a fully dashed box to its top edge.
  divider: {
    height: 1,
    marginTop: OUTLINE_PADDING,
    marginHorizontal: -OUTLINE_PADDING,
    overflow: "hidden",
  },
  dividerDashes: {
    height: 2,
    borderWidth: 1,
    borderStyle: "dashed",
  },
});
