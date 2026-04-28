import { ResetMapOrientationButton } from "@/components/buttons/ResetMapOrientationButton";
import { ResetMapPositionButton } from "@/components/buttons/ResetMapPositionButton";
import { FilterBottomSheet } from "@/components/filters/FilterBottomSheet";
import { FilterButton } from "@/components/buttons/FilterButton";
import { RoutePreview } from "@/components/routePreview/RoutePreview";
import {
  RouteMarkersLayer,
  type RoutesState,
} from "@/components/screens/explore/RouteMarkersLayer";
import { TrailsLayer } from "@/components/screens/explore/TrailsLayer";
import {
  HEADER_BUTTON_SIZE,
  HEADER_SIDE_SLOT_WIDTH,
  MAP_BUTTON_GAP,
  MAP_BUTTON_SIZE,
  MAP_BUTTON_TOP_OFFSET,
  routePreviewDockedPaddingBottom,
} from "./shared/fullScreenMapLayout";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { MiniMapHeader } from "./shared/MiniMapHeader";
import { miniMapHostStyles } from "./shared/miniMapHostStyles";
import { CAMERA_PADDING, minimapStyles } from "./shared/minimapShared";
import { useMiniMapShell } from "@/components/minimap/miniMapAnimatedCard";
import type { MiniMapReloadRegisterRef } from "@/components/minimap/miniMapHandle";
import { useMiniMapCamera } from "./shared/useMiniMapCamera";
import { Camera, LocationPuck, MapView } from "@rnmapbox/maps";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  type OfflinePagePreview,
  type OnlinePagePreview,
  PageDataSource,
  RouteFilter,
  RoutesParams,
  type OnlineRegionMiniMap,
} from "ropegeo-common/models";

type RegionFitBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

function boundsToFit(b: OnlineRegionMiniMap["bounds"]): RegionFitBounds | null {
  if (b == null) return null;
  return {
    north: b.north,
    south: b.south,
    east: b.east,
    west: b.west,
  };
}

export type RegionMiniMapViewProps = {
  regionMiniMap: OnlineRegionMiniMap;
  regionId: string;
  source: PageDataSource;
  onCollapse: () => void;
  onRoutesStateChange?: (state: RoutesState) => void;
  /** Filled by parent `MiniMap` for imperative `reload`. */
  reloadRegisterRef?: MiniMapReloadRegisterRef;
};

/**
 * Region minimap: fits the camera to API bounds when present and loads route markers via GET /routes
 * using merged filter + {@link OnlineRegionMiniMap.routesParams}.
 */
