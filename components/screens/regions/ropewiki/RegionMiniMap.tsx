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
import {
  RouteMarkersLayer,
  type RoutesState,
} from "@/components/screens/explore/RouteMarkersLayer";
import { TrailsLayer } from "@/components/screens/explore/TrailsLayer";
import {
  Method,
  RopeGeoHttpRequest,
  Service,
} from "ropegeo-common/components";
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
import { Platform, StyleSheet, View } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import {
  Bounds,
  PageDataSource,
  RouteFilter,
  type PagePreview as PagePreviewType,
  type RoutesGeojson,
  RouteType,
} from "ropegeo-common/classes";

type RegionFitBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

function isNonNullBounds(b: unknown): b is RegionFitBounds {
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

type RegionMiniMapProps = {
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
  onRoutesStateChange?: (state: RoutesState) => void;
};

type RegionMiniMapBodyProps = RegionMiniMapProps & {
  regionFitBounds: RegionFitBounds | null;
};

/**
 * Region minimap: outer shell loads GET /ropewiki/region/{id}/bounds when the native map is mounted;
 * {@link RegionMiniMapBody} receives fit bounds as props (same pattern as RopewikiPageScreen + PageScreenBody).
 */
export function RegionMiniMap(props: RegionMiniMapProps) {
  const { anchorRect, mountNativeMap, regionId, ...bodyRest } = props;

  if (!anchorRect) return null;

  if (!mountNativeMap) {
    return <RegionMiniMapBody {...props} regionFitBounds={null} />;
  }

  return (
    <RopeGeoHttpRequest<Bounds>
      key={regionId}
      service={Service.WEBSCRAPER}
      method={Method.GET}
      path="/ropewiki/region/:id/bounds"
      pathParams={{ id: regionId }}
    >
      {({ data, errors }) => {
        const regionFitBounds =
          errors != null || data == null || !isNonNullBounds(data) ? null : data;
        return (
          <RegionMiniMapBody
            {...bodyRest}
            anchorRect={anchorRect}
            mountNativeMap={mountNativeMap}
            regionId={regionId}
            regionFitBounds={regionFitBounds}
          />
        );
      }}
    </RopeGeoHttpRequest>
  );
}

function RegionMiniMapBody({
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
  regionFitBounds,
  onRoutesStateChange,
}: RegionMiniMapBodyProps) {
  const router = useRouter();

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
  filterButtonWrap: {
    height: HEADER_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
});
