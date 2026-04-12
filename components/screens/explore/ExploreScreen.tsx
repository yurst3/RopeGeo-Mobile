import { ResetMapOrientationButton } from "@/components/buttons/ResetMapOrientationButton";
import { ResetMapPositionButton } from "@/components/buttons/ResetMapPositionButton";
import {
  HEADER_BUTTON_GAP,
  HEADER_BUTTON_SIZE,
  HEADER_SIDE_SLOT_WIDTH,
  MAP_BUTTON_GAP,
  MAP_BUTTON_SIZE,
  MAP_BUTTON_TOP_OFFSET,
} from "@/components/minimap/fullScreenMapLayout";
import { FilterBottomSheet } from "@/components/filters/FilterBottomSheet";
import { FilterButton } from "@/components/buttons/FilterButton";
import { useSavedFilters } from "@/context/SavedFiltersContext";
import {
  ProgressToast,
  TOAST_HORIZONTAL_INSET,
  useRoutesLoadToastDisplay,
} from "@/components/toast";
import { RouteMarkersLayer, type RoutesState } from "./RouteMarkersLayer";
import { TrailsLayer } from "./TrailsLayer";
import {
  PageDataSource,
  RouteFilter,
  type PagePreview,
  type RoutesGeojson,
  type RoutesParams,
  RouteType,
} from "ropegeo-common/models";
import { RoutePreview } from "@/components/routePreview/RoutePreview";
import { Camera, LocationPuck, MapView } from "@rnmapbox/maps";
import { FontAwesome5 } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import type { ComponentRef } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Default map center when location is unavailable (Moab, UT). [lng, lat]. */
const DEFAULT_CURRENT_POSITION: [number, number] = [-109.5508, 38.5733];
const DEFAULT_ZOOM = 12.1;

const SEARCH_BAR_SIDE_WIDTH = HEADER_SIDE_SLOT_WIDTH;

