import { ResetMapOrientationButton } from "@/components/buttons/ResetMapOrientationButton";
import { ResetMapPositionButton } from "@/components/buttons/ResetMapPositionButton";
import { MiniMapHeader } from "@/components/minimap/MiniMapHeader";
import { miniMapHostStyles } from "@/components/minimap/miniMapHostStyles";
import {
  CAMERA_PADDING,
  MiniMapExpandButton,
  minimapStyles,
} from "@/components/minimap/minimapShared";
import { type Rect, useMiniMapAnimation } from "@/components/minimap/useMiniMapAnimation";
import { useMiniMapCamera } from "@/components/minimap/useMiniMapCamera";
import { FilterBottomSheet } from "@/components/filters/FilterBottomSheet";
import { FilterButton } from "@/components/buttons/FilterButton";
import { RoutePreview } from "@/components/routePreview/RoutePreview";
import { RouteMarkersLayer } from "@/components/screens/explore/RouteMarkersLayer";
import { TrailsLayer } from "@/components/screens/explore/TrailsLayer";
import {
  HEADER_BUTTON_SIZE,
  HEADER_SIDE_SLOT_WIDTH,
  MAP_BUTTON_GAP,
  MAP_BUTTON_SIZE,
  MAP_BUTTON_TOP_OFFSET,
} from "@/components/minimap/fullScreenMapLayout";
import { Camera, LocationPuck, MapView } from "@rnmapbox/maps";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import {
  PageDataSource,
  RouteFilter,
  type PagePreview as PagePreviewType,
  type RoutesGeojson,
  RouteType,
} from "ropegeo-common/classes";

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

export function RegionMiniMap({
  regionName,
  regionId,
  source,
  mountNativeMap,
  expanded,
  anchorRect,
  baseScrollY,
  scrollY,
  onExpand,
  onCollapse,
}: {
  regionName: string;
  regionId: string;
  source: PageDataSource;
  mountNativeMap: boolean;
  expanded: boolean;
  anchorRect: Rect | null;
  baseScrollY: number;
  scrollY: SharedValue<number>;
  onExpand: () => void;
  onCollapse: () => void;
}) {
  const router = useRouter();

  const [routesState, setRoutesState] = useState<{
    loading: boolean;
    data: RoutesGeojson | null;
    errors: Error | null;
  }>({ loading: true, data: null, errors: null });
  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const [currentPreview, setCurrentPreview] = useState<PagePreviewType | null>(null);
  const [regionRouteFilter, setRegionRouteFilter] = useState<RouteFilter>(
    () => new RouteFilter([source], regionId),
  );
  const [regionFilterOpen, setRegionFilterOpen] = useState(false);

  useEffect(() => {
    setRegionRouteFilter(new RouteFilter([source], regionId));
  }, [source, regionId]);

  const regionRoutesParams = useMemo(
    () => regionRouteFilter.toRoutesParams(),
    [regionRouteFilter],
  );

  const routesBounds = useMemo(() => {
    return routesState.data && isNonNullBounds(routesState.data.bounds)
      ? routesState.data.bounds
      : null;
  }, [routesState.data]);

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
    if (!routesBounds) return;
    fitToBounds(routesBounds, CAMERA_PADDING, 0);
    requestAnimationFrame(() => fitToBounds(routesBounds, CAMERA_PADDING, 0));
  }, [routesBounds, fitToBounds]);

  useEffect(() => {
    if (!mountNativeMap || !anchorRect) return;
    if (expanded) {
      captureHome();
    } else if (routesBounds) {
      const timer = setTimeout(() => fitToBounds(routesBounds, CAMERA_PADDING), 260);
      return () => clearTimeout(timer);
    }
  }, [anchorRect, captureHome, expanded, fitToBounds, routesBounds, mountNativeMap]);

  const resetPosition = () => {
    setFocusedRouteId(null);
    setCurrentPreview(null);
    if (routesBounds) {
      captureHome();
      fitToBounds(routesBounds, expandedPadding);
      requestAnimationFrame(() => fitToBounds(routesBounds, expandedPadding));
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
              onStateChange={setRoutesState}
              cameraRef={cameraRef}
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
        {!expanded && routesState.loading && (
          <View style={localStyles.collapsedLoading} pointerEvents="none">
            <ActivityIndicator size="large" color="#666" />
          </View>
        )}
        {!expanded && <MiniMapExpandButton onPress={onExpand} />}
      </Animated.View>
      {expanded && (
        <>
          {routesState.loading && (
            <View style={[miniMapHostStyles.loadingOverlay, { paddingTop: insets.top + 16 }]} pointerEvents="none">
              <ActivityIndicator size="large" />
            </View>
          )}
          <MiniMapHeader
            title={regionName}
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
                onApply: () => setRegionFilterOpen(false),
                onReset: () =>
                  setRegionRouteFilter(new RouteFilter([source], regionId)),
              }
            : null
        }
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  collapsedLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(240, 240, 240)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  filterButtonWrap: {
    height: HEADER_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
});
