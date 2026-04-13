import { ResetMapOrientationButton } from "@/components/buttons/ResetMapOrientationButton";
import { ResetMapPositionButton } from "@/components/buttons/ResetMapPositionButton";
import {
  MAP_BUTTON_GAP,
  MAP_BUTTON_SIZE,
  MAP_BUTTON_TOP_OFFSET,
} from "./fullScreenMapLayout";
import { MiniMapHeader } from "./MiniMapHeader";
import { miniMapHostStyles } from "./miniMapHostStyles";
import {
  CAMERA_PADDING,
  MiniMapDirectionsButtons,
  MiniMapExpandButton,
  minimapStyles,
} from "./minimapShared";
import { type Rect, useMiniMapAnimation } from "./useMiniMapAnimation";
import { useMiniMapCamera } from "./useMiniMapCamera";
import { Camera, LineLayer, LocationPuck, MapView, VectorSource } from "@rnmapbox/maps";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import {
  type OfflinePageMiniMap,
  type OnlinePageMiniMap,
} from "ropegeo-common/models";

export type PageMiniMapTileProps = OnlinePageMiniMap | OfflinePageMiniMap;

export function PageMiniMap({
  miniMap,
  mountNativeMap,
  expanded,
  anchorRect,
  baseScrollY,
  scrollY,
  onExpand,
  onCollapse,
  mapDirections,
}: {
  miniMap: PageMiniMapTileProps;
  mountNativeMap: boolean;
  expanded: boolean;
  anchorRect: Rect | null;
  baseScrollY: number;
  scrollY: SharedValue<number>;
  onExpand: () => void;
  onCollapse: () => void;
  /** When set, show Apple/Google directions icon buttons on the collapsed minimap (bottom-left). */
  mapDirections?: { lat: number; lon: number } | null;
}) {
  const b = miniMap.bounds;
  const tileTemplate =
    miniMap.fetchType === "offline"
      ? miniMap.offlineTilesTemplate
      : miniMap.onlineTilesTemplate;
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
            title={miniMap.title}
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
