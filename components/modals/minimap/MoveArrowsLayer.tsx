import { MAPBOX_CUSTOM_LAYER_SLOT, MAPBOX_EMISSIVE_STRENGTH } from "@/constants/mapbox";
import {
  defaultLineColorForLightPreset,
  isLightLineSegmentColor,
  lineSegmentColorValue,
} from "@/constants/tripReport/lineSegmentAppearance";
import { useSettings } from "@/context/app/SettingsContext";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { MAP_MARKER_ICON_HALO_WIDTH } from "@/utils/explore/mapMarkerLayerStyles";
import {
  ROUTE_MARKER_ICON_SIZE_AT_ZOOM_0,
  ROUTE_MARKER_SDF_CONTENT_SIZE,
  routeMarkerIconSizeInterpolate,
} from "@/utils/explore/routeMarkerIcons";
import { useRouteMarkerMetrics } from "@/utils/layout/routeMarkerLayout";
import { MARKER_MOVE_ARROW_IMAGE } from "@/utils/mapbox/nativeMarkerImages";
import { Images, ShapeSource, SymbolLayer, type SymbolLayerStyle } from "@rnmapbox/maps";
import { useEffect, useMemo, useState } from "react";
import type { TripReportWaypoint } from "ropegeo-common/models";

/** Move arrows are drawn at this share of a route marker's size. */
const MOVE_ARROW_SIZE_SCALE = 0.7;
/**
 * Distance from the point to each arrow's center, in arrow image pixels (the arrow shape is 64 px
 * tall), so it scales with the arrows.
 */
const MOVE_ARROW_DISTANCE = 56;
/** One fade out and back in. */
const MOVE_ARROW_PULSE_MS = 2000;
const MOVE_ARROW_DIM_OPACITY = 0.25;
/** The arrow image points down (south); clockwise turns point it the other ways. */
const MOVE_ARROW_ROTATIONS = [0, 90, 180, 270];

/** How far the move arrows reach from their point, in points. */
export function moveArrowReach(iconSizeScale: number): number {
  return (
    (MOVE_ARROW_DISTANCE + ROUTE_MARKER_SDF_CONTENT_SIZE / 2) *
    ROUTE_MARKER_ICON_SIZE_AT_ZOOM_0 *
    iconSizeScale *
    MOVE_ARROW_SIZE_SCALE
  );
}

/** Toggles every half `periodMs` while `active`, for an opacity Mapbox eases between. */
function usePulse(active: boolean, periodMs: number): boolean {
  const [bright, setBright] = useState(true);
  useEffect(() => {
    setBright(true);
    if (!active) return;
    const interval = setInterval(() => setBright((current) => !current), periodMs / 2);
    return () => clearInterval(interval);
  }, [active, periodMs]);
  return bright;
}

/**
 * Four pulsing arrows pointing out from `position` in each cardinal direction. Black or white for
 * the map's time of day. When `belowLayerID` is set, the arrows sit under that layer so they don't
 * cover the thing being moved.
 */
export function MoveArrowsLayer({
  sourceId,
  position,
  belowLayerID,
}: {
  /** Unique ShapeSource id; several of these can appear on one map. */
  sourceId: string;
  position: TripReportWaypoint | null;
  belowLayerID?: string;
}) {
  const { lineCasing, lightLineOutline } = useColorTheme().map.minimap.recordedSegment;
  const markerMetrics = useRouteMarkerMetrics();
  const arrowsBright = usePulse(position != null, MOVE_ARROW_PULSE_MS);
  const arrowColor = defaultLineColorForLightPreset(useSettings().settings.mapLightPreset);

  const shape = useMemo(
    (): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
      type: "FeatureCollection",
      features:
        position == null
          ? []
          : MOVE_ARROW_ROTATIONS.map((rotation) => ({
              type: "Feature",
              geometry: { type: "Point", coordinates: [position[0], position[1]] },
              properties: { rotation },
            })),
    }),
    [position],
  );

  const style = useMemo(
    (): SymbolLayerStyle => ({
      iconImage: MARKER_MOVE_ARROW_IMAGE,
      iconSize: routeMarkerIconSizeInterpolate(
        markerMetrics.iconSizeScale * MOVE_ARROW_SIZE_SCALE,
      ),
      iconColor: lineSegmentColorValue(arrowColor),
      iconHaloColor: isLightLineSegmentColor(arrowColor) ? lightLineOutline : lineCasing,
      iconHaloWidth: MAP_MARKER_ICON_HALO_WIDTH,
      iconEmissiveStrength: MAPBOX_EMISSIVE_STRENGTH,
      iconOpacity: arrowsBright ? 1 : MOVE_ARROW_DIM_OPACITY,
      iconOpacityTransition: { duration: MOVE_ARROW_PULSE_MS / 2, delay: 0 },
      iconRotate: ["get", "rotation"],
      // Rotates with the icon, so every arrow sits this far out along the way it points.
      iconOffset: [0, MOVE_ARROW_DISTANCE],
      iconAllowOverlap: true,
      iconIgnorePlacement: true,
    }),
    [arrowColor, arrowsBright, lightLineOutline, lineCasing, markerMetrics.iconSizeScale],
  );

  if (position == null) return null;
  return (
    <>
      <Images nativeAssetImages={[{ name: MARKER_MOVE_ARROW_IMAGE, sdf: true }]} />
      <ShapeSource id={sourceId} shape={shape}>
        <SymbolLayer
          id={`${sourceId}-symbol`}
          slot={MAPBOX_CUSTOM_LAYER_SLOT}
          {...(belowLayerID != null ? { belowLayerID } : null)}
          style={style}
        />
      </ShapeSource>
    </>
  );
}