export function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    exploreRoutesParams,
    explorePersisted,
    persistExploreFilter,
    getEffectiveRouteFilterForExplore,
  } = useSavedFilters();
  const [routeFilterSheetOpen, setRouteFilterSheetOpen] = useState(false);
  /** Snapshot of `/routes` params at sheet open — map fetch stays on this until the sheet closes. */
  const [frozenExploreRoutesParams, setFrozenExploreRoutesParams] =
    useState<RoutesParams | null>(null);
  const [exploreRouteDraft, setExploreRouteDraft] = useState<RouteFilter | null>(
    null,
  );
  const cameraRef = useRef<ComponentRef<typeof Camera>>(null);
  const hasCenteredOnLocationRef = useRef(false);
  const [currentPosition, setCurrentPosition] = useState<
    [number, number] | undefined
  >(undefined);
  const [pitch, setPitch] = useState(0);
  const [heading, setHeading] = useState(0);
  const [cameraCenter, setCameraCenter] = useState<
    [number, number] | undefined
  >(undefined);
  const [cameraZoom, setCameraZoom] = useState<number | undefined>(undefined);
  const [followCurrentPosition, setFollowCurrentPosition] = useState(true);
  const [routesState, setRoutesState] = useState<RoutesState>({
    loading: true,
    data: null,
    errors: null,
    received: 0,
    total: null,
  });
  const routesParamsForExploreMap = useMemo(() => {
    if (routeFilterSheetOpen && frozenExploreRoutesParams != null) {
      return frozenExploreRoutesParams;
    }
    return exploreRoutesParams;
  }, [
    routeFilterSheetOpen,
    frozenExploreRoutesParams,
    exploreRoutesParams,
  ]);

  const exploreRoutesKey = useMemo(
    () => routesParamsForExploreMap.toQueryString(),
    [routesParamsForExploreMap],
  );
  const routesToast = useRoutesLoadToastDisplay(routesState, {
    resetKey: exploreRoutesKey,
  });
  const prevExploreRoutesKeyRef = useRef<string | null>(null);
  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const [currentPreview, setCurrentPreview] = useState<PagePreview | null>(null);

  useEffect(() => {
    const prev = prevExploreRoutesKeyRef.current;
    prevExploreRoutesKeyRef.current = exploreRoutesKey;
    if (prev !== null && prev !== exploreRoutesKey) {
      setFocusedRouteId(null);
      setCurrentPreview(null);
    }
  }, [exploreRoutesKey]);

  const defaultCenter = currentPosition ?? DEFAULT_CURRENT_POSITION;
  const isCompassVisible =
    Math.abs(pitch) > 0.5 || Math.abs(heading) > 0.5;
  const isPositionButtonVisible =
    cameraCenter != null &&
    cameraZoom != null &&
    (Math.abs(cameraCenter[0] - defaultCenter[0]) > 1e-5 ||
      Math.abs(cameraCenter[1] - defaultCenter[1]) > 1e-5 ||
      Math.abs(cameraZoom - DEFAULT_ZOOM) > 0.01);

  // Subscribe to continuous location updates; LocationPuck and initial camera center use this.
  // timeInterval: 1000ms is a good balance (use 500 for snappier updates, 2000 for battery).
  // distanceInterval: 0 so we get time-based updates; set > 0 to update only after moving N meters.
  useEffect(() => {
    let mounted = true;
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || !mounted) {
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        (position) => {
          if (!mounted) return;
          setCurrentPosition([
            position.coords.longitude,
            position.coords.latitude,
          ]);
        }
      );
    };

    startWatching().catch(() => {
      // Keep default camera fallback if location is unavailable.
    });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  // Recenter the map camera on the user's location once when it is first fetched (not on every update).
  useEffect(() => {
    if (!currentPosition || hasCenteredOnLocationRef.current) {
      return;
    }

    cameraRef.current?.setCamera({
      centerCoordinate: currentPosition,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 800,
    });
    hasCenteredOnLocationRef.current = true;
  }, [currentPosition]);

  // While follow mode is on, keep the camera centered on the current position.
  useEffect(() => {
    if (!followCurrentPosition || !currentPosition) return;
    cameraRef.current?.setCamera({
      centerCoordinate: currentPosition,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 0,
    });
  }, [followCurrentPosition, currentPosition]);

  const resetPitchAndHeading = () => {
    cameraRef.current?.setCamera({
      pitch: 0,
      heading: 0,
      animationDuration: 300,
    });
  };

  const resetPosition = () => {
    setFocusedRouteId(null);
    setFollowCurrentPosition(true);
    cameraRef.current?.setCamera({
      centerCoordinate: currentPosition ?? DEFAULT_CURRENT_POSITION,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 300,
    });
  };

  return (
    <>
      <View style={styles.container}>
        <View
          style={[styles.searchBarRow, { top: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <View style={styles.searchBarSpacer} />
          <Pressable
            style={styles.searchBar}
            onPress={() => router.push("/explore/search")}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <FontAwesome5 name="search" size={16} color="#6b7280" />
            <Text style={styles.searchBarPlaceholder}>Search</Text>
          </Pressable>
          <View
            style={[
              styles.headerButtonWrap,
              { width: HEADER_BUTTON_SIZE, marginLeft: HEADER_BUTTON_GAP },
            ]}
          >
            <FilterButton
              persisted={explorePersisted}
              onPress={() => {
                setFrozenExploreRoutesParams(exploreRoutesParams);
                setExploreRouteDraft(
                  RouteFilter.fromJsonString(
                    getEffectiveRouteFilterForExplore().toString(),
                  ),
                );
                setRouteFilterSheetOpen(true);
              }}
            />
          </View>
        </View>
        {routesToast.visible ? (
          <ProgressToast
            kind={routesToast.kind}
            title={routesToast.title}
            progress={routesToast.progress}
            top={insets.top + MAP_BUTTON_TOP_OFFSET}
            horizontalInset={TOAST_HORIZONTAL_INSET}
          />
        ) : null}
        <MapView
              styleURL="mapbox://styles/mapbox/outdoors-v12"
              style={styles.map}
              projection="globe"
              scaleBarEnabled={false}
              logoPosition={Platform.OS === "android" ? { bottom: 40, left: 10 } : undefined}
              attributionPosition={Platform.OS === "android" ? { bottom: 40, right: 10 } : undefined}
              onPress={() => {
                setFocusedRouteId(null);
                setCurrentPreview(null);
              }}
              onCameraChanged={(state) => {
                const { pitch: p, heading: h, center, zoom } = state.properties;
                setPitch(p);
                setHeading(h);
                setCameraCenter(center as [number, number]);
                setCameraZoom(zoom);
                // User moved the map (center or zoom differs from default) → stop following.
                const centerCoord = center as [number, number];
                if (
                  centerCoord != null &&
                  zoom != null &&
                  (Math.abs(centerCoord[0] - defaultCenter[0]) > 1e-5 ||
                    Math.abs(centerCoord[1] - defaultCenter[1]) > 1e-5 ||
                    Math.abs(zoom - DEFAULT_ZOOM) > 0.01)
                ) {
                  setFollowCurrentPosition(false);
                }
              }}
            >
              <LocationPuck />
              <Camera
                ref={cameraRef}
                defaultSettings={{
                  centerCoordinate: currentPosition ?? DEFAULT_CURRENT_POSITION,
                  zoomLevel: DEFAULT_ZOOM,
                }}
              />
              <RouteMarkersLayer
                routesParams={routesParamsForExploreMap}
                onStateChange={setRoutesState}
                cameraRef={cameraRef}
                focusedRouteId={focusedRouteId}
                onRoutePress={(routeId) => {
                  setFollowCurrentPosition(false);
                  setFocusedRouteId(routeId);
                  setCurrentPreview(null); // Clear until new preview loads so we don't show previous route's trails
                }}
                onRouteClusterPress={() => {
                  setFollowCurrentPosition(false);
                  setFocusedRouteId(null);
                  setCurrentPreview(null);
                }}
              />
              <TrailsLayer
                focusedRouteId={focusedRouteId}
                visibleTrailIds={currentPreview?.mapData != null ? [currentPreview.mapData] : []}
              />
        </MapView>
        {focusedRouteId != null && (
          <View style={[styles.previewContainer, { paddingBottom: insets.bottom + 8 }]}>
            <RoutePreview
              routeId={focusedRouteId}
              routeType={
                routesState.data?.features?.find(
                  (f) => f.properties?.id === focusedRouteId
                )?.properties?.type ?? null
              }
              onCurrentPreviewChange={setCurrentPreview}
              onPreviewPress={(preview) => {
                if (preview.source === "ropewiki") {
                  router.push({
                    pathname: "/(tabs)/explore/[id]/page",
                    params: {
                      id: preview.id,
                      source: PageDataSource.Ropewiki,
                      routeType:
                        routesState.data?.features?.find(
                          (f) => f.properties?.id === focusedRouteId
                        )?.properties?.type ?? RouteType.Unknown,
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
          visible={isPositionButtonVisible}
          top={insets.top + MAP_BUTTON_TOP_OFFSET}
        />
        <ResetMapOrientationButton
          onPress={resetPitchAndHeading}
          visible={isCompassVisible}
          top={insets.top + MAP_BUTTON_TOP_OFFSET + MAP_BUTTON_SIZE + MAP_BUTTON_GAP}
        />
        <FilterBottomSheet
          visible={routeFilterSheetOpen}
          onClose={() => {
            setRouteFilterSheetOpen(false);
            setFrozenExploreRoutesParams(null);
            setExploreRouteDraft(null);
          }}
          mode={
            routeFilterSheetOpen && exploreRouteDraft != null
              ? {
                  kind: "explore-route",
                  draft: exploreRouteDraft,
                  onDraftChange: (f) => {
                    setExploreRouteDraft(f);
                    persistExploreFilter(
                      RouteFilter.fromJsonString(f.toString()),
                    );
                  },
                  persisted: explorePersisted,
                  onRevert: () => {
                    persistExploreFilter(null);
                    setExploreRouteDraft(new RouteFilter());
                  },
                }
              : null
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarRow: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  searchBarSpacer: {
    width: SEARCH_BAR_SIDE_WIDTH,
  },
  headerButtonWrap: {
    height: HEADER_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchBarPlaceholder: {
    fontSize: 16,
    color: "#9ca3af",
  },
  map: {
    flex: 1,
    width: "100%",
  },
  previewContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
});