export function RegionMiniMapView({
  regionMiniMap,
  regionId,
  source,
  onCollapse,
  onRoutesStateChange,
  reloadRegisterRef,
}: RegionMiniMapViewProps) {
  const shell = useMiniMapShell();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const regionFitBounds = boundsToFit(regionMiniMap.bounds);

  const [routesState, setRoutesState] = useState<RoutesState>({
    loading: true,
    refreshing: false,
    data: null,
    errors: null,
    received: 0,
    total: null,
    timeoutCountdown: null,
  });

  const handleRoutesStateChange = useCallback(
    (state: RoutesState) => {
      setRoutesState(state);
      onRoutesStateChange?.(state);
    },
    [onRoutesStateChange],
  );
  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const [currentPreview, setCurrentPreview] = useState<
    OnlinePagePreview | OfflinePagePreview | null
  >(null);
  const [regionRouteFilter, setRegionRouteFilter] = useState<RouteFilter>(
    () => new RouteFilter([source]),
  );
  const [regionFilterOpen, setRegionFilterOpen] = useState(false);

  useEffect(() => {
    setRegionRouteFilter(new RouteFilter([source]));
  }, [source, regionId]);

  const regionRoutesParams = useMemo((): RoutesParams => {
    const base = regionRouteFilter.toRoutesParams();
    const server = regionMiniMap.routesParams;
    const reg = server.region;
    if (reg == null) {
      throw new Error("OnlineRegionMiniMap.routesParams.region is required");
    }
    const catalogue =
      regionRouteFilter.sources != null && regionRouteFilter.sources.length > 0
        ? regionRouteFilter.sources[0]
        : source;
    return new RoutesParams({
      region: { id: reg.id, source: catalogue },
      sources: null,
      routeTypes: base.routeTypes ?? server.routeTypes,
      difficulty: base.difficulty ?? server.difficulty,
      limit: server.limit,
      page: server.page,
    });
  }, [regionRouteFilter, regionMiniMap.routesParams, source]);

  const {
    cameraRef,
    fitToBounds,
    resetPitchAndHeading,
    captureHome,
    onCameraChanged,
    compassVisible,
    positionButtonVisible,
  } = useMiniMapCamera({ expanded: shell.expanded });

  const collapseCleanup = useCallback(() => {
    setFocusedRouteId(null);
    setCurrentPreview(null);
    resetPitchAndHeading();
  }, [resetPitchAndHeading]);

  useEffect(() => {
    shell.registerCollapseCleanup(collapseCleanup);
    return () => shell.registerCollapseCleanup(null);
  }, [shell.registerCollapseCleanup, collapseCleanup]);

  useEffect(() => {
    if (!regionFitBounds) return;
    fitToBounds(regionFitBounds, CAMERA_PADDING, 0);
    requestAnimationFrame(() => fitToBounds(regionFitBounds, CAMERA_PADDING, 0));
  }, [regionFitBounds, fitToBounds]);

  useEffect(() => {
    if (!shell.mountNativeMap || !shell.anchorRect) return;
    if (shell.expanded) {
      captureHome();
      return;
    }
    if (regionFitBounds) {
      const timer = setTimeout(() => fitToBounds(regionFitBounds, CAMERA_PADDING), 260);
      return () => clearTimeout(timer);
    }
  }, [
    shell.anchorRect,
    shell.mountNativeMap,
    shell.expanded,
    captureHome,
    fitToBounds,
    regionFitBounds,
  ]);

  const resetPosition = () => {
    setFocusedRouteId(null);
    setCurrentPreview(null);
    if (regionFitBounds) {
      captureHome();
      fitToBounds(regionFitBounds, shell.expandedPadding);
      requestAnimationFrame(() => fitToBounds(regionFitBounds, shell.expandedPadding));
    }
  };

  const routesRequestError = routesState.errors;
  const hasRoutesData =
    routesState.data != null && routesState.data.features.length > 0;
  const routesBlockingErrorMessage =
    routesRequestError != null && !hasRoutesData
      ? routesRequestError.message
      : null;
  const routesInitialLoading =
    routesState.loading &&
    routesState.data == null &&
    routesState.errors == null;

  useEffect(() => {
    shell.setBlockingErrorMessage(routesBlockingErrorMessage);
  }, [routesBlockingErrorMessage, shell.setBlockingErrorMessage]);

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
    shell.setLoadingOverlayVisible(
      shell.mapBodyVisible &&
        routesBlockingErrorMessage == null &&
        routesInitialLoading,
    );
  }, [
    routesInitialLoading,
    routesBlockingErrorMessage,
    shell.mapBodyVisible,
    shell.setLoadingOverlayVisible,
  ]);

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
          <Camera ref={cameraRef} />
          <RouteMarkersLayer
            routesParams={regionRoutesParams}
            onStateChange={handleRoutesStateChange}
            cameraRef={cameraRef}
            focusedRouteId={shell.expanded ? focusedRouteId : null}
            onRoutePress={(routeId) => {
              if (!shell.expanded) return;
              setFocusedRouteId(routeId);
              setCurrentPreview(null);
            }}
            onRouteClusterPress={() => {
              if (!shell.expanded) return;
              setFocusedRouteId(null);
              setCurrentPreview(null);
            }}
          />
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
          <MiniMapHeader
            title={regionMiniMap.title}
            onBack={onCollapse}
            top={insets.top + 8}
            rightSlot={
              <View style={[localStyles.filterButtonWrap, { width: HEADER_SIDE_SLOT_WIDTH }]}>
                <FilterButton persisted={false} onPress={() => setRegionFilterOpen(true)} />
              </View>
            }
          />
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
                  routesState.data?.features?.find((f) => f.properties?.id === focusedRouteId)
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
      <FilterBottomSheet
        visible={regionFilterOpen}
        onClose={() => setRegionFilterOpen(false)}
        mode={
          regionFilterOpen
            ? {
                kind: "region-route",
                draft: regionRouteFilter,
                onDraftChange: setRegionRouteFilter,
                onReset: () => setRegionRouteFilter(new RouteFilter([source])),
              }
            : null
        }
      />
    </>
  );
}

const localStyles = StyleSheet.create({
  filterButtonWrap: {
    height: HEADER_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
});

const expandedChromeStyles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
});
