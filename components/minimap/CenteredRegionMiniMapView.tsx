import { ResetMapOrientationButton } from "@/components/buttons/ResetMapOrientationButton";
import { ResetMapPositionButton } from "@/components/buttons/ResetMapPositionButton";
import { FilterBottomSheet } from "@/components/filters/FilterBottomSheet";
import { FilterButton } from "@/components/buttons/FilterButton";
import { RoutePreview } from "@/components/routePreview/RoutePreview";
import {
  CLUSTER_RADIUS,
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
  HEADER_BUTTON_SIZE,
  HEADER_SIDE_SLOT_WIDTH,
  MAP_BUTTON_GAP,
  MAP_BUTTON_SIZE,
  MAP_BUTTON_TOP_OFFSET,
} from "./fullScreenMapLayout";
import { MiniMapHeader } from "./MiniMapHeader";
import { miniMapHostStyles } from "./miniMapHostStyles";
import {
  MiniMapDirectionsButtons,
  MiniMapExpandButton,
  minimapStyles,
} from "./minimapShared";
import { type Rect, useMiniMapAnimation } from "./useMiniMapAnimation";
import { useMiniMapCamera } from "./useMiniMapCamera";
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
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
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
  mountNativeMap: boolean;
  expanded: boolean;
  anchorRect: Rect | null;
  baseScrollY: number;
  scrollY: SharedValue<number>;
  onExpand: () => void;
  onCollapse: () => void;
};

