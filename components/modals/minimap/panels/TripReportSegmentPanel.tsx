import {
  RecordLineSegmentButton,
  useRecordLineSegmentButtonSize,
} from "@/components/buttons/standard/RecordLineSegmentButton";
import { RecordSettingsButton } from "@/components/buttons/standard/RecordSettingsButton";
import { LineStyleSelector } from "@/components/lineSegments/LineStyleSelector";
import { LineThicknessSelector } from "@/components/lineSegments/LineThicknessSelector";
import { TripReportColorSelector } from "@/components/lineSegments/TripReportColorSelector";
import {
  LINE_SEGMENT_WIDTHS,
  lineSegmentColorValue,
} from "@/constants/tripReport/lineSegmentAppearance";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { Alert, StyleSheet, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { TripReportLineSegment } from "ropegeo-common/models";
import { DESIGN_RECORDING_DOT_SIZE, RecordingDot } from "../shared/RecordingDot";
import {
  TripReportEditPanel,
  TripReportEditPanelDeleteButton,
  TripReportEditPanelNameInput,
  TripReportEditPanelSection,
} from "./TripReportEditPanel";

/** Space between the record button and the top of the panel card. */
const RECORD_BUTTON_GAP = 8;

export type TripReportSegmentPanelProps = {
  segment: TripReportLineSegment;
  /** Tallest the panel gets, including the record button above it. */
  maxHeight: number;
  leftOffset: number;
  /** Distance from the window's right edge (positions the card left of the legend). */
  rightOffset: number;
  bottomOffset: number;
  /** Wait before sliding in, e.g. for the previous panel to finish sliding out. */
  enterDelayMs?: number;
  /** This segment is the one being recorded: the record button shows pause. */
  recording: boolean;
  /** Shared pulse driving the title's recording dot, so it stays in step with the map's border. */
  recordingPulse: SharedValue<number>;
  /** Starts recording this segment, or pauses it while it's recording. */
  onToggleRecording: () => void;
  /** Disables the record button, e.g. without location access. */
  recordDisabled: boolean;
  /** Opens the waypoint recording settings. */
  onOpenRecordSettings: () => void;
  onUpdate: (update: (segment: TripReportLineSegment) => TripReportLineSegment) => void;
  onDelete: () => void;
};

/**
 * Editor for the line segment selected in the trip report legend: name, color, line style, and
 * thickness, plus delete. A record button floats above its left edge, riding along as it expands
 * and collapses.
 */
export function TripReportSegmentPanel({
  segment,
  maxHeight,
  leftOffset,
  rightOffset,
  bottomOffset,
  enterDelayMs,
  recording,
  recordingPulse,
  onToggleRecording,
  recordDisabled,
  onOpenRecordSettings,
  onUpdate,
  onDelete,
}: TripReportSegmentPanelProps) {
  const recordingDotSize = Math.round(DESIGN_RECORDING_DOT_SIZE * useResolvedIconSizeScale());
  // The record button floats above the card, so it counts toward the panel's maximum height.
  const recordButtonSize = useRecordLineSegmentButtonSize();
  const segmentColor = lineSegmentColorValue(segment.color);

  const confirmDelete = () => {
    const count = segment.waypoints.length;
    Alert.alert(
      "Delete segment?",
      `"${segment.name}" and its ${count} ${count === 1 ? "waypoint" : "waypoints"} will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ],
    );
  };

  return (
    <TripReportEditPanel
      title="Edit Segment"
      titleAccessory={
        recording ? <RecordingDot size={recordingDotSize} progress={recordingPulse} /> : null
      }
      itemLabel="segment"
      aboveCard={
        <View style={styles.recordButtonRow} pointerEvents="box-none">
          <RecordLineSegmentButton
            recording={recording}
            onPress={onToggleRecording}
            disabled={recordDisabled}
          />
          <RecordSettingsButton onPress={onOpenRecordSettings} />
        </View>
      }
      aboveCardHeight={recordButtonSize + RECORD_BUTTON_GAP}
      maxHeight={maxHeight}
      leftOffset={leftOffset}
      rightOffset={rightOffset}
      bottomOffset={bottomOffset}
      enterDelayMs={enterDelayMs}
    >
      {(contentWidth) => (
        <>
          <TripReportEditPanelNameInput
            itemId={segment.id}
            savedName={segment.name}
            onSaveName={(name) => onUpdate((current) => current.withName(name))}
            contentWidth={contentWidth}
            placeholder="Segment name"
          />
          <TripReportEditPanelSection label="Color">
            <TripReportColorSelector
              value={segment.color}
              originalColor={segment.originalColor}
              onChange={(color) => onUpdate((current) => current.withColor(color))}
            />
          </TripReportEditPanelSection>
          <TripReportEditPanelSection label="Style">
            <LineStyleSelector
              value={segment.style}
              onChange={(style) => onUpdate((current) => current.withStyle(style))}
              previewColor={segmentColor}
              previewThickness={LINE_SEGMENT_WIDTHS[segment.thickness]}
            />
          </TripReportEditPanelSection>
          <TripReportEditPanelSection label="Thickness">
            <LineThicknessSelector
              value={segment.thickness}
              onChange={(thickness) => onUpdate((current) => current.withThickness(thickness))}
              previewColor={segmentColor}
              previewStyle={segment.style}
            />
          </TripReportEditPanelSection>
          <TripReportEditPanelDeleteButton label="Delete Segment" onPress={confirmDelete} />
        </>
      )}
    </TripReportEditPanel>
  );
}

const styles = StyleSheet.create({
  recordButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: RECORD_BUTTON_GAP,
    marginBottom: RECORD_BUTTON_GAP,
  },
});
