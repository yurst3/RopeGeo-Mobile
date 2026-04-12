import { ResetMapOrientationButton } from "@/components/buttons/ResetMapOrientationButton";
import { ResetMapPositionButton } from "@/components/buttons/ResetMapPositionButton";
import { MiniMapHeader } from "@/components/minimap/MiniMapHeader";
import { miniMapHostStyles } from "@/components/minimap/miniMapHostStyles";
import {
  CAMERA_PADDING,
  MiniMapDirectionsButtons,
  MiniMapExpandButton,
  minimapStyles,
} from "@/components/minimap/minimapShared";
import { type Rect, useMiniMapAnimation } from "@/components/minimap/useMiniMapAnimation";
import { useMiniMapCamera } from "@/components/minimap/useMiniMapCamera";
import {
  MAP_BUTTON_GAP,
  MAP_BUTTON_SIZE,
  MAP_BUTTON_TOP_OFFSET,
} from "@/components/minimap/fullScreenMapLayout";
import { Camera, LineLayer, LocationPuck, MapView, VectorSource } from "@rnmapbox/maps";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import type { PageMiniMap as PageMiniMapConfig } from "ropegeo-common/models";

function localVectorTileTemplate(rootUri: string, layerId: string): string {
  const base = rootUri.endsWith("/") ? rootUri : `${rootUri}/`;
  return `${base}tiles/${layerId}/{z}/{x}/{y}.pbf`;
}

export function PageMiniMap({
  miniMap,
  pageName,
  mountNativeMap,
  expanded,
  anchorRect,
  baseScrollY,
  scrollY,
  onExpand,
  onCollapse,
  localTileRootUri,
  mapDirections,
}: {
  miniMap: PageMiniMapConfig;
  pageName: string;
  mountNativeMap: boolean;
  expanded: boolean;
  anchorRect: Rect | null;
  baseScrollY: number;
  scrollY: SharedValue<number>;
  onExpand: () => void;
  onCollapse: () => void;
  /** When set, load vector tiles from the offline bundle (`file://` root) instead of the remote template. */
  localTileRootUri?: string | null;
  /** When set, show Apple/Google directions icon buttons on the collapsed minimap (bottom-left). */
  mapDirections?: { lat: number; lon: number } | null;
}) {
  const b = miniMap.bounds;
  const tileTemplate =
    localTileRootUri != null && localTileRootUri.length > 0
      ? localVectorTileTemplate(localTileRootUri, miniMap.layerId)
      : miniMap.tilesTemplate;
  const {
    cameraRef,
    fitToBounds,
    resetPitchAndHeading,
    captureHome,
    onCameraChanged,
    compassVisible,
    positionButtonVisible,
  } = useMiniMapCamera({
    expanded,
    initialHomeCenter: [b.west, b.south],
  });

  const { cardStyle, expandedPadding, insets } = useMiniMapAnimation({
    anchorRect,
    baseScrollY,
    scrollY,
    expanded,
    onCollapseTransition: resetPitchAndHeading,
  });

  useEffect(() => {
    if (!mountNativeMap || !anchorRect) return;
    if (expanded) {
      captureHome();
    } else {
      const timer = setTimeout(() => fitToBounds(b, CAMERA_PADDING), 260);
      return () => clearTimeout(timer);
    }
  }, [anchorRect, b, captureHome, expanded, fitToBounds, mountNativeMap]);

  const resetPosition = () => {
    captureHome();
    fitToBounds(b, expandedPadding);
    requestAnimationFrame(() => fitToBounds(b, expandedPadding));
  };

  const [mapFinishedLoading, setMapFinishedLoading] = useState(false);

  useEffect(() => {
    if (!mountNativeMap) {
      setMapFinishedLoading(false);
    }
  }, [mountNativeMap]);

  const showMapLoading =
    !mountNativeMap || (mountNativeMap && !mapFinishedLoading);

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
          <View
            style={[minimapStyles.map, minimapStyles.mapPlaceholder]}
            pointerEvents="none"
          />
        ) : (
          <View
            style={minimapStyles.map}
            pointerEvents={expanded ? "auto" : "none"}
          >
            <MapView
              styleURL="mapbox://styles/mapbox/outdoors-v12"
              style={StyleSheet.absoluteFill}
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
            onCameraChanged={onCameraChanged}
            onDidFinishLoadingMap={() => setMapFinishedLoading(true)}
            onMapLoadingError={() => setMapFinishedLoading(true)}
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
        )}
        {showMapLoading ? (
          <View
            style={[StyleSheet.absoluteFill, styles.mapLoadingOverlay]}
            pointerEvents="none"
          >
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
            title={pageName}
            onBack={onCollapse}
            top={insets.top + 8}
          />
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

const styles = StyleSheet.create({
  mapLoadingOverlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(229, 231, 235, 0.92)",
    borderRadius: minimapStyles.map.borderRadius,
  },
});
