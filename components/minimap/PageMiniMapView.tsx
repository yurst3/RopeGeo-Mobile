import { ResetMapOrientationButton } from "@/components/buttons/ResetMapOrientationButton";
import { ResetMapPositionButton } from "@/components/buttons/ResetMapPositionButton";
import {
  MAP_BUTTON_GAP,
  MAP_BUTTON_SIZE,
  MAP_BUTTON_TOP_OFFSET,
} from "./shared/fullScreenMapLayout";
import { MiniMapHeader } from "./shared/MiniMapHeader";
import { PageMiniMapLegend } from "./shared/PageMiniMapLegend";
import {
  boundsFromLegendItem,
  boundsFromPositions,
  contrastHaloColor,
  filterRenderedLinesForSelectionKey,
  isLineRowSelectionKey,
  legendItemForKey,
  lineFeatureSelectionKey,
  lineSelectionBounds,
  lineSelectionStyle,
} from "./shared/pageMiniMapSegments";
import {
  CAMERA_PADDING,
  MINIMAP_FIT_BOUNDS_ANIMATION_MS,
  minimapStyles,
} from "./shared/minimapShared";
import { TRAIL_VECTOR_LINE_STYLE } from "./shared/trailVectorLineStyle";
import { useMiniMapShell } from "@/components/minimap/miniMapAnimatedCard";
import type { MiniMapReloadRegisterRef } from "@/components/minimap/miniMapHandle";
import { useMiniMapCamera } from "./shared/useMiniMapCamera";
import {
  ROUTE_MARKER_ICON_SIZE_INTERPOLATE,
} from "@/components/screens/explore/routeMarkerIcons";
import {
  Camera,
  Images,
  LineLayer,
  LocationPuck,
  MapView,
  ShapeSource,
  SymbolLayer,
  VectorSource,
} from "@rnmapbox/maps";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import type { ComponentRef } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import {
  Bounds,
  type OfflinePageMiniMap,
  type OnlinePageMiniMap,
} from "ropegeo-common/models";

const PAGE_VECTOR_SOURCE_ID = "page-mini-map-tiles";
const PAGE_LINE_LAYER_ID = "page-mini-map-line";
const PAGE_POINT_LABEL_LAYER_ID = "page-mini-map-point-labels";
const PAGE_POINT_ICON_LAYER_ID = "page-mini-map-point-icons";
const PAGE_SELECTED_HALO_SOURCE_ID = "page-mini-map-selected-halo";
const PAGE_SELECTED_HALO_LAYER_ID = "page-mini-map-selected-halo-line";
const PAGE_SELECTED_OVERLAY_LAYER_ID = "page-mini-map-selected-overlay-line";

const PAGE_POINT_MARKER_IMAGES = {
  "page-map-marker": require("@/assets/images/icons/markers/marker.png"),
  "page-map-marker-selected": require("@/assets/images/icons/markers/markerSelected.png"),
} as const;

const LINE_ONLY_FILTER: ["==", ["geometry-type"], "LineString"] = [
  "==",
  ["geometry-type"],
  "LineString",
];

const POINT_ONLY_FILTER: ["==", ["geometry-type"], "Point"] = [
  "==",
  ["geometry-type"],
  "Point",
];

/** Mapbox `queryRenderedFeaturesInRect` bbox: `[top, left, bottom, right]` ≈ `[minY, minX, maxY, maxX]`. */
async function mapBoundsToRenderedScreenRect(
  map: ComponentRef<typeof MapView>,
  bounds: Bounds,
  padPx: number,
  viewW: number,
  viewH: number,
): Promise<[number, number, number, number]> {
  const corners: GeoJSON.Position[] = [
    [bounds.west, bounds.north],
    [bounds.east, bounds.north],
    [bounds.east, bounds.south],
    [bounds.west, bounds.south],
  ];
  const xs: number[] = [];
  const ys: number[] = [];
  for (const c of corners) {
    try {
      const [x, y] = await map.getPointInView(c);
      xs.push(x as number);
      ys.push(y as number);
    } catch {
      /* ignore */
    }
  }
  if (xs.length === 0) {
    return [0, 0, Math.max(1, viewH), Math.max(1, viewW)];
  }
  let minX = Math.min(...xs) - padPx;
  let maxX = Math.max(...xs) + padPx;
  let minY = Math.min(...ys) - padPx;
  let maxY = Math.max(...ys) + padPx;
  const minEdge = 28;
  if (maxX - minX < minEdge) {
    const cx = (minX + maxX) / 2;
    minX = cx - minEdge / 2;
    maxX = cx + minEdge / 2;
  }
  if (maxY - minY < minEdge) {
    const cy = (minY + maxY) / 2;
    minY = cy - minEdge / 2;
    maxY = cy + minEdge / 2;
  }
  minX = Math.max(0, minX);
  maxX = Math.min(viewW, maxX);
  minY = Math.max(0, minY);
  maxY = Math.min(viewH, maxY);
  return [minY, minX, maxY, maxX];
}

