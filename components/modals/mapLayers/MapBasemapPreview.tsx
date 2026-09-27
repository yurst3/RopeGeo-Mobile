import {
  MAP_LAYERS_PREVIEW_CENTER,
  MAP_LAYERS_PREVIEW_ZOOM,
  MAPBOX_STYLE_URLS,
} from "@/constants/mapbox";
import type { MapBasemap, MapLightPreset } from "@/constants/settings/mapLayersTypes";
import { MapStyleImport, ElevationContourLayers } from "@/components/modals/mapLayers/MapStyleLayers";
import { useNetworkStatus } from "@/context/app/NetworkStatusContext";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { isMapLayersPreviewPackReady } from "@/utils/mapbox/mapLayersPreviewPacks";
import { Camera, MapView } from "@rnmapbox/maps";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

type MapBasemapPreviewProps = {
  basemap: MapBasemap;
  lightPreset: MapLightPreset;
  showSatelliteContours: boolean;
  selected: boolean;
  width: number;
  height: number;
  /** When false, keep the frame sized but do not mount MapView yet. */
  allowMount?: boolean;
  /** Fired once after this preview's MapView finishes loading (or on load error). */
  onMapReady?: () => void;
};

type LaidOutSize = { width: number; height: number };

export function MapBasemapPreview({
  basemap,
  lightPreset,
  showSatelliteContours,
  selected,
  width,
  height,
  allowMount = true,
  onMapReady,
}: MapBasemapPreviewProps) {
  const { text } = useColorTheme();
  const { isOnline, networkState } = useNetworkStatus();
  const offline = networkState != null && !isOnline;
  const [packReady, setPackReady] = useState<boolean | null>(null);
  const [laidOut, setLaidOut] = useState<LaidOutSize | null>(null);
  const readyReportedRef = useRef(false);
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;

  useEffect(() => {
    if (!offline) {
      setPackReady(null);
      return;
    }
    let cancelled = false;
    setPackReady(null);
    void isMapLayersPreviewPackReady(basemap).then((ready) => {
      if (!cancelled) setPackReady(ready);
    });
    return () => {
      cancelled = true;
    };
  }, [basemap, offline]);

  useEffect(() => {
    readyReportedRef.current = false;
  }, [basemap, allowMount]);

  const reportReady = useCallback(() => {
    if (readyReportedRef.current) return;
    readyReportedRef.current = true;
    onMapReadyRef.current?.();
  }, []);

  const onFrameLayout = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w <= 0 || h <= 0) {
      setLaidOut(null);
      return;
    }
    setLaidOut((prev) =>
      prev != null && prev.width === w && prev.height === h ? prev : { width: w, height: h },
    );
  }, []);

  const propsReady = width > 0 && height > 0;
  const unavailable = offline && packReady === false;
  const mapSize =
    allowMount && propsReady && laidOut != null && !unavailable && (!offline || packReady === true)
      ? laidOut
      : null;

  useEffect(() => {
    if (allowMount && unavailable) reportReady();
  }, [allowMount, reportReady, unavailable]);

  return (
    <View
      style={[
        styles.frame,
        {
          width: propsReady ? width : undefined,
          height: propsReady ? height : undefined,
          borderColor: selected ? "#dc732b" : "transparent",
          borderWidth: selected ? 2 : 0,
        },
      ]}
      pointerEvents="none"
      onLayout={onFrameLayout}
      collapsable={false}
    >
      {unavailable ? (
        <View style={styles.unavailable}>
          <Text style={[styles.unavailableText, { color: text.error }]}>Preview not available</Text>
        </View>
      ) : mapSize != null ? (
        <MapView
          style={{ width: mapSize.width, height: mapSize.height }}
          styleURL={MAPBOX_STYLE_URLS[basemap]}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          scaleBarEnabled={false}
          logoEnabled={false}
          attributionEnabled={false}
          pointerEvents="none"
          onDidFinishLoadingMap={reportReady}
          onMapLoadingError={reportReady}
        >
          <Camera
            defaultSettings={{
              centerCoordinate: MAP_LAYERS_PREVIEW_CENTER,
              zoomLevel: MAP_LAYERS_PREVIEW_ZOOM,
            }}
          />
          <MapStyleImport lightPreset={lightPreset} />
          <ElevationContourLayers visible={showSatelliteContours} />
        </MapView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  unavailable: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  unavailableText: {
    fontSize: 13,
    textAlign: "center",
  },
});
