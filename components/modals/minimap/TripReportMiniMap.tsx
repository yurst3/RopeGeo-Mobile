import { MiniMapAnimatedCard } from "@/components/modals/minimap/miniMapAnimatedCard";
import {
  TripReportMiniMapView,
  type TripReportMiniMapViewProps,
} from "@/components/modals/minimap/TripReportMiniMapView";
import type { RefObject } from "react";
import type { View } from "react-native";

export type TripReportMiniMapProps = TripReportMiniMapViewProps & {
  mountNativeMap: boolean;
  expanded: boolean;
  /** Fullscreen frame the map expands into. */
  expandAnchorRef: RefObject<View | null>;
  /** The collapsed map's slot, measured at the start of expand and collapse. */
  collapsedMeasureRef: RefObject<View | null>;
  onExpand: () => void;
  onCollapse: () => void;
};

/** Trip report minimap: the shared expandable card around {@link TripReportMiniMapView}. */
export function TripReportMiniMap({
  segments,
  features,
  legend,
  recording,
  blockedByOtherRecording,
  onToggleRecording,
  recordingSegmentId,
  onToggleSegmentRecording,
  onAddSegment,
  locationDisabled,
  onUpdateSegment,
  onRemoveSegment,
  ...cardProps
}: TripReportMiniMapProps) {
  return (
    <MiniMapAnimatedCard {...cardProps}>
      <TripReportMiniMapView
        segments={segments}
        features={features}
        legend={legend}
        recording={recording}
        blockedByOtherRecording={blockedByOtherRecording}
        onToggleRecording={onToggleRecording}
        recordingSegmentId={recordingSegmentId}
        onToggleSegmentRecording={onToggleSegmentRecording}
        onAddSegment={onAddSegment}
        locationDisabled={locationDisabled}
        onUpdateSegment={onUpdateSegment}
        onRemoveSegment={onRemoveSegment}
      />
    </MiniMapAnimatedCard>
  );
}
