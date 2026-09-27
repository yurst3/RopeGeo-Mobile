import {
  MAPBOX_CONTOUR_LAYER_IDS,
  MAPBOX_STYLE_IMPORT_ID,
} from "@/constants/mapbox";
import type { MapLightPreset } from "@/constants/settings/mapLayersTypes";
import { useSettings } from "@/context/app/SettingsContext";
import {
  StyleImport,
  LineLayer,
  SymbolLayer,
  type SymbolLayerStyle,
} from "@rnmapbox/maps";
import type { LengthMeasurementSystem } from "ropegeo-common/models";

const FEET_PER_METER = 3.28084;

/** Contour `ele` values from Mapbox Terrain are always meters. */
function contourLabelTextField(
  system: LengthMeasurementSystem,
): SymbolLayerStyle["textField"] {
  if (system === "Metric") {
    return ["concat", ["to-string", ["get", "ele"]], " m"];
  }
  return [
    "concat",
    ["to-string", ["round", ["*", ["get", "ele"], FEET_PER_METER]]],
    " ft",
  ];
}

type MapStyleLayersProps = {
  lightPreset: MapLightPreset;
  showElevationContours: boolean;
};

export function MapStyleImport({ lightPreset }: { lightPreset: MapLightPreset }) {
  return (
    <StyleImport
      id={MAPBOX_STYLE_IMPORT_ID}
      existing
      config={{ lightPreset }}
    />
  );
}

export function ElevationContourLayers({
  visible,
}: {
  visible: boolean;
}) {
  const { settings } = useSettings();
  const visibility = visible ? "visible" : "none";
  const textField = contourLabelTextField(settings.lengthMeasurementSystem);

  return (
    <>
      <LineLayer
        id={MAPBOX_CONTOUR_LAYER_IDS[0]}
        existing
        style={{ visibility }}
      />
      <LineLayer
        id={MAPBOX_CONTOUR_LAYER_IDS[1]}
        existing
        style={{ visibility }}
      />
      <SymbolLayer
        id={MAPBOX_CONTOUR_LAYER_IDS[2]}
        existing
        style={{ visibility, textField }}
      />
    </>
  );
}

/** @deprecated Use {@link ElevationContourLayers}. */
export const SatelliteContourLayers = ElevationContourLayers;

export function MapStyleLayers({
  lightPreset,
  showElevationContours,
}: MapStyleLayersProps) {
  return (
    <>
      <MapStyleImport lightPreset={lightPreset} />
      <ElevationContourLayers visible={showElevationContours} />
    </>
  );
}
