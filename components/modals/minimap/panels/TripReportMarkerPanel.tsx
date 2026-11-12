import { TripReportColorSelector } from "@/components/lineSegments/TripReportColorSelector";
import { MarkerStyleSelector } from "@/components/markers/MarkerStyleSelector";
import { Alert } from "react-native";
import type { TripReportMarker } from "ropegeo-common/models";
import {
  TripReportEditPanel,
  TripReportEditPanelDeleteButton,
  TripReportEditPanelNameInput,
  TripReportEditPanelSection,
} from "./TripReportEditPanel";

export type TripReportMarkerPanelProps = {
  marker: TripReportMarker;
  /** Tallest the panel gets. */
  maxHeight: number;
  leftOffset: number;
  /** Distance from the window's right edge (positions the card left of the legend). */
  rightOffset: number;
  bottomOffset: number;
  /** Wait before sliding in, e.g. for the previous panel to finish sliding out. */
  enterDelayMs?: number;
  onUpdate: (update: (marker: TripReportMarker) => TripReportMarker) => void;
  onDelete: () => void;
};

/** Editor for the marker selected in the trip report legend: name, color, and icon, plus delete. */
export function TripReportMarkerPanel({
  marker,
  maxHeight,
  leftOffset,
  rightOffset,
  bottomOffset,
  enterDelayMs,
  onUpdate,
  onDelete,
}: TripReportMarkerPanelProps) {
  const confirmDelete = () => {
    Alert.alert("Delete marker?", `"${marker.name}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <TripReportEditPanel
      title="Edit Marker"
      itemLabel="marker"
      maxHeight={maxHeight}
      leftOffset={leftOffset}
      rightOffset={rightOffset}
      bottomOffset={bottomOffset}
      enterDelayMs={enterDelayMs}
    >
      {(contentWidth) => (
        <>
          <TripReportEditPanelNameInput
            itemId={marker.id}
            savedName={marker.name}
            onSaveName={(name) => onUpdate((current) => current.withName(name))}
            contentWidth={contentWidth}
            placeholder="Marker name"
          />
          <TripReportEditPanelSection label="Color">
            <TripReportColorSelector
              value={marker.color}
              originalColor={marker.originalColor}
              onChange={(color) => onUpdate((current) => current.withColor(color))}
            />
          </TripReportEditPanelSection>
          <TripReportEditPanelSection label="Icon">
            <MarkerStyleSelector
              value={marker.style}
              onChange={(style) => onUpdate((current) => current.withStyle(style))}
              previewColor={marker.color}
            />
          </TripReportEditPanelSection>
          <TripReportEditPanelDeleteButton label="Delete Marker" onPress={confirmDelete} />
        </>
      )}
    </TripReportEditPanel>
  );
}
