import { MAPBOX_CUSTOM_LAYER_SLOT } from "@/constants/mapbox";
import {
  isLightLineSegmentColor,
  lineSegmentColorValue,
} from "@/constants/tripReport/lineSegmentAppearance";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useMapOverlayColors } from "@/hooks/map/useMapOverlayColors";
import { tripReportMarkerSymbolStyle } from "@/utils/explore/mapMarkerLayerStyles";
import {
  ROUTE_MARKER_ICON_SIZE_AT_ZOOM_0,
  ROUTE_MARKER_SDF_CONTENT_SIZE,
  SELECTED_ROUTE_MARKER_ICON_SIZE_MULTIPLIER,
  selectedPointIconSize,
} from "@/utils/explore/routeMarkerIcons";
import { useRouteMarkerMetrics } from "@/utils/layout/routeMarkerLayout";
import { TRIP_REPORT_MARKER_IMAGES, TRIP_REPORT_MARKER_NATIVE_ASSET_IMAGES } from "@/utils/mapbox/nativeMarkerImages";
import { useMapMarkerTextFont } from "@/utils/theme/resolvers";
import { Images, ShapeSource, SymbolLayer, type SymbolLayerStyle } from "@rnmapbox/maps";
import { useMemo } from "react";
import type { TripReportMarker } from "ropegeo-common/models";
import { MoveArrowsLayer, moveArrowReach } from "./MoveArrowsLayer";

/** Trip report markers are drawn this much larger than route markers, so their symbols read. */
const TRIP_REPORT_MARKER_SIZE_SCALE = 1.5;

/** The layer drawing the markers; its features carry the marker's id as `markerId`. */
export const TRIP_REPORT_MARKERS_LAYER_ID = "trip-report-markers-symbol";

/** Share of the marker image's width the pin takes up. */
const PIN_WIDTH_FRACTION = 0.6;

/**
 * The selected marker's on-screen size, in points: `markerWidth` is the width (and height) of its
 * marker image, which sits with its bottom edge on the point; `side`, `above`, and `below` are how
 * far its pin and move arrows reach from the point. `iconSizeScale` is the route marker metrics'
 * scale.
 */
export function selectedMarkerExtents(iconSizeScale: number) {
  const markerWidth =
    ROUTE_MARKER_SDF_CONTENT_SIZE *
    ROUTE_MARKER_ICON_SIZE_AT_ZOOM_0 *
    iconSizeScale *
    TRIP_REPORT_MARKER_SIZE_SCALE *
    SELECTED_ROUTE_MARKER_ICON_SIZE_MULTIPLIER;
  const arrowReach = moveArrowReach(iconSizeScale);
  return {
    markerWidth,
    side: Math.max((markerWidth * PIN_WIDTH_FRACTION) / 2, arrowReach),
    above: Math.max(markerWidth, arrowReach),
    below: arrowReach,
  };
}

/**
 * A map block's markers, each in its own color and icon and labeled with its name, drawn larger
 * than route markers. Outlines match line segments: light colors get `lightLineOutline`. The
 * selected marker is drawn larger, without its label, and with pulsing arrows pointing out from
 * its point in each direction; the arrows sit behind the markers, so the up arrow doesn't cover
 * the pin. Render above line segments.
 */
export function TripReportMarkersLayer({
  markers,
  selectedMarkerId,
  hiddenMarkerId = null,
}: {
  markers: readonly TripReportMarker[];
  selectedMarkerId: string | null;
  /** Left off the map, along with its arrows, e.g. while it's drawn under the finger instead. */
  hiddenMarkerId?: string | null;
}) {
  const overlay = useMapOverlayColors();
  const { lineCasing, lightLineOutline } = useColorTheme().map.minimap.recordedSegment;
  const markerMetrics = useRouteMarkerMetrics();
  const markerTextFont = useMapMarkerTextFont();

  const shape = useMemo(
    (): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
      type: "FeatureCollection",
      features: markers
        .filter((marker) => marker.id !== hiddenMarkerId)
        .map((marker) => ({
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
    [markers, hiddenMarkerId, lineCasing, lightLineOutline],
  );

  const style = useMemo((): SymbolLayerStyle => {
    const base = tripReportMarkerSymbolStyle(
      overlay.marker,
      selectedPointIconSize(
        "markerId",
        selectedMarkerId,
        markerMetrics.iconSizeScale * TRIP_REPORT_MARKER_SIZE_SCALE,
      ),
      markerMetrics,
      markerTextFont,
    );
    if (selectedMarkerId == null) return base;
    // The down arrow would sit under the selected marker's label.
    return {
      ...base,
      textField: ["case", ["==", ["get", "markerId"], selectedMarkerId], "", ["get", "name"]],
    };
  }, [overlay.marker, selectedMarkerId, markerMetrics, markerTextFont]);

  const selectedPosition =
    selectedMarkerId != null && selectedMarkerId !== hiddenMarkerId
      ? (shape.features.find((feature) => feature.properties?.markerId === selectedMarkerId)
          ?.geometry.coordinates as [number, number] | undefined) ?? null
      : null;

  // Hiding the only marker keeps the layers mounted, so it reappears without re-adding them.
  if (markers.length === 0) return null;
  return (
    <>
      <Images nativeAssetImages={TRIP_REPORT_MARKER_NATIVE_ASSET_IMAGES} />
      <ShapeSource id="trip-report-markers" shape={shape}>
        <SymbolLayer id={TRIP_REPORT_MARKERS_LAYER_ID} slot={MAPBOX_CUSTOM_LAYER_SLOT} style={style} />
      </ShapeSource>
      <MoveArrowsLayer
        sourceId="trip-report-marker-move-arrows"
        position={selectedPosition}
        belowLayerID={TRIP_REPORT_MARKERS_LAYER_ID}
      />
    </>
  );
}
