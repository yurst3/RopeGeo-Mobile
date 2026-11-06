import { MAPBOX_CUSTOM_LAYER_SLOT, MAPBOX_EMISSIVE_STRENGTH } from "@/constants/mapbox";
import { useMapOverlayColors } from "@/hooks/map/useMapOverlayColors";
import {
  pagePointIconSymbolStyle,
  pagePointLabelSymbolStyle,
} from "@/utils/explore/mapMarkerLayerStyles";
import { pageMiniMapPointIconSize } from "@/utils/explore/routeMarkerIcons";
import { useRouteMarkerMetrics } from "@/utils/layout/routeMarkerLayout";
import {
  ROUTE_MARKER_IMAGE,
  ROUTE_MARKER_NATIVE_ASSET_IMAGES,
} from "@/utils/mapbox/nativeMarkerImages";
import { parseStrokeColor } from "@/utils/minimap/pageMiniMapSegments";
import { useMapMarkerTextFont } from "@/utils/theme/resolvers";
import { FillLayer, Images, LineLayer, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { useMemo } from "react";
import {
  LEGEND_ID_PROPERTY,
  LegendFeatureType,
  type LegendItem,
  type PolygonLegendItem,
} from "ropegeo-common/models";

const AREA_FILL_OPACITY = 0.25;
const AREA_BORDER_WIDTH = 2;

type ImportedFeaturesLayerProps = {
  /** A map block's imported point and polygon features, each tagged with its legend id. */
  features: readonly GeoJSON.Feature[];
  legend: Readonly<Record<string, LegendItem>>;
};

function legendIdOf(feature: GeoJSON.Feature): string | null {
  const id = feature.properties?.[LEGEND_ID_PROPERTY];
  return typeof id === "string" ? id : null;
}

/**
 * Imported polygons, filled and outlined in their legend item's colors (the same colors the map
 * legend shows), falling back to the map's line color. Render below line segments.
 */
export function ImportedAreasLayer({ features, legend }: ImportedFeaturesLayerProps) {
  const { focusedLineSegment } = useMapOverlayColors();
  const shape = useMemo((): GeoJSON.FeatureCollection<GeoJSON.Polygon> => {
    const areas: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
    for (const feature of features) {
      if (feature.geometry?.type !== "Polygon") continue;
      const legendId = legendIdOf(feature);
      const item = legendId != null ? legend[legendId] : undefined;
      if (item?.featureType !== LegendFeatureType.Polygon) continue;
      const { borderColor, fillColor } = item as PolygonLegendItem;
      areas.push({
        type: "Feature",
        geometry: feature.geometry,
        properties: {
          border: parseStrokeColor(borderColor ?? fillColor, focusedLineSegment),
          fill: parseStrokeColor(fillColor ?? borderColor, focusedLineSegment),
        },
      });
    }
    return { type: "FeatureCollection", features: areas };
  }, [features, legend, focusedLineSegment]);

  if (shape.features.length === 0) return null;
  return (
    <ShapeSource id="imported-areas" shape={shape}>
      <FillLayer
        id="imported-areas-fill"
        slot={MAPBOX_CUSTOM_LAYER_SLOT}
        style={{
          fillColor: ["get", "fill"],
          fillOpacity: AREA_FILL_OPACITY,
          fillEmissiveStrength: MAPBOX_EMISSIVE_STRENGTH,
        }}
      />
      <LineLayer
        id="imported-areas-border"
        slot={MAPBOX_CUSTOM_LAYER_SLOT}
        aboveLayerID="imported-areas-fill"
        style={{
          lineColor: ["get", "border"],
          lineWidth: AREA_BORDER_WIDTH,
          lineEmissiveStrength: MAPBOX_EMISSIVE_STRENGTH,
          lineJoin: "round",
        }}
      />
    </ShapeSource>
  );
}

/**
 * Imported points as page-minimap markers labeled with their legend item names. Render above
 * line segments.
 */
export function ImportedPointsLayer({ features, legend }: ImportedFeaturesLayerProps) {
  const overlay = useMapOverlayColors();
  const markerMetrics = useRouteMarkerMetrics();
  const markerTextFont = useMapMarkerTextFont();
  const shape = useMemo((): GeoJSON.FeatureCollection<GeoJSON.Point> => {
    const points: GeoJSON.Feature<GeoJSON.Point>[] = [];
    for (const feature of features) {
      if (feature.geometry?.type !== "Point") continue;
      const legendId = legendIdOf(feature);
      const item = legendId != null ? legend[legendId] : undefined;
      if (item == null) continue;
      points.push({
        type: "Feature",
        geometry: feature.geometry,
        properties: { name: item.name },
      });
    }
    return { type: "FeatureCollection", features: points };
  }, [features, legend]);

  const iconStyle = useMemo(
    () =>
      pagePointIconSymbolStyle(
        overlay.marker,
        ROUTE_MARKER_IMAGE,
        pageMiniMapPointIconSize(null, markerMetrics.iconSizeScale),
      ),
    [overlay.marker, markerMetrics.iconSizeScale],
  );
  const labelStyle = useMemo(
    () => pagePointLabelSymbolStyle(overlay.marker, markerMetrics, markerTextFont),
    [overlay.marker, markerMetrics, markerTextFont],
  );

  if (shape.features.length === 0) return null;
  return (
    <>
      <Images nativeAssetImages={[...ROUTE_MARKER_NATIVE_ASSET_IMAGES]} />
      <ShapeSource id="imported-points" shape={shape}>
        <SymbolLayer
          id="imported-points-label"
          slot={MAPBOX_CUSTOM_LAYER_SLOT}
          style={labelStyle}
        />
        <SymbolLayer
          id="imported-points-icon"
          slot={MAPBOX_CUSTOM_LAYER_SLOT}
          style={iconStyle}
        />
      </ShapeSource>
    </>
  );
}