export function CenteredRegionMiniMapView({
  miniMap,
  mapDirections = null,
  mountNativeMap,
  expanded,
  anchorRect,
  baseScrollY,
  scrollY,
  onExpand,
  onCollapse,
}: CenteredRegionMiniMapViewProps) {
  const router = useRouter();
  const defaultCenter = useMemo((): [number, number] => {
    return mapDirections != null
      ? [mapDirections.lon, mapDirections.lat]
      : DEFAULT_MAP_CENTER;
  }, [mapDirections]);

  const [routesState, setRoutesState] = useState<RoutesState>({
    loading: true,
    data: null,
    errors: null,
    received: 0,
    total: null,
  });

  const [offlineShape, setOfflineShape] = useState<RoutesGeojson | null>(null);
  const [offlineLoadError, setOfflineLoadError] = useState<Error | null>(null);

  const isOffline = miniMap.fetchType === "offline";

  useEffect(() => {
    if (!isOffline || !mountNativeMap) {
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
  }, [isOffline, miniMap, mountNativeMap]);

  const centeredRouteId = miniMap.centeredRouteId;

  const liveMiniMap = miniMap.fetchType === "online" ? miniMap : null;

  const [regionRouteFilter, setRegionRouteFilter] = useState<RouteFilter>(
    () => new RouteFilter([PageDataSource.Ropewiki]),
  );
  const [regionFilterOpen, setRegionFilterOpen] = useState(false);

  const liveRoutesParams = useMemo((): RoutesParams | null => {
    if (liveMiniMap == null) return null;
    return mergeCenteredRoutesParams(liveMiniMap, regionRouteFilter, PageDataSource.Ropewiki);
  }, [liveMiniMap, regionRouteFilter]);

  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const [currentPreview, setCurrentPreview] = useState<
    OnlinePagePreview | OfflinePagePreview | null
  >(null);
  /** While expanded, suppress auto-recenter on the page route after user picked another marker until collapse. */
  const userFocusedNonCenteredRouteRef = useRef(false);

  /** Collapsed: always highlight page route. Expanded: highlight centered route only until user focuses another marker. */
  const markerAccentRouteId =
    !expanded ||
    focusedRouteId == null ||
    focusedRouteId === centeredRouteId
      ? centeredRouteId
      : null;

  const offlineUnclusteredIconImage = useMemo(
    () =>
      unclusteredRouteMarkerIconImage(
        expanded ? focusedRouteId : null,
        markerAccentRouteId,
      ),
    [expanded, focusedRouteId, markerAccentRouteId],
  );

  const offlineUnclusteredIconSize = useMemo(
    () =>
      unclusteredRouteMarkerIconSize(
        expanded ? focusedRouteId : null,
        markerAccentRouteId,
      ),
    [expanded, focusedRouteId, markerAccentRouteId],
  );

  const {
    cameraRef,
    resetPitchAndHeading,
    captureHome,
    onCameraChanged,
    compassVisible,
    positionButtonVisible,
  } = useMiniMapCamera({ expanded, initialHomeCenter: defaultCenter });

  const shapeSourceRef = useRef<ComponentRef<typeof ShapeSource>>(null);

  /**
   * Avoid calling setCamera on every `anchorRect` remeasure (scroll/layout); only re-apply the
   * collapsed “home” camera after expand→collapse or when `defaultCenter` changes.
   */
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

  const { cardStyle, insets } = useMiniMapAnimation({
    anchorRect,
    baseScrollY,
    scrollY,
    expanded,
    onCollapseTransition: collapseCleanup,
  });

  const displayGeojson = isOffline ? offlineShape : routesState.data;

  useEffect(() => {
    if (displayGeojson == null || displayGeojson.features.length === 0) return;
    if (
      expanded &&
      focusedRouteId != null &&
      focusedRouteId !== centeredRouteId
    ) {
      return;
    }
    if (
      expanded &&
      focusedRouteId == null &&
      userFocusedNonCenteredRouteRef.current
    ) {
      return;
    }
    const f = displayGeojson.features.find((feat) => feat.properties?.id === centeredRouteId);
    const g = f?.geometry;
    if (g?.type !== "Point" || !Array.isArray(g.coordinates)) return;
    const coords = g.coordinates as [number, number];
    const t = setTimeout(() => {
      cameraRef.current?.setCamera({
        centerCoordinate: coords,
        zoomLevel: FOCUSED_ROUTE_ZOOM,
        animationDuration: 300,
      });
    }, 120);
    return () => clearTimeout(t);
  }, [displayGeojson, centeredRouteId, expanded, focusedRouteId]);

  useEffect(() => {
    if (!mountNativeMap) {
      collapsedHomeCameraRef.current = { applied: false, appliedCenterKey: "" };
      return;
    }
    if (!anchorRect) return;

    const centerKey = `${defaultCenter[0]},${defaultCenter[1]}`;

    if (expanded) {
      captureHome();
      collapsedHomeCameraRef.current = { applied: false, appliedCenterKey: centerKey };
      return;
    }

    const prev = collapsedHomeCameraRef.current;
    const needApply = !prev.applied || prev.appliedCenterKey !== centerKey;
    if (!needApply) return;

    const timer = setTimeout(() => {
      cameraRef.current?.setCamera({
        centerCoordinate: defaultCenter,
        zoomLevel: DEFAULT_ZOOM,
        animationDuration: 260,
      });
      collapsedHomeCameraRef.current = {
        applied: true,
        appliedCenterKey: centerKey,
      };
    }, 260);
    return () => clearTimeout(timer);
  }, [anchorRect, captureHome, expanded, mountNativeMap, defaultCenter]);

  const resetPosition = () => {
    userFocusedNonCenteredRouteRef.current = false;
    setFocusedRouteId(null);
    setCurrentPreview(null);
    captureHome();
    cameraRef.current?.setCamera({
      centerCoordinate: defaultCenter,
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
    if (routeId && expanded) {
      if (routeId !== centeredRouteId) {
        userFocusedNonCenteredRouteRef.current = true;
      } else {
        userFocusedNonCenteredRouteRef.current = false;
      }
      setFocusedRouteId(routeId);
      setCurrentPreview(null);
      cameraRef.current.setCamera({
        centerCoordinate: coords,
        animationDuration: 300,
      });
    }
  };

  const routesLoading = isOffline
    ? offlineShape == null && offlineLoadError == null
    : routesState.loading;

  const showMapLoading = !mountNativeMap || routesLoading;

  if (!anchorRect) return null;

  return (
    <View style={miniMapHostStyles.root} pointerEvents="box-none">
      <Animated.View
        style={[
          miniMapHostStyles.mapCard,
          cardStyle,
          expanded && miniMapHostStyles.expandedCard,
        ]}
        pointerEvents={expanded ? "auto" : "box-none"}
      >
        {!mountNativeMap ? (
          <View style={[minimapStyles.map, minimapStyles.mapPlaceholder]} />
        ) : (
          <MapView
            styleURL="mapbox://styles/mapbox/outdoors-v12"
            style={minimapStyles.map}
            projection="globe"
            pointerEvents={expanded ? "auto" : "none"}
            scrollEnabled={expanded}
            zoomEnabled={expanded}
            rotateEnabled={expanded}
            pitchEnabled={expanded}
            scaleBarEnabled={false}
            attributionEnabled={expanded}
            logoEnabled={expanded}
            logoPosition={Platform.OS === "android" ? { bottom: 40, left: 10 } : undefined}
            attributionPosition={Platform.OS === "android" ? { bottom: 40, right: 10 } : undefined}
            onPress={() => {
              if (!expanded) return;
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
                focusedRouteId={expanded ? focusedRouteId : null}
                accentRouteId={markerAccentRouteId}
                onRoutePress={(routeId) => {
                  if (!expanded) return;
                  if (routeId !== centeredRouteId) {
                    userFocusedNonCenteredRouteRef.current = true;
                  } else {
                    userFocusedNonCenteredRouteRef.current = false;
                  }
                  setFocusedRouteId(routeId);
                  setCurrentPreview(null);
                }}
                onRouteClusterPress={() => {
                  if (!expanded) return;
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
              focusedRouteId={expanded ? focusedRouteId : null}
              visibleTrailIds={expanded && currentPreview?.mapData != null ? [currentPreview.mapData] : []}
            />
          </MapView>
        )}
        {showMapLoading ? (
          <View style={[StyleSheet.absoluteFill, localStyles.mapLoadingOverlay]} pointerEvents="none">
            <ActivityIndicator size="large" color="#64748b" />
          </View>
        ) : null}
        {!expanded && mapDirections != null ? (
          <MiniMapDirectionsButtons lat={mapDirections.lat} lon={mapDirections.lon} />
        ) : null}
        {!expanded && <MiniMapExpandButton onPress={onExpand} />}
      </Animated.View>
      {expanded && (
        <>
          <MiniMapHeader
            title={miniMap.title}
            onBack={onCollapse}
            top={insets.top + 8}
            rightSlot={
              liveMiniMap != null ? (
                <View style={[localStyles.filterButtonWrap, { width: HEADER_SIDE_SLOT_WIDTH }]}>
                  <FilterButton persisted={false} onPress={() => setRegionFilterOpen(true)} />
                </View>
              ) : null
            }
          />
          {focusedRouteId != null && (
            <View style={[miniMapHostStyles.previewContainer, { paddingBottom: insets.bottom + 8 }]}>
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
        </>
      )}
      {liveMiniMap != null ? (
        <FilterBottomSheet
          visible={regionFilterOpen}
          onClose={() => setRegionFilterOpen(false)}
          mode={
            regionFilterOpen
              ? {
                  kind: "region-route",
                  draft: regionRouteFilter,
                  onDraftChange: setRegionRouteFilter,
                  onReset: () => setRegionRouteFilter(new RouteFilter([PageDataSource.Ropewiki])),
                }
              : null
          }
        />
      ) : null}
    </View>
  );
}

const localStyles = StyleSheet.create({
  filterButtonWrap: {
    height: HEADER_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  mapLoadingOverlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(229, 231, 235, 0.92)",
    borderRadius: minimapStyles.map.borderRadius,
  },
});
