import {
  Method,
  SERVICE_BASE_URL,
  Service,
} from "@/components/RopeGeoHttpRequest";
import { Camera, Images, LineLayer, MapView, ShapeSource, SymbolLayer, VectorSource } from "@rnmapbox/maps";
import { FontAwesome5 } from "@expo/vector-icons";
import type { ComponentRef } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import {
  MiniMapType,
  PageMiniMap,
  type MiniMap,
  RegionMiniMap,
  Result,
  ResultType,
  RoutesGeojsonResult,
} from "ropegeo-common";

const MINI_MAP_BORDER_RADIUS = 12;
const EXPAND_BUTTON_SIZE = 40;
const EXPAND_BUTTON_INSET = 8;

const ROUTE_ICON_SIZE_AT_ZOOM_0 = 0.05;
const ROUTE_ICON_SIZE_AT_ZOOM_22 = ROUTE_ICON_SIZE_AT_ZOOM_0 * 2 ** -22;
const REGION_CLUSTER_RADIUS = 40;

const CAMERA_PADDING = {
  paddingTop: 12,
  paddingBottom: 52,
  paddingLeft: 12,
  paddingRight: 12,
} as const;

export type MiniMapViewProps = {
  miniMap: MiniMap;
  /**
   * When false, shows placeholder until the parent enables (e.g. mini map scrolled into view)
   * so Mapbox init does not block the first scroll.
   */
  mountNativeMap: boolean;
};

function isNonNullBounds(
  b: unknown
): b is { north: number; south: number; east: number; west: number } {
  if (b == null || typeof b !== "object") return false;
  const o = b as Record<string, unknown>;
  return (
    typeof o.north === "number" &&
    typeof o.south === "number" &&
    typeof o.east === "number" &&
    typeof o.west === "number" &&
    !Number.isNaN(o.north) &&
    !Number.isNaN(o.south) &&
    !Number.isNaN(o.east) &&
    !Number.isNaN(o.west)
  );
}

