import { MAPBOX_CUSTOM_LAYER_SLOT, MAPBOX_EMISSIVE_STRENGTH } from "@/constants/mapbox";
import { useMapOverlayColors } from "@/hooks/map/useMapOverlayColors";
import { parseStrokeColor } from "@/utils/minimap/pageMiniMapSegments";
import { FillLayer, LineLayer, ShapeSource } from "@rnmapbox/maps";
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
  /** A map block's imported polygon features, each tagged with its legend id. */
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