/** Online or offline page tile minimap configuration from ropegeo-common. */
export type PageMiniMapTileProps = OnlinePageMiniMap | OfflinePageMiniMap;

export type PageMiniMapViewProps = {
  miniMap: PageMiniMapTileProps;
  onCollapse: () => void;
  reloadRegisterRef?: MiniMapReloadRegisterRef;
};

export function PageMiniMapView({ miniMap, onCollapse, reloadRegisterRef }: PageMiniMapViewProps) {
  const shell = useMiniMapShell();
  const tabBarHeight = useBottomTabBarHeight();
  const b = miniMap.bounds;
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const tileTemplate =
    miniMap.fetchType === "offline"
      ? miniMap.offlineTilesTemplate
      : miniMap.onlineTilesTemplate;
  const miniMapReloadKey = useMemo(
    () =>
      `${miniMap.fetchType}:${miniMap.polyLineLayerId}:${miniMap.pointLayerId}:${tileTemplate}`,
    [miniMap.fetchType, miniMap.polyLineLayerId, miniMap.pointLayerId, tileTemplate],
  );
  const hasPageLegend = useMemo(
    () => miniMap.legend != null && Object.keys(miniMap.legend).length > 0,
    [miniMap.legend],
  );
  const {
    cameraRef,
    fitToBounds,
    resetPitchAndHeading,
    captureHome,
    onCameraChanged,
    compassVisible,
    positionButtonVisible,
  } = useMiniMapCamera({
    expanded: shell.expanded,
    initialHomeCenter: [b.west, b.south],
  });

  const mapRef = useRef<ComponentRef<typeof MapView>>(null);
  const selectedPointLngLatRef = useRef<[number, number] | null>(null);
  /** After line selection + `fitToBounds`, wait before `queryRenderedFeaturesInRect` so tiles match the camera. */
  const lineHighlightWaitForCameraRef = useRef(false);

  const [selectedSegmentKey, setSelectedSegmentKey] = useState<string | null>(null);
  const [pointTooltip, setPointTooltip] = useState<{ x: number; y: number; fullName: string } | null>(
    null,
  );
  const [legendExpanded, setLegendExpanded] = useState(false);
  const [selectedLineHighlight, setSelectedLineHighlight] = useState<GeoJSON.FeatureCollection | null>(
    null,
  );
  const [selectedLineStyle, setSelectedLineStyle] = useState<{
    stroke: string;
    strokeWidth: number;
  } | null>(null);

  const clearMapSelections = useCallback(() => {
    setSelectedSegmentKey(null);
    setPointTooltip(null);
    selectedPointLngLatRef.current = null;
  }, []);

  useEffect(() => {
    const cleanup = () => {
      resetPitchAndHeading();
      clearMapSelections();
      setLegendExpanded(false);
    };
    shell.registerCollapseCleanup(cleanup);
    return () => shell.registerCollapseCleanup(null);
  }, [shell.registerCollapseCleanup, resetPitchAndHeading, clearMapSelections]);

  useEffect(() => {
    if (!shell.expanded) {
      clearMapSelections();
      setLegendExpanded(false);
    }
  }, [shell.expanded, clearMapSelections]);

  useEffect(() => {
    if (!shell.mountNativeMap) return;
    if (shell.expanded) {
      captureHome();
      return;
    }
    const timer = setTimeout(() => fitToBounds(b, CAMERA_PADDING), 260);
    return () => clearTimeout(timer);
  }, [
    b,
    captureHome,
    fitToBounds,
    shell.anchorRect,
    shell.expanded,
    shell.mountNativeMap,
  ]);

  const resetPosition = () => {
    captureHome();
    fitToBounds(b, shell.expandedPadding);
    requestAnimationFrame(() => fitToBounds(b, shell.expandedPadding));
  };

  const [mapFinishedLoading, setMapFinishedLoading] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<Error | null>(null);

  useEffect(() => {
    if (!shell.mountNativeMap) {
      setMapFinishedLoading(false);
    }
  }, [shell.mountNativeMap]);

  useEffect(() => {
    setMapFinishedLoading(false);
    setMapLoadError(null);
    setSelectedLineHighlight(null);
    setSelectedLineStyle(null);
    clearMapSelections();
    setLegendExpanded(false);
  }, [miniMapReloadKey, clearMapSelections]);

  const mapBlockingErrorMessage =
    mapLoadError != null && !mapFinishedLoading ? mapLoadError.message : null;

  useEffect(() => {
    shell.setBlockingErrorMessage(mapBlockingErrorMessage);
  }, [mapBlockingErrorMessage, shell.setBlockingErrorMessage]);

  const reloadMinimap = useCallback(() => {
    setMapLoadError(null);
    setMapFinishedLoading(false);
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
        mapBlockingErrorMessage == null &&
        !mapFinishedLoading,
    );
  }, [
    mapFinishedLoading,
    mapBlockingErrorMessage,
    shell.mapBodyVisible,
    shell.setLoadingOverlayVisible,
  ]);

  const refreshTooltipScreenPosition = useCallback(async () => {
    const map = mapRef.current;
    const ll = selectedPointLngLatRef.current;
    if (!map || ll == null) return;
    try {
      const [x, y] = await map.getPointInView(ll);
      setPointTooltip((prev) =>
        prev ? { ...prev, x: x as number, y: y as number } : prev,
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mapFinishedLoading || !shell.expanded || mapRef.current == null) {
      setSelectedLineHighlight(null);
      setSelectedLineStyle(null);
      return;
    }
    if (selectedSegmentKey == null) {
      setSelectedLineHighlight(null);
      setSelectedLineStyle(null);
      return;
    }
    const geoBounds = lineSelectionBounds(selectedSegmentKey, miniMap.legend);
    if (geoBounds == null) {
      setSelectedLineHighlight(null);
      setSelectedLineStyle(null);
      return;
    }
    const style = lineSelectionStyle(selectedSegmentKey, miniMap.legend);
    const legend = miniMap.legend;
    const key = selectedSegmentKey;
    let cancelled = false;
    const run = async () => {
      const longDelay = lineHighlightWaitForCameraRef.current;
      await new Promise((r) =>
        setTimeout(r, longDelay ? MINIMAP_FIT_BOUNDS_ANIMATION_MS : 90),
      );
      if (cancelled || mapRef.current == null) return;
      const map = mapRef.current;
      try {
        const rect = await mapBoundsToRenderedScreenRect(
          map,
          geoBounds,
          14,
          windowWidth,
          windowHeight,
        );
        const fc = await map.queryRenderedFeaturesInRect(rect, LINE_ONLY_FILTER, [PAGE_LINE_LAYER_ID]);
        if (cancelled) return;
        const hits = fc?.features ?? [];
        const lines = filterRenderedLinesForSelectionKey(hits, key, legend);
        if (lines.length === 0) {
          lineHighlightWaitForCameraRef.current = false;
          setSelectedLineHighlight(null);
          setSelectedLineStyle(null);
          return;
        }
        lineHighlightWaitForCameraRef.current = false;
        setSelectedLineHighlight({ type: "FeatureCollection", features: lines });
        setSelectedLineStyle(style);
      } catch {
        lineHighlightWaitForCameraRef.current = false;
        if (!cancelled) {
          setSelectedLineHighlight(null);
          setSelectedLineStyle(null);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [
    selectedSegmentKey,
    mapFinishedLoading,
    shell.expanded,
    miniMap.legend,
    miniMapReloadKey,
    windowWidth,
    windowHeight,
  ]);

  const pointIconImageExpr = useMemo(() => {
    const none = "__none__";
    const key = selectedSegmentKey ?? none;
    return [
      "case",
      ["==", ["to-string", ["get", "legendId"]], key],
      "page-map-marker-selected",
      "page-map-marker",
    ] as const;
  }, [selectedSegmentKey]);

  const onMapPress = useCallback(
    async (feature: GeoJSON.Feature<GeoJSON.Point, { screenPointX: number; screenPointY: number }>) => {
      if (!shell.expanded) return;
      const map = mapRef.current;
      if (!map) return;
      const { screenPointX, screenPointY } = feature.properties;
      try {
        const fc = await map.queryRenderedFeaturesAtPoint(
          [screenPointX, screenPointY],
          [],
          [
            PAGE_POINT_ICON_LAYER_ID,
            PAGE_POINT_LABEL_LAYER_ID,
            PAGE_LINE_LAYER_ID,
          ],
        );
        const hits = fc?.features ?? [];
        const pointHit = hits.find(
          (h: GeoJSON.Feature) => h.geometry?.type === "Point",
        ) as GeoJSON.Feature<GeoJSON.Point> | undefined;
        const lineHit = hits.find(
          (h: GeoJSON.Feature) => h.geometry?.type === "LineString",
        ) as GeoJSON.Feature<GeoJSON.LineString> | undefined;

        if (pointHit?.geometry?.type === "Point") {
          const props = pointHit.properties as Record<string, unknown> | null;
          const key = String(props?.legendId ?? "").trim();
          if (!key) return;
          const fullName = String(props?.name ?? "").trim();
          const [lng, lat] = pointHit.geometry.coordinates;
          selectedPointLngLatRef.current = [lng, lat];
          setSelectedSegmentKey(key);
          const z = await map.getZoom();
          cameraRef.current?.setCamera({
            centerCoordinate: [lng, lat],
            zoomLevel: Math.max(z, 15),
            animationDuration: 280,
          });
          try {
            const [px, py] = await map.getPointInView([lng, lat]);
            setPointTooltip({ x: px as number, y: py as number, fullName: fullName || " " });
          } catch {
            setPointTooltip({ x: screenPointX, y: screenPointY - 40, fullName: fullName || " " });
          }
          if (hasPageLegend) setLegendExpanded(true);
          return;
        }

        if (lineHit?.geometry?.type === "LineString") {
          const lineName = String(
            (lineHit.properties as Record<string, unknown> | null)?.name ?? "",
          ).trim();
          if (!lineName) {
            clearMapSelections();
            return;
          }
          const key = lineFeatureSelectionKey(lineHit);
          const legendItem = legendItemForKey(miniMap.legend, key);
          let fitBounds: Bounds | null =
            legendItem != null ? boundsFromLegendItem(legendItem) : null;
          if (fitBounds == null) {
            fitBounds = boundsFromPositions(lineHit.geometry.coordinates);
          }
          lineHighlightWaitForCameraRef.current = fitBounds != null;
          if (fitBounds != null) {
            fitToBounds(fitBounds, shell.expandedPadding);
          }
          setSelectedSegmentKey(key);
          setPointTooltip(null);
          selectedPointLngLatRef.current = null;
          if (hasPageLegend) setLegendExpanded(true);
          return;
        }
      } catch {
        /* fall through to clear */
      }
      clearMapSelections();
    },
    [
      shell.expanded,
      cameraRef,
      clearMapSelections,
      hasPageLegend,
      miniMap.legend,
      fitToBounds,
      shell.expandedPadding,
    ],
  );

  const onCameraChangedWrapped = useCallback(
    (state: { properties: { pitch: number; heading: number; center: unknown; zoom: number } }) => {
      onCameraChanged(state);
      if (selectedPointLngLatRef.current != null) void refreshTooltipScreenPosition();
    },
    [onCameraChanged, refreshTooltipScreenPosition],
  );

  const handleLegendSelectSegment = useCallback(
    (key: string) => {
      setPointTooltip(null);
      selectedPointLngLatRef.current = null;
      setSelectedSegmentKey(key);
      setLegendExpanded(true);
      const item = legendItemForKey(miniMap.legend, key);
      const bounds = item != null ? boundsFromLegendItem(item) : undefined;
      const willFit = bounds != null;
      lineHighlightWaitForCameraRef.current =
        willFit && isLineRowSelectionKey(key, miniMap.legend);
      if (bounds != null) {
        fitToBounds(bounds, shell.expandedPadding);
      }
    },
    [miniMap.legend, fitToBounds, shell.expandedPadding],
  );

  useEffect(() => {
    void refreshTooltipScreenPosition();
  }, [pointTooltip?.fullName, refreshTooltipScreenPosition]);

  const { insets } = shell;
  const legendMaxH = windowHeight / 3;
  const legendMaxW = windowWidth / 2;
  /** Tab bar + home indicator + gap so the legend sits above the tab bar (same as docked RoutePreview). */
  const legendBottomOffset = useMemo(
    () => tabBarHeight + 12,
    [tabBarHeight],
  );

  return (
    <>
      {shell.mapBodyVisible ? (
        <View style={minimapStyles.map} pointerEvents={shell.expanded ? "auto" : "none"}>
          <MapView
            ref={mapRef}
            styleURL="mapbox://styles/mapbox/outdoors-v12"
            style={StyleSheet.absoluteFill}
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
            onCameraChanged={onCameraChangedWrapped}
            onPress={onMapPress}
            onDidFinishLoadingMap={() => setMapFinishedLoading(true)}
            onMapLoadingError={() => setMapLoadError(new Error("Could not load map"))}
          >
            <LocationPuck />
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
            <Images images={{ ...PAGE_POINT_MARKER_IMAGES }} />
            <VectorSource id={PAGE_VECTOR_SOURCE_ID} tileUrlTemplates={[tileTemplate]}>
              <LineLayer
                id={PAGE_LINE_LAYER_ID}
                sourceLayerID={miniMap.polyLineLayerId}
                filter={LINE_ONLY_FILTER}
                style={TRAIL_VECTOR_LINE_STYLE}
              />
              <SymbolLayer
                id={PAGE_POINT_LABEL_LAYER_ID}
                sourceLayerID={miniMap.pointLayerId}
                filter={POINT_ONLY_FILTER}
                style={{
                  textField: ["coalesce", ["get", "name"], " "],
                  textSize: 11,
                  textColor: "#111111",
                  textHaloColor: "#ffffff",
                  textHaloWidth: 1.2,
                  textOffset: [0, 2.1],
                  textAnchor: "top",
                  textAllowOverlap: true,
                  textIgnorePlacement: true,
                  textMaxWidth: 8,
                }}
              />
              <SymbolLayer
                id={PAGE_POINT_ICON_LAYER_ID}
                sourceLayerID={miniMap.pointLayerId}
                filter={POINT_ONLY_FILTER}
                style={{
                  iconImage: pointIconImageExpr,
                  iconSize: ROUTE_MARKER_ICON_SIZE_INTERPOLATE,
                  iconAllowOverlap: true,
                  iconIgnorePlacement: true,
                  iconAnchor: "center",
                }}
              />
            </VectorSource>
            {selectedLineHighlight != null &&
            selectedLineStyle != null &&
            selectedLineHighlight.features.length > 0 ? (
              <ShapeSource id={PAGE_SELECTED_HALO_SOURCE_ID} shape={selectedLineHighlight}>
                <LineLayer
                  id={PAGE_SELECTED_HALO_LAYER_ID}
                  style={{
                    lineColor: contrastHaloColor(selectedLineStyle.stroke),
                    lineWidth: Math.max(8, selectedLineStyle.strokeWidth + 6),
                    lineOpacity: 1,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
                <LineLayer
                  id={PAGE_SELECTED_OVERLAY_LAYER_ID}
                  style={{
                    lineColor: selectedLineStyle.stroke,
                    lineWidth: selectedLineStyle.strokeWidth,
                    lineOpacity: 1,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              </ShapeSource>
            ) : null}
          </MapView>
          {shell.expanded && pointTooltip != null ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View
                style={[
                  styles.tooltip,
                  {
                    left: Math.max(8, pointTooltip.x - 90),
                    top: Math.max(8, pointTooltip.y - 52),
                  },
                ]}
              >
                <Text style={styles.tooltipText} numberOfLines={4}>
                  {pointTooltip.fullName}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
      {shell.expanded ? (
        <View style={expandedChromeStyles.layer} pointerEvents="box-none">
          <MiniMapHeader title={miniMap.title} onBack={onCollapse} top={insets.top + 8} />
          {hasPageLegend && miniMap.legend != null ? (
            <PageMiniMapLegend
              legend={miniMap.legend}
              expanded={legendExpanded}
              selectedKey={selectedSegmentKey}
              maxHeight={legendMaxH}
              maxWidth={legendMaxW}
              bottomOffset={legendBottomOffset}
              rightInset={insets.right}
              onToggleExpanded={() => setLegendExpanded((e) => !e)}
              onSelectLegendId={handleLegendSelectSegment}
            />
          ) : null}
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
    elevation: 4,
  },
});

const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    maxWidth: 200,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(17,17,17,0.92)",
  },
  tooltipText: {
    color: "#fff",
    fontSize: 13,
  },
});
