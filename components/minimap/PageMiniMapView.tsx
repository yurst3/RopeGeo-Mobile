import { ResetMapOrientationButton } from "@/components/buttons/ResetMapOrientationButton";
import { ResetMapPositionButton } from "@/components/buttons/ResetMapPositionButton";
import {
  MAP_BUTTON_GAP,
  MAP_BUTTON_SIZE,
  MAP_BUTTON_TOP_OFFSET,
} from "./shared/fullScreenMapLayout";
import { MiniMapHeader } from "./shared/MiniMapHeader";
import {
  CAMERA_PADDING,
  minimapStyles,
} from "./shared/minimapShared";
import { useMiniMapShell } from "@/components/minimap/miniMapAnimatedCard";
import type { MiniMapReloadRegisterRef } from "@/components/minimap/miniMapHandle";
import { useMiniMapCamera } from "./shared/useMiniMapCamera";
import { Camera, LineLayer, LocationPuck, MapView, VectorSource } from "@rnmapbox/maps";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  type OfflinePageMiniMap,
  type OnlinePageMiniMap,
} from "ropegeo-common/models";

/** Online or offline page tile minimap configuration from ropegeo-common. */
export type PageMiniMapTileProps = OnlinePageMiniMap | OfflinePageMiniMap;

export type PageMiniMapViewProps = {
  miniMap: PageMiniMapTileProps;
  onCollapse: () => void;
  reloadRegisterRef?: MiniMapReloadRegisterRef;
};

export function PageMiniMapView({ miniMap, onCollapse, reloadRegisterRef }: PageMiniMapViewProps) {
  const shell = useMiniMapShell();
  const b = miniMap.bounds;
  const tileTemplate =
    miniMap.fetchType === "offline"
      ? miniMap.offlineTilesTemplate
      : miniMap.onlineTilesTemplate;
  const miniMapReloadKey = useMemo(
    () => `${miniMap.fetchType}:${miniMap.layerId}:${tileTemplate}`,
    [miniMap.fetchType, miniMap.layerId, tileTemplate],
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

  useEffect(() => {
    shell.registerCollapseCleanup(resetPitchAndHeading);
    return () => shell.registerCollapseCleanup(null);
  }, [shell.registerCollapseCleanup, resetPitchAndHeading]);

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
  }, [miniMapReloadKey]);

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

  const { insets } = shell;

  return (
    <>
      {shell.mapBodyVisible ? (
        <View style={minimapStyles.map} pointerEvents={shell.expanded ? "auto" : "none"}>
          <MapView
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
            onCameraChanged={onCameraChanged}
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
            <VectorSource id="page-mini-map-tiles" tileUrlTemplates={[tileTemplate]}>
              <LineLayer
                id="page-mini-map-line"
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
        </View>
      ) : null}
      {shell.expanded ? (
        <View style={expandedChromeStyles.layer} pointerEvents="box-none">
          <MiniMapHeader title={miniMap.title} onBack={onCollapse} top={insets.top + 8} />
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
