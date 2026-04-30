import { ResetMapOrientationButton } from "@/components/buttons/ResetMapOrientationButton";
import { ResetMapPositionButton } from "@/components/buttons/ResetMapPositionButton";
import { RoutePreview } from "@/components/routePreview/RoutePreview";
import {
  CLUSTER_RADIUS,
  ROUTE_MARKER_CAMERA_ZOOM,
  RouteMarkersLayer,
  type RoutesState,
} from "@/components/screens/explore/RouteMarkersLayer";
import {
  ROUTE_MARKER_ICON_SIZE_INTERPOLATE,
  ROUTE_MARKER_IMAGES,
  unclusteredRouteMarkerIconImage,
  unclusteredRouteMarkerIconSize,
} from "@/components/screens/explore/routeMarkerIcons";
import { TrailsLayer } from "@/components/screens/explore/TrailsLayer";
import {
  MAP_BUTTON_GAP,
  MAP_BUTTON_SIZE,
  MAP_BUTTON_TOP_OFFSET,
  routePreviewDockedPaddingBottom,
} from "./shared/fullScreenMapLayout";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { MiniMapHeader } from "./shared/MiniMapHeader";
import { miniMapHostStyles } from "./shared/miniMapHostStyles";
import { minimapStyles } from "./shared/minimapShared";
import { useMiniMapShell } from "@/components/minimap/miniMapAnimatedCard";
import type { MiniMapReloadRegisterRef } from "@/components/minimap/miniMapHandle";
import { useMiniMapCamera } from "./shared/useMiniMapCamera";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  Camera,
  Images,
  LocationPuck,
  MapView,
  ShapeSource,
  SymbolLayer,
} from "@rnmapbox/maps";
import {
  type OfflineCenteredRegionMiniMap,
  type OnlineCenteredRegionMiniMap,
  PageDataSource,
  RouteFilter,
  RoutesGeojson,
  RoutesParams,
  type OfflinePagePreview,
  type OnlinePagePreview,
} from "ropegeo-common/models";

/** Default map center when `mapDirections` is null (Moab, UT). [lng, lat]. */
const DEFAULT_MAP_CENTER: [number, number] = [-109.5508, 38.5733];
const DEFAULT_ZOOM = 13;
const FOCUSED_ROUTE_ZOOM = 13;

function mergeCenteredRoutesParams(
  miniMap: OnlineCenteredRegionMiniMap,
  regionRouteFilter: RouteFilter,
  fallbackSource: PageDataSource,
): RoutesParams {
  const base = regionRouteFilter.toRoutesParams();
  const server = miniMap.routesParams;
  const reg = server.region;
  if (reg == null) {
    throw new Error("CenteredRegionMiniMap.routesParams.region is required");
  }
  const catalogue =
    regionRouteFilter.sources != null && regionRouteFilter.sources.length > 0
      ? regionRouteFilter.sources[0]
      : fallbackSource;
  return new RoutesParams({
    region: { id: reg.id, source: catalogue },
    sources: null,
    routeTypes: base.routeTypes ?? server.routeTypes,
    difficulty: base.difficulty ?? server.difficulty,
    limit: server.limit,
    page: server.page,
  });
}

export type CenteredRegionMiniMapViewProps = {
  miniMap: OnlineCenteredRegionMiniMap | OfflineCenteredRegionMiniMap;
  /**
   * When set, used for the initial camera center (before the centered route is located) and for
   * Apple/Google directions on the collapsed minimap (mirrors the tile page minimap).
   */
  mapDirections?: { lat: number; lon: number } | null;
  onCollapse: () => void;
  reloadRegisterRef?: MiniMapReloadRegisterRef;
};

