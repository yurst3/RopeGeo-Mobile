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
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import {
  PageDataSource,
  type PagePreview as PagePreviewType,
  type RoutesGeojson,
  RouteType,
} from "ropegeo-common";

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
  const routesQueryParams = useMemo(() => ({ source, region: regionId }), [source, regionId]);

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
              routesQueryParams={routesQueryParams}
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
                <Pressable
                  onPress={() => {}}
                  style={({ pressed }) => [localStyles.filterButton, pressed && localStyles.filterButtonPressed]}
                  accessibilityLabel="Filter"
                  accessibilityRole="button"
                >
                  <FontAwesome5 name="filter" size={18} color="#111827" />
                </Pressable>
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
  filterButton: {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    borderRadius: HEADER_BUTTON_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  filterButtonPressed: {
    opacity: 0.6,
  },
});
