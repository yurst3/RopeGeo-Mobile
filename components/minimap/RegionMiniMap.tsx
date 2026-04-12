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
} from "./fullScreenMapLayout";
import { MiniMapHeader } from "./MiniMapHeader";
import { miniMapHostStyles } from "./miniMapHostStyles";
import {
  CAMERA_PADDING,
  MiniMapExpandButton,
  minimapStyles,
} from "./minimapShared";
import { type Rect, useMiniMapAnimation } from "./useMiniMapAnimation";
import { useMiniMapCamera } from "./useMiniMapCamera";
import { Camera, LocationPuck, MapView } from "@rnmapbox/maps";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import {
  PageDataSource,
  RouteFilter,
  RoutesParams,
  type PagePreview as PagePreviewType,
  type RegionMiniMap as RegionMiniMapConfig,
  RouteType,
} from "ropegeo-common/models";

type RegionFitBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

function boundsToFit(b: RegionMiniMapConfig["bounds"]): RegionFitBounds | null {
  if (b == null) return null;
  return {
    north: b.north,
    south: b.south,
    east: b.east,
    west: b.west,
  };
}

export type RegionMiniMapProps = {
  regionMiniMap: RegionMiniMapConfig;
  regionId: string;
  source: PageDataSource;
  mountNativeMap: boolean;
  expanded: boolean;
  anchorRect: Rect | null;
  baseScrollY: number;
  scrollY: SharedValue<number>;
  onExpand: () => void;
  onCollapse: () => void;
  onRoutesStateChange?: (state: RoutesState) => void;
};

/**
 * Region minimap: fits the camera to API {@link RegionMiniMap.bounds} when present and loads
 * route markers via GET /routes using merged filter + {@link RegionMiniMap.routesParams}.
 */
export function RegionMiniMap({
  regionMiniMap,
  regionId,
  source,
  mountNativeMap,
  expanded,
  anchorRect,
  baseScrollY,
  scrollY,
  onExpand,
  onCollapse,
  onRoutesStateChange,
}: RegionMiniMapProps) {
  const router = useRouter();
  const regionFitBounds = boundsToFit(regionMiniMap.bounds);

  const [routesState, setRoutesState] = useState<RoutesState>({
    loading: true,
    data: null,
    errors: null,
    received: 0,
    total: null,
  });

  const handleRoutesStateChange = useCallback(
    (state: RoutesState) => {
      setRoutesState(state);
      onRoutesStateChange?.(state);
    },
    [onRoutesStateChange],
  );
  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const [currentPreview, setCurrentPreview] = useState<PagePreviewType | null>(null);
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
      throw new Error("RegionMiniMap.routesParams.region is required");
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
  } = useMiniMapCamera({ expanded });

  const collapseCleanup = useCallback(() => {
    setFocusedRouteId(null);
    setCurrentPreview(null);
    resetPitchAndHeading();
  }, [resetPitchAndHeading]);

  const { cardStyle, expandedPadding, insets } = useMiniMapAnimation({
    anchorRect,
    baseScrollY,
    scrollY,
    expanded,
    onCollapseTransition: collapseCleanup,
  });

  useEffect(() => {
    if (!regionFitBounds) return;
    fitToBounds(regionFitBounds, CAMERA_PADDING, 0);
    requestAnimationFrame(() => fitToBounds(regionFitBounds, CAMERA_PADDING, 0));
  }, [regionFitBounds, fitToBounds]);

  useEffect(() => {
    if (!mountNativeMap || !anchorRect) return;
    if (expanded) {
      captureHome();
    } else if (regionFitBounds) {
      const timer = setTimeout(() => fitToBounds(regionFitBounds, CAMERA_PADDING), 260);
      return () => clearTimeout(timer);
    }
  }, [anchorRect, captureHome, expanded, fitToBounds, regionFitBounds, mountNativeMap]);

  const resetPosition = () => {
    setFocusedRouteId(null);
    setCurrentPreview(null);
    if (regionFitBounds) {
      captureHome();
      fitToBounds(regionFitBounds, expandedPadding);
      requestAnimationFrame(() => fitToBounds(regionFitBounds, expandedPadding));
    }
  };

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
            <Camera ref={cameraRef} />
            <RouteMarkersLayer
              routesParams={regionRoutesParams}
              onStateChange={handleRoutesStateChange}
              cameraRef={cameraRef}
              focusedRouteId={expanded ? focusedRouteId : null}
              onRoutePress={(routeId) => {
                if (!expanded) return;
                setFocusedRouteId(routeId);
                setCurrentPreview(null);
              }}
              onRouteClusterPress={() => {
                if (!expanded) return;
                setFocusedRouteId(null);
                setCurrentPreview(null);
              }}
            />
            <TrailsLayer
              focusedRouteId={expanded ? focusedRouteId : null}
              visibleTrailIds={expanded && currentPreview?.mapData != null ? [currentPreview.mapData] : []}
            />
          </MapView>
        )}
        {!expanded && <MiniMapExpandButton onPress={onExpand} />}
      </Animated.View>
      {expanded && (
        <>
          <MiniMapHeader
            title={regionMiniMap.title}
            onBack={onCollapse}
            top={insets.top + 8}
            rightSlot={
              <View style={[localStyles.filterButtonWrap, { width: HEADER_SIDE_SLOT_WIDTH }]}>
                <FilterButton
                  persisted={false}
                  onPress={() => setRegionFilterOpen(true)}
                />
              </View>
            }
          />
          {focusedRouteId != null && (
            <View style={[miniMapHostStyles.previewContainer, { paddingBottom: insets.bottom + 8 }]}>
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
                        routeType:
                          routesState.data?.features?.find((f) => f.properties?.id === focusedRouteId)
                            ?.properties?.type ?? RouteType.Unknown,
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
    </View>
  );
}

const localStyles = StyleSheet.create({
  filterButtonWrap: {
    height: HEADER_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
});