function PageMiniMapContent({
  miniMap,
  mountNativeMap,
}: {
  miniMap: PageMiniMap;
  mountNativeMap: boolean;
}) {
  const cameraRef = useRef<ComponentRef<typeof Camera>>(null);
  const b = miniMap.bounds;

  const fitToBounds = useCallback(() => {
    cameraRef.current?.setCamera({
      type: "CameraStop",
      bounds: {
        ne: [b.east, b.north],
        sw: [b.west, b.south],
        ...CAMERA_PADDING,
      },
      animationDuration: 0,
      animationMode: "none",
    });
  }, [b.east, b.north, b.south, b.west]);

  const handleMapLoaded = useCallback(() => {
    fitToBounds();
    requestAnimationFrame(() => {
      fitToBounds();
    });
  }, [fitToBounds]);

  return (
    <View style={styles.wrapper}>
      {!mountNativeMap ? (
        <View style={[styles.map, styles.mapPlaceholder]} accessibilityLabel="Loading map">
          <ActivityIndicator size="large" color="#64748b" />
        </View>
      ) : (
        <MapView
          styleURL="mapbox://styles/mapbox/outdoors-v12"
          style={styles.map}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          scaleBarEnabled={false}
          attributionEnabled={false}
          logoEnabled={false}
          onDidFinishLoadingMap={handleMapLoaded}
        >
          <Camera
            ref={cameraRef}
            defaultSettings={{
              bounds: {
                ne: [b.east, b.north],
                sw: [b.west, b.south],
                ...CAMERA_PADDING,
              },
            }}
          />
          <VectorSource
            id="minimap-page-tiles"
            tileUrlTemplates={[miniMap.tilesTemplate]}
          >
            <LineLayer
              id="minimap-page-line"
              sourceLayerID={miniMap.layerId}
              style={{
                lineColor: "#2563eb",
                lineWidth: 2.5,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </VectorSource>
        </MapView>
      )}
      <ExpandButton />
    </View>
  );
}

type RegionFetchState =
  | { status: "idle" | "loading" }
  | { status: "error" }
  | {
      status: "ready";
      bounds: { north: number; south: number; east: number; west: number };
      shape: GeoJSON.FeatureCollection;
    };

function RegionMiniMapContent({
  miniMap,
  mountNativeMap,
}: {
  miniMap: RegionMiniMap;
  mountNativeMap: boolean;
}) {
  const cameraRef = useRef<ComponentRef<typeof Camera>>(null);
  const [fetchState, setFetchState] = useState<RegionFetchState>({ status: "idle" });

  useEffect(() => {
    if (!mountNativeMap) {
      setFetchState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setFetchState({ status: "loading" });

    const qs = miniMap.routesParams.toQueryString();
    const base = SERVICE_BASE_URL[Service.WEBSCRAPER];
    const url = `${base}/routes${qs ? `?${qs}` : ""}`;

    fetch(url, {
      method: Method.GET,
      headers: { "Content-Type": "application/json" },
    })
      .then(async (res) => {
        const text = await res.text();
        if (cancelled) return;
        if (!res.ok) {
          Toast.show({
            type: "error",
            text1: "Map",
            text2: `Could not load routes (${res.status}).`,
            position: "top",
          });
          setFetchState({ status: "error" });
          return;
        }
        try {
          const raw = JSON.parse(text) as unknown;
          const parsed = Result.fromResponseBody(raw);
          if (parsed.resultType !== ResultType.RoutesGeojson) {
            throw new Error("Unexpected response type");
          }
          const geo = (parsed as RoutesGeojsonResult).result;
          const bounds = geo.bounds;
          if (!isNonNullBounds(bounds)) {
            Toast.show({
              type: "error",
              text1: "Map",
              text2: "Server did not return map bounds for this region.",
              position: "top",
            });
            setFetchState({ status: "error" });
            return;
          }
          const features = geo.features.map((f) => ({
            type: "Feature" as const,
            geometry: f.geometry,
            properties: f.properties ?? {},
          }));
          if (cancelled) return;
          setFetchState({
            status: "ready",
            bounds,
            shape: { type: "FeatureCollection", features },
          });
        } catch (e) {
          if (cancelled) return;
          const msg = e instanceof Error ? e.message : "Invalid response";
          Toast.show({
            type: "error",
            text1: "Map",
            text2: msg,
            position: "top",
          });
          setFetchState({ status: "error" });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        Toast.show({
          type: "error",
          text1: "Map",
          text2: err instanceof Error ? err.message : String(err),
          position: "top",
        });
        setFetchState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [mountNativeMap, miniMap]);

  const fitToBounds = useCallback(
    (bounds: { north: number; south: number; east: number; west: number }) => {
      cameraRef.current?.setCamera({
        type: "CameraStop",
        bounds: {
          ne: [bounds.east, bounds.north],
          sw: [bounds.west, bounds.south],
          ...CAMERA_PADDING,
        },
        animationDuration: 0,
        animationMode: "none",
      });
    },
    []
  );

  const handleMapLoaded = useCallback(() => {
    if (fetchState.status !== "ready") return;
    fitToBounds(fetchState.bounds);
    requestAnimationFrame(() => fitToBounds(fetchState.bounds));
  }, [fetchState, fitToBounds]);

  const showPlaceholder =
    !mountNativeMap || fetchState.status !== "ready";

  return (
    <View style={styles.wrapper}>
      {showPlaceholder ? (
        <View style={[styles.map, styles.mapPlaceholder]} accessibilityLabel="Loading map">
          {mountNativeMap && fetchState.status === "loading" ? (
            <ActivityIndicator size="large" color="#64748b" />
          ) : null}
        </View>
      ) : (
        <MapView
          styleURL="mapbox://styles/mapbox/outdoors-v12"
          style={styles.map}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          scaleBarEnabled={false}
          attributionEnabled={false}
          logoEnabled={false}
          onDidFinishLoadingMap={handleMapLoaded}
        >
          <Camera
            ref={cameraRef}
            defaultSettings={{
              bounds: {
                ne: [fetchState.bounds.east, fetchState.bounds.north],
                sw: [fetchState.bounds.west, fetchState.bounds.south],
                ...CAMERA_PADDING,
              },
            }}
          />
          <ShapeSource
            id="minimap-region-routes"
            shape={fetchState.shape}
            cluster
            clusterRadius={REGION_CLUSTER_RADIUS}
          >
            <SymbolLayer
              id="minimap-region-unclustered"
              filter={["!", ["has", "point_count"]]}
              style={{
                iconImage: "map-marker",
                iconSize: [
                  "interpolate",
                  ["exponential", 2],
                  ["zoom"],
                  0,
                  ROUTE_ICON_SIZE_AT_ZOOM_0,
                  22,
                  ROUTE_ICON_SIZE_AT_ZOOM_22,
                ],
                iconAllowOverlap: true,
                iconIgnorePlacement: true,
                iconAnchor: "bottom",
              }}
            />
            <SymbolLayer
              id="minimap-region-clusters"
              filter={["has", "point_count"]}
              style={{
                iconImage: "map-marker",
                iconSize: [
                  "interpolate",
                  ["exponential", 2],
                  ["zoom"],
                  0,
                  ROUTE_ICON_SIZE_AT_ZOOM_0,
                  22,
                  ROUTE_ICON_SIZE_AT_ZOOM_22,
                ],
                iconAllowOverlap: true,
                iconIgnorePlacement: true,
                iconAnchor: "bottom",
                textField: [
                  "concat",
                  "(",
                  ["to-string", ["get", "point_count"]],
                  ")",
                ],
                textSize: 11,
                textColor: "#333333",
                textHaloColor: "#ffffff",
                textHaloWidth: 1.2,
                textOffset: [0, 0.15],
                textAnchor: "top",
              }}
            />
            <Images
              images={{
                "map-marker": require("@/assets/images/location-dot-solid.png"),
              }}
            />
          </ShapeSource>
        </MapView>
      )}
      <ExpandButton />
    </View>
  );
}

function ExpandButton() {
  return (
    <Pressable
      style={styles.expandButton}
      onPress={() => {}}
      accessibilityLabel="Expand map"
      accessibilityRole="button"
    >
      <FontAwesome5 name="expand" size={18} color="#000" />
    </Pressable>
  );
}

/**
 * Square non-interactive minimap: vector tiles ({@link PageMiniMap}) or
 * clustered route points from GET /routes ({@link RegionMiniMap}).
 */
export function MiniMapView({ miniMap, mountNativeMap }: MiniMapViewProps) {
  switch (miniMap.miniMapType) {
    case MiniMapType.TilesTemplate:
      return (
        <PageMiniMapContent miniMap={miniMap as PageMiniMap} mountNativeMap={mountNativeMap} />
      );
    case MiniMapType.GeoJson:
      return (
        <RegionMiniMapContent miniMap={miniMap as RegionMiniMap} mountNativeMap={mountNativeMap} />
      );
    default:
      return (
        <View style={styles.wrapper}>
          <View
            style={[styles.map, styles.mapPlaceholder]}
            accessibilityLabel="Unsupported map type"
          >
            <ActivityIndicator size="large" color="#64748b" />
          </View>
          <ExpandButton />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: MINI_MAP_BORDER_RADIUS,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#e5e7eb",
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: MINI_MAP_BORDER_RADIUS,
  },
  mapPlaceholder: {
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  expandButton: {
    position: "absolute",
    bottom: EXPAND_BUTTON_INSET,
    right: EXPAND_BUTTON_INSET,
    width: EXPAND_BUTTON_SIZE,
    height: EXPAND_BUTTON_SIZE,
    borderRadius: EXPAND_BUTTON_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
