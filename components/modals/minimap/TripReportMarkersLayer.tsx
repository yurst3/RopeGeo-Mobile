import { MAPBOX_CUSTOM_LAYER_SLOT } from "@/constants/mapbox";
import {
  isLightLineSegmentColor,
  lineSegmentColorValue,
} from "@/constants/tripReport/lineSegmentAppearance";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useMapOverlayColors } from "@/hooks/map/useMapOverlayColors";
import { tripReportMarkerSymbolStyle } from "@/utils/explore/mapMarkerLayerStyles";
import { selectedPointIconSize } from "@/utils/explore/routeMarkerIcons";
import { useRouteMarkerMetrics } from "@/utils/layout/routeMarkerLayout";
import {
  TRIP_REPORT_MARKER_IMAGES,
  TRIP_REPORT_MARKER_NATIVE_ASSET_IMAGES,
} from "@/utils/mapbox/nativeMarkerImages";
import { useMapMarkerTextFont } from "@/utils/theme/resolvers";
import { Images, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { useMemo } from "react";
import type { TripReportMarker } from "ropegeo-common/models";

/** Trip report markers are drawn this much larger than route markers, so their symbols read. */
const TRIP_REPORT_MARKER_SIZE_SCALE = 1.5;

/** The layer drawing the markers; its features carry the marker's id as `markerId`. */
export const TRIP_REPORT_MARKERS_LAYER_ID = "trip-report-markers-symbol";

/**
 * A map block's markers, each in its own color and icon and labeled with its name, drawn larger
 * than route markers; the selected one is larger still. Outlines match line segments: light colors get `lightLineOutline`. Render
 * above line segments.
 */
export function TripReportMarkersLayer({
  markers,
  selectedMarkerId,
}: {
  markers: readonly TripReportMarker[];
  selectedMarkerId: string | null;
}) {
  const overlay = useMapOverlayColors();
  const { lineCasing, lightLineOutline } = useColorTheme().map.minimap.recordedSegment;
  const markerMetrics = useRouteMarkerMetrics();
  const markerTextFont = useMapMarkerTextFont();

  const shape = useMemo(
    (): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
      type: "FeatureCollection",
      features: markers.map((marker) => ({
        ...marker.toFeature(),
        properties: {
          markerId: marker.id,
          name: marker.name,
          icon: TRIP_REPORT_MARKER_IMAGES[marker.style],
          color: lineSegmentColorValue(marker.color),
          halo: isLightLineSegmentColor(marker.color) ? lightLineOutline : lineCasing,
        },
      })),
    }),
    [markers, lineCasing, lightLineOutline],
  );

  const style = useMemo(
    () =>
      tripReportMarkerSymbolStyle(
        overlay.marker,
        selectedPointIconSize(
          "markerId",
          selectedMarkerId,
          markerMetrics.iconSizeScale * TRIP_REPORT_MARKER_SIZE_SCALE,
        ),
        markerMetrics,
        markerTextFont,
      ),
    [overlay.marker, selectedMarkerId, markerMetrics, markerTextFont],
  );

  if (shape.features.length === 0) return null;
  return (
    <>
      <Images nativeAssetImages={TRIP_REPORT_MARKER_NATIVE_ASSET_IMAGES} />
      <ShapeSource id="trip-report-markers" shape={shape}>
        <SymbolLayer id={TRIP_REPORT_MARKERS_LAYER_ID} slot={MAPBOX_CUSTOM_LAYER_SLOT} style={style} />
      </ShapeSource>
    </>
  );
}