export function CenteredRegionMiniMapView({
  miniMap,
  mapDirections = null,
  onCollapse,
  reloadRegisterRef,
}: CenteredRegionMiniMapViewProps) {
  const shell = useMiniMapShell();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const defaultCenter = useMemo((): [number, number] => {
    return mapDirections != null
      ? [mapDirections.lon, mapDirections.lat]
      : DEFAULT_MAP_CENTER;
  }, [mapDirections]);

  const [routesState, setRoutesState] = useState<RoutesState>({
    loading: true,
    refreshing: false,
    data: null,
    errors: null,
    received: 0,
    total: null,
    timeoutCountdown: null,
  });

  const [offlineShape, setOfflineShape] = useState<RoutesGeojson | null>(null);
  const [offlineLoadError, setOfflineLoadError] = useState<Error | null>(null);

  const isOffline = miniMap.fetchType === "offline";

  useEffect(() => {
    if (!isOffline || !shell.mountNativeMap) {
      setOfflineShape(null);
      setOfflineLoadError(null);
      return;
    }
    const path = (miniMap as OfflineCenteredRegionMiniMap).downloadedGeojson;
    let cancelled = false;
    void (async () => {
      try {
        const text = await FileSystem.readAsStringAsync(path);
        const raw = JSON.parse(text) as unknown;
        const geo = RoutesGeojson.fromResult(raw);
        if (!cancelled) {
          setOfflineShape(geo);
          setOfflineLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setOfflineShape(null);
          setOfflineLoadError(e instanceof Error ? e : new Error(String(e)));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOffline, miniMap, shell.mountNativeMap]);

  const centeredRouteId = miniMap.centeredRouteId;

  const liveMiniMap = miniMap.fetchType === "online" ? miniMap : null;

  const defaultRegionRouteFilter = useMemo(
    () => new RouteFilter([PageDataSource.Ropewiki]),
    [],
  );

  const liveRoutesParams = useMemo((): RoutesParams | null => {
    if (liveMiniMap == null) return null;
    return mergeCenteredRoutesParams(liveMiniMap, defaultRegionRouteFilter, PageDataSource.Ropewiki);
  }, [liveMiniMap, defaultRegionRouteFilter]);

  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const [currentPreview, setCurrentPreview] = useState<
    OnlinePagePreview | OfflinePagePreview | null
  >(null);
  const userFocusedNonCenteredRouteRef = useRef(false);

  const markerAccentRouteId =
    !shell.expanded ||
    focusedRouteId == null ||
    focusedRouteId === centeredRouteId
      ? centeredRouteId
      : null;

  const offlineUnclusteredIconImage = useMemo(
    () =>
      unclusteredRouteMarkerIconImage(
        shell.expanded ? focusedRouteId : null,
        markerAccentRouteId,
      ),
    [shell.expanded, focusedRouteId, markerAccentRouteId],
  );

  const offlineUnclusteredIconSize = useMemo(
    () =>
      unclusteredRouteMarkerIconSize(
        shell.expanded ? focusedRouteId : null,
        markerAccentRouteId,
      ),
    [shell.expanded, focusedRouteId, markerAccentRouteId],
  );

  const {
    cameraRef,
    resetPitchAndHeading,
    captureHome,
    onCameraChanged,
    compassVisible,
    positionButtonVisible,
  } = useMiniMapCamera({ expanded: shell.expanded, initialHomeCenter: defaultCenter });

  const shapeSourceRef = useRef<ComponentRef<typeof ShapeSource>>(null);

  const collapsedHomeCameraRef = useRef<{
    applied: boolean;
    appliedCenterKey: string;
  }>({ applied: false, appliedCenterKey: "" });

  const collapseCleanup = useCallback(() => {
    setFocusedRouteId(null);
    setCurrentPreview(null);
    userFocusedNonCenteredRouteRef.current = false;
    resetPitchAndHeading();
  }, [resetPitchAndHeading]);

  useEffect(() => {
    shell.registerCollapseCleanup(collapseCleanup);
    return () => shell.registerCollapseCleanup(null);
  }, [shell.registerCollapseCleanup, collapseCleanup]);

  const displayGeojson = isOffline ? offlineShape : routesState.data;
  const centeredRouteCoordinate = useMemo((): [number, number] | null => {
    if (displayGeojson == null || displayGeojson.features.length === 0) return null;
    const f = displayGeojson.features.find((feat) => feat.properties?.id === centeredRouteId);
    const g = f?.geometry;
    if (g?.type !== "Point" || !Array.isArray(g.coordinates)) return null;
    return g.coordinates as [number, number];
  }, [displayGeojson, centeredRouteId]);

  useEffect(() => {
    if (centeredRouteCoordinate == null) return;
    if (
      shell.expanded &&
      focusedRouteId != null &&
      focusedRouteId !== centeredRouteId
    ) {
      return;
    }
    if (
      shell.expanded &&
      focusedRouteId == null &&
      userFocusedNonCenteredRouteRef.current
    ) {
      return;
    }
    const t = setTimeout(() => {
      cameraRef.current?.setCamera({
        centerCoordinate: centeredRouteCoordinate,
        zoomLevel: FOCUSED_ROUTE_ZOOM,
        animationDuration: 300,
      });
    }, 120);
    return () => clearTimeout(t);
  }, [centeredRouteCoordinate, shell.expanded, focusedRouteId]);

  useEffect(() => {
    if (!shell.mountNativeMap) {
      collapsedHomeCameraRef.current = { applied: false, appliedCenterKey: "" };
      return;
    }
    if (!shell.anchorRect) return;

    const collapseCenter = centeredRouteCoordinate ?? defaultCenter;
    const centerKey = `${collapseCenter[0]},${collapseCenter[1]}`;

    if (shell.expanded) {
      captureHome();
      collapsedHomeCameraRef.current = { applied: false, appliedCenterKey: centerKey };
      return;
    }

    const prev = collapsedHomeCameraRef.current;
    const needApply = !prev.applied || prev.appliedCenterKey !== centerKey;
    if (!needApply) return;

    const timer = setTimeout(() => {
      cameraRef.current?.setCamera({
        centerCoordinate: collapseCenter,
        zoomLevel: DEFAULT_ZOOM,
        animationDuration: 260,
      });
      collapsedHomeCameraRef.current = {
        applied: true,
        appliedCenterKey: centerKey,
      };
    }, 260);
    return () => clearTimeout(timer);
  }, [shell.anchorRect, captureHome, shell.expanded, shell.mountNativeMap, defaultCenter, centeredRouteCoordinate]);

  const resetPosition = () => {
    userFocusedNonCenteredRouteRef.current = false;
    setFocusedRouteId(null);
    setCurrentPreview(null);
    captureHome();
    const resetCenter = centeredRouteCoordinate ?? defaultCenter;
    cameraRef.current?.setCamera({
      centerCoordinate: resetCenter,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 300,
    });
  };

  const handleOfflineMarkerPress = async (event: { features?: GeoJSON.Feature[] }) => {
    const features = event.features;
    if (!features?.length || !cameraRef?.current) {
      return;
    }
    const feature = features[0];
    const props = feature?.properties as {
      point_count?: number;
      id?: string;
    } | undefined;
    const geometry = feature?.geometry;
    if (geometry?.type !== "Point" || !Array.isArray(geometry.coordinates)) {
      return;
    }
    const coords = geometry.coordinates as [number, number];
    const [lng, lat] = coords;
    const isCluster = props?.point_count != null;

    if (isCluster && shapeSourceRef.current) {
      try {
        const zoom = await shapeSourceRef.current.getClusterExpansionZoom(
          feature as GeoJSON.Feature<GeoJSON.Point>,
        );
        cameraRef.current.setCamera({
          centerCoordinate: [lng, lat],
          zoomLevel: zoom,
          animationDuration: 300,
        });
      } catch {
        /* ignore */
      }
      return;
    }

    const routeId = props?.id;
    if (routeId && shell.expanded) {
      if (routeId !== centeredRouteId) {
        userFocusedNonCenteredRouteRef.current = true;
      } else {
        userFocusedNonCenteredRouteRef.current = false;
      }
      setFocusedRouteId(routeId);
      setCurrentPreview(null);
      cameraRef.current.setCamera({
        centerCoordinate: coords,
        zoomLevel: ROUTE_MARKER_CAMERA_ZOOM,
        animationDuration: 300,
      });
    }
  };

  const onlineInitialLoading =
    !isOffline &&
    routesState.loading &&
    routesState.data == null &&
    routesState.errors == null;
  const offlineInitialLoading =
    isOffline && offlineShape == null && offlineLoadError == null;

  const onlineGeoError = !isOffline && routesState.errors != null;
  const offlineGeoError = isOffline && offlineLoadError != null;
  const geoErrorMessage = offlineGeoError
    ? offlineLoadError?.message
    : onlineGeoError
      ? routesState.errors?.message
      : undefined;

  const hasRouteGeoData =
    displayGeojson != null && displayGeojson.features.length > 0;
  const blockingGeoErrorMessage =
    geoErrorMessage != null && geoErrorMessage !== "" && !hasRouteGeoData
      ? geoErrorMessage
      : null;

  const showDataLoadingOverlay =
    shell.mountNativeMap &&
    blockingGeoErrorMessage == null &&
    (onlineInitialLoading || offlineInitialLoading);

  useEffect(() => {
    shell.setBlockingErrorMessage(blockingGeoErrorMessage);
  }, [blockingGeoErrorMessage, shell.setBlockingErrorMessage]);

  const reloadMinimap = useCallback(() => {
    shell.setBlockingErrorMessage(null);
  }, [shell.setBlockingErrorMessage]);

  useEffect(() => {
    if (reloadRegisterRef == null) return;
    reloadRegisterRef.current = reloadMinimap;
    return () => {
      reloadRegisterRef.current = null;
    };
  }, [reloadRegisterRef, reloadMinimap]);

  useEffect(() => {
    shell.setLoadingOverlayVisible(showDataLoadingOverlay);
  }, [showDataLoadingOverlay, shell.setLoadingOverlayVisible]);

  const { insets } = shell;

  return (
    <>
      {shell.mapBodyVisible ? (
        <MapView
          styleURL="mapbox://styles/mapbox/outdoors-v12"
          style={minimapStyles.map}
          projection="globe"
          pointerEvents={shell.expanded ? "auto" : "none"}
          scrollEnabled={shell.expanded}
          zoomEnabled={shell.expanded}
          rotateEnabled={shell.expanded}
          pitchEnabled={shell.expanded}
          scaleBarEnabled={false}
          attributionEnabled={shell.expanded}
          logoEnabled={shell.expanded}
          logoPosition={Platform.OS === "android" ? { bottom: 40, left: 10 } : undefined}
          attributionPosition={Platform.OS === "android" ? { bottom: 40, right: 10 } : undefined}
          onPress={() => {
            if (!shell.expanded) return;
            setFocusedRouteId(null);
            setCurrentPreview(null);
          }}
          onCameraChanged={onCameraChanged}
        >
          <LocationPuck />
          <Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: defaultCenter,
              zoomLevel: DEFAULT_ZOOM,
            }}
          />
          {liveRoutesParams != null ? (
            <RouteMarkersLayer
              routesParams={liveRoutesParams}
              onStateChange={setRoutesState}
              cameraRef={cameraRef}
              focusedRouteId={shell.expanded ? focusedRouteId : null}
              accentRouteId={markerAccentRouteId}
              onRoutePress={(routeId) => {
                if (!shell.expanded) return;
                if (routeId !== centeredRouteId) {
                  userFocusedNonCenteredRouteRef.current = true;
                } else {
                  userFocusedNonCenteredRouteRef.current = false;
                }
                setFocusedRouteId(routeId);
                setCurrentPreview(null);
              }}
              onRouteClusterPress={() => {
                if (!shell.expanded) return;
                setFocusedRouteId(null);
                setCurrentPreview(null);
              }}
            />
          ) : offlineShape != null && offlineShape.features.length > 0 ? (
            <ShapeSource
              ref={shapeSourceRef}
              id="centered-offline-routes"
              shape={offlineShape}
              cluster
              clusterRadius={CLUSTER_RADIUS}
              onPress={handleOfflineMarkerPress}
            >
              <SymbolLayer
                id="centered-offline-unclustered"
                filter={["!", ["has", "point_count"]]}
                style={{
                  iconImage: offlineUnclusteredIconImage,
                  iconSize: offlineUnclusteredIconSize,
                  iconAllowOverlap: true,
                  iconIgnorePlacement: true,
                  iconAnchor: "bottom",
                  textField: ["get", "name"],
                  textSize: 12,
                  textColor: "#333333",
                  textHaloColor: "#ffffff",
                  textHaloWidth: 1.5,
                  textOffset: [0, 0.2],
                  textAnchor: "top",
                  textAllowOverlap: true,
                  textIgnorePlacement: true,
                }}
              />
              <SymbolLayer
                id="centered-offline-clusters"
                filter={["has", "point_count"]}
                style={{
                  iconImage: "route-marker-cluster",
                  iconSize: ROUTE_MARKER_ICON_SIZE_INTERPOLATE,
                  iconAllowOverlap: true,
                  iconIgnorePlacement: true,
                  iconAnchor: "bottom",
                  textField: [
                    "concat",
                    "(",
                    ["to-string", ["get", "point_count"]],
                    ")",
                  ],
                  textSize: 12,
                  textColor: "#333333",
                  textHaloColor: "#ffffff",
                  textHaloWidth: 1.5,
                  textOffset: [0, 0.2],
                  textAnchor: "top",
                  textAllowOverlap: true,
                  textIgnorePlacement: true,
                }}
              />
              <Images images={{ ...ROUTE_MARKER_IMAGES }} />
            </ShapeSource>
          ) : null}
          <TrailsLayer
            focusedRouteId={shell.expanded ? focusedRouteId : null}
            visibleTrailIds={
              shell.expanded && currentPreview?.mapData != null ? [currentPreview.mapData] : []
            }
          />
        </MapView>
      ) : null}
      {shell.expanded ? (
        <View style={expandedChromeStyles.layer} pointerEvents="box-none">
          <MiniMapHeader title={miniMap.title} onBack={onCollapse} top={insets.top + 8} />
          {focusedRouteId != null && (
            <View
              style={[
                miniMapHostStyles.previewContainer,
                {
                  paddingBottom: routePreviewDockedPaddingBottom(
                    insets.bottom,
                    tabBarHeight,
                  ),
                },
              ]}
            >
              <RoutePreview
                routeId={focusedRouteId}
                routeType={
                  displayGeojson?.features?.find((f) => f.properties?.id === focusedRouteId)
                    ?.properties?.type ?? null
                }
                onCurrentPreviewChange={setCurrentPreview}
                onPreviewPress={(preview) => {
                  if (preview.source === "ropewiki") {
                    router.push({
                      pathname: "/(tabs)/explore/[id]/page",
                      params: {
                        id: preview.id,
                        source: PageDataSource.Ropewiki,
                      },
                    } as unknown as Parameters<typeof router.push>[0]);
                  } else {
                    router.push("/explore/technical-info");
                  }
                }}
              />
            </View>
          )}
          <ResetMapPositionButton
            onPress={resetPosition}
            visible={positionButtonVisible}
            top={insets.top + MAP_BUTTON_TOP_OFFSET}
          />
          <ResetMapOrientationButton
            onPress={resetPitchAndHeading}
            visible={compassVisible}
            top={insets.top + MAP_BUTTON_TOP_OFFSET + MAP_BUTTON_SIZE + MAP_BUTTON_GAP}
          />
        </View>
      ) : null}
    </>
  );
}

const expandedChromeStyles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
});
