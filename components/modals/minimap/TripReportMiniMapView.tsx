import { ButtonStack } from "@/components/buttons/ButtonStack";
import {
  RECORD_CONTROL_DESIGN_SIZE,
  RecordLineSegmentButton,
} from "@/components/buttons/nonstandard/RecordLineSegmentButton";
import { RecordedSegmentsLayer } from "@/components/modals/minimap/RecordedSegmentsLayer";
import { RecordSettingsModal } from "@/components/modals/recordSettings/RecordSettingsModal";
import { SettingsButton } from "@/components/buttons/standard/SettingsButton";
import { MapLayersButton } from "@/components/buttons/standard/MapLayersButton";
import { ResetCameraOrientationButton } from "@/components/buttons/standard/ResetCameraOrientationButton";
import { ResetCameraToBoundsButton } from "@/components/buttons/standard/ResetCameraToBoundsButton";
import { ResetCameraToPositionButton } from "@/components/buttons/standard/ResetCameraToPositionButton";
import { GhostRouteLayer } from "@/components/modals/minimap/GhostRouteLayer";
import {
  ImportedAreasLayer,
  ImportedPointsLayer,
} from "@/components/modals/minimap/ImportedFeaturesLayer";
import { TripReportGhostDropdown } from "@/components/modals/minimap/TripReportGhostDropdown";
import { useSavedPages } from "@/context/data/SavedPagesContext";
import { MapStyleLayers } from "@/components/modals/mapLayers/MapStyleLayers";
import { useMiniMapShell } from "@/components/modals/minimap/miniMapAnimatedCard";
import { useMapLayersSheet } from "@/context/ui/MapLayersSheetContext";
import { useMapLayersSettings } from "@/hooks/map/useMapLayersSettings";
import { useMapStyleLoadGate } from "@/hooks/map/useMapStyleLoadGate";
import {
  expandedMiniMapHeaderRowStackTop,
  expandedMiniMapOverlayBottomOffset,
  expandedMiniMapOverlayEdgeGap,
  useHeaderChromeLayout,
  useMapButtonChromeLayout,
} from "@/utils/layout/buttonChromeLayout";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { SCREEN_CORNER_RADIUS } from "@/utils/layout/screenCornerRadius";
import { useForegroundUserLocation } from "@/utils/location/useForegroundUserLocation";
import { boundsFromFeatureCollection } from "@/utils/minimap/geoJsonBounds";
import { useMiniMapCamera } from "@/utils/minimap/useMiniMapCamera";
import {
  useMiniMapViewportCameraOnLayout,
  type MapLayoutSize,
} from "@/utils/minimap/useMiniMapViewportCameraOnLayout";
import {
  boundsFocusCameraStop,
  type CameraPadding,
  type GeoBounds,
  type ViewportSize,
} from "@/utils/minimap/zoomForBounds";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Camera, LocationPuck, MapView } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import type {
  LegendItem,
  TripReportLineSegment,
  TripReportWaypoint,
} from "ropegeo-common/models";
import { TripReportLegend } from "./panels/TripReportLegend";
import {
  TRIP_REPORT_SEGMENT_PANEL_EXIT_MS,
  TripReportSegmentPanel,
} from "./panels/TripReportSegmentPanel";
import { MiniMapHeader } from "./shared/MiniMapHeader";
import { useRecordingPulse, useRecordingPulseColors } from "./shared/recordingPulse";
import { MiniMapNativeGestureHost, miniMapInteractionProps } from "./shared/miniMapMapGestures";
import {
  CAMERA_PADDING,
  EXPAND_BUTTON_INSET,
  MINI_MAP_BORDER_RADIUS,
  MINIMAP_FIT_BOUNDS_ANIMATION_MS,
  minimapStyles,
} from "./shared/minimapShared";

/** Default map center when location is unavailable (Moab, UT). [lng, lat]. */
const DEFAULT_MAP_CENTER: [number, number] = [-109.5508, 38.5733];
const DEFAULT_ZOOM = 13;
const USER_LOCATION_ZOOM = 14;
const COLLAPSED_CAMERA_ANIMATION_MS = 250;
const LEGEND_CAMERA_ANIMATION_MS = 300;
/** Horizontal gap between the segment panel and the legend, split around the screen center. */
const SEGMENT_PANEL_LEGEND_GAP = 8;
const NO_CAMERA_PADDING = { paddingTop: 0, paddingLeft: 0, paddingRight: 0, paddingBottom: 0 };
const EXPANDED_RECORDING_BORDER_WIDTH = 6;
const COLLAPSED_RECORDING_BORDER_WIDTH = 4;
/** Keeps fitted features clear of the record controls along the collapsed map's top edge. */
const COLLAPSED_FIT_PADDING: CameraPadding = {
  ...CAMERA_PADDING,
  paddingTop: CAMERA_PADDING.paddingBottom,
};
/** Fits never zoom in past this, so a lone point or a short segment keeps some context. */
const MAX_FIT_ZOOM = 16;
/** Waits out the fit animation before treating the camera as fitted to the features. */
const FIT_SETTLE_MS = MINIMAP_FIT_BOUNDS_ANIMATION_MS + 80;

/** Bounds of everything drawn on the map: segments with waypoints, then imported features. */
function useFeatureBounds(
  segments: readonly TripReportLineSegment[],
  features: readonly GeoJSON.Feature[],
): GeoBounds | null {
  const bounds = useMemo(
    () =>
      boundsFromFeatureCollection({
        type: "FeatureCollection",
        features: [
          ...segments
            .filter((segment) => segment.waypoints.length > 0)
            .map((segment) => segment.toLineFeature()),
          ...features,
        ],
      }),
    [segments, features],
  );
  // Recording replaces `segments` on every waypoint; only hand out a new object when the bounds move.
  return useMemo(() => bounds, [bounds?.north, bounds?.south, bounds?.east, bounds?.west]);
}

/**
 * Red map border that pulses (with `progress`) between full red and red mixed half-and-half with
 * black. When expanded, its top corners follow the device's rounded screen corners and its bottom
 * edge sits `bottomInset` above the bottom of the map so it clears the tab bar.
 */
function RecordingBorder({
  expanded,
  bottomInset,
  progress,
}: {
  expanded: boolean;
  bottomInset: number;
  progress: SharedValue<number>;
}) {
  const { fullColor, dimColor } = useRecordingPulseColors();

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, [0, 1], [dimColor, fullColor]),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.recordingBorder,
        {
          borderWidth: expanded
            ? EXPANDED_RECORDING_BORDER_WIDTH
            : COLLAPSED_RECORDING_BORDER_WIDTH,
          borderTopLeftRadius: expanded ? SCREEN_CORNER_RADIUS : MINI_MAP_BORDER_RADIUS,
          borderTopRightRadius: expanded ? SCREEN_CORNER_RADIUS : MINI_MAP_BORDER_RADIUS,
          borderBottomLeftRadius: expanded ? 0 : MINI_MAP_BORDER_RADIUS,
          borderBottomRightRadius: expanded ? 0 : MINI_MAP_BORDER_RADIUS,
          bottom: expanded ? bottomInset : 0,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * The user's position, only if foreground location permission was already granted.
 * Never prompts; resolves to null when permission is missing or the position is unavailable.
 */
function useGrantedUserLocation(enabled: boolean): [number, number] | null {
  const [coord, setCoord] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted" || cancelled) return;
        const position =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (!cancelled && position != null) {
          setCoord([position.coords.longitude, position.coords.latitude]);
        }
      } catch {
        /* stay on the default center */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return coord;
}

export type TripReportMiniMapViewProps = {
  segments: readonly TripReportLineSegment[];
  /** Imported point and polygon features, each with a legend id keyed into `legend`. */
  features: readonly GeoJSON.Feature[];
  legend: Readonly<Record<string, LegendItem>>;
  /** Shows the pulsing recording border; the button switches to "Pause Recording". */
  recording: boolean;
  /** Another map holds the recording lock, so this map's record button is disabled. */
  blockedByOtherRecording: boolean;
  onToggleRecording: () => void;
  /** Segment receiving recorded waypoints, or null when this map isn't recording. */
  recordingSegmentId: string | null;
  /** Records the segment, or pauses it if it's the one recording. */
  onToggleSegmentRecording: (segmentId: string) => void;
  /** Adds a new segment whose first waypoint is `waypoint` (the user's position). */
  onAddSegment: (waypoint: TripReportWaypoint) => void;
  /** No location access: adding and recording segments from the expanded map are disabled. */
  locationDisabled: boolean;
  onUpdateSegment: (
    segmentId: string,
    update: (segment: TripReportLineSegment) => TripReportLineSegment,
  ) => void;
  onRemoveSegment: (segmentId: string) => void;
};

/**
 * Minimap for a trip report map block. Loads no backend data: it shows the base map, the block's
 * line segments, and its imported points and areas. With anything on the map, the collapsed
 * camera fits all of it; otherwise it centers on the user's position when location is already
 * allowed, else on Moab. Must be rendered inside a `MiniMapAnimatedCard`.
 */
export function TripReportMiniMapView({
  segments,
  features,
  legend,
  recording,
  blockedByOtherRecording,
  onToggleRecording,
  recordingSegmentId,
  onToggleSegmentRecording,
  onAddSegment,
  locationDisabled,
  onUpdateSegment,
  onRemoveSegment,
}: TripReportMiniMapViewProps) {
  const mapLayers = useMapLayersSettings();
  const {
    styleReady,
    onDidFinishLoadingMap: onStyleReady,
    onDidFinishLoadingStyle: onStyleFinishedLoading,
    onMapLoadingError: onStyleLoadError,
  } = useMapStyleLoadGate(mapLayers.styleUrl);
  const { openMapLayersSheet } = useMapLayersSheet();
  const headerChrome = useHeaderChromeLayout();
  const mapChrome = useMapButtonChromeLayout();
  const shell = useMiniMapShell();
  const tabBarHeight = useBottomTabBarHeight();
  const {
    expanded,
    mountNativeMap,
    mapBodyVisible,
    settleCollapsedLayout,
    registerCollapseCleanup,
    setMapContentReady,
  } = shell;

  const {
    cameraRef,
    resetPitchAndHeading,
    onCameraChanged,
    compassVisible,
    boundsResetButtonVisible,
    cameraHeadingDeg,
    markCameraFittedToBounds,
    markCameraFittedToBoundsAfter,
    markCameraMovedFromBounds,
  } = useMiniMapCamera({ expanded });
  const featureBounds = useFeatureBounds(segments, features);

  const grantedUserLocation = useGrantedUserLocation(mountNativeMap);
  const homeCenter = grantedUserLocation ?? DEFAULT_MAP_CENTER;
  const homeZoom = grantedUserLocation != null ? USER_LOCATION_ZOOM : DEFAULT_ZOOM;

  const [mapLiveCenter, setMapLiveCenter] = useState<[number, number] | undefined>(undefined);
  const [mapLiveZoom, setMapLiveZoom] = useState<number | undefined>(undefined);
  const [recordSettingsOpen, setRecordSettingsOpen] = useState(false);
  // The ghost route: a saved page drawn faintly behind everything for navigating by. It isn't part
  // of the trip report, so it's left out of the legend and the feature bounds. Unsaving the page
  // removes it.
  const { savedEntries } = useSavedPages();
  const [ghostPageId, setGhostPageId] = useState<string | null>(null);
  const ghostPage = savedEntries.find((entry) => entry.preview.id === ghostPageId) ?? null;
  const [legendExpanded, setLegendExpanded] = useState(false);
  const recordingPulse = useRecordingPulse(recording);
  const uiScale = useUiScale();
  const { height: windowHeight, width: windowWidth, fontScale } = useWindowDimensions();

  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const selectedSegment = segments.find((segment) => segment.id === selectedSegmentId) ?? null;
  // The segment panel shows whenever a segment is selected, whether or not the legend is expanded.
  const segmentPanelVisible = selectedSegment != null;
  /** The legend or the segment panel covers the bottom of the screen. */
  const bottomPanelsOpen = legendExpanded || segmentPanelVisible;
  // The panel is keyed by segment, so switching segments slides the old panel out and a new one
  // in. When it replaces another segment's panel, the new one waits for the old one to leave.
  const panelSegmentId = segmentPanelVisible ? selectedSegment.id : null;
  const [panelSegmentIds, setPanelSegmentIds] = useState({
    current: panelSegmentId,
    previous: null as string | null,
  });
  if (panelSegmentIds.current !== panelSegmentId) {
    setPanelSegmentIds({ current: panelSegmentId, previous: panelSegmentIds.current });
  }
  const panelSwitchedSegments = panelSegmentIds.previous != null && panelSegmentId != null;

  // A segment added while recording, or by the add line segment button, is the one just started:
  // select it.
  const lastSegmentId = segments.length > 0 ? segments[segments.length - 1].id : null;
  const previousSegmentsRef = useRef({ count: segments.length, lastId: lastSegmentId });
  const selectNextAddedSegmentRef = useRef(false);
  useEffect(() => {
    const previous = previousSegmentsRef.current;
    previousSegmentsRef.current = { count: segments.length, lastId: lastSegmentId };
    const added =
      lastSegmentId != null &&
      lastSegmentId !== previous.lastId &&
      segments.length > previous.count;
    if (!added) return;
    if (recording || selectNextAddedSegmentRef.current) setSelectedSegmentId(lastSegmentId);
    selectNextAddedSegmentRef.current = false;
  }, [lastSegmentId, recording, segments.length]);

  useEffect(() => {
    if (!expanded) {
      setLegendExpanded(false);
      setSelectedSegmentId(null);
    }
  }, [expanded]);

  // Collapsing the legend keeps the selection, and the segment panel stays open beside it.
  const toggleLegendExpanded = () => setLegendExpanded(!legendExpanded);

  /**
   * With the legend or segment panel open, camera padding moves the camera's center to the middle
   * of the top half of the usable screen: below the top safe area inset and above the tab bar.
   * Inline hosts draw the map behind the tab bar; portal hosts end above it.
   */
  const safeTop = shell.insets.top;
  const cameraPadding = useMemo(() => {
    if (!bottomPanelsOpen) return NO_CAMERA_PADDING;
    const mapHeight =
      shell.layoutHost === "portal" ? windowHeight - tabBarHeight : windowHeight;
    const usableHeight = windowHeight - tabBarHeight - safeTop;
    return {
      paddingTop: safeTop,
      paddingLeft: 0,
      paddingRight: 0,
      paddingBottom: Math.max(0, mapHeight - safeTop - usableHeight / 2),
    };
  }, [bottomPanelsOpen, safeTop, shell.layoutHost, tabBarHeight, windowHeight]);

  const expandedViewport = useMemo(
    (): ViewportSize => ({
      width: windowWidth,
      height: shell.layoutHost === "portal" ? windowHeight - tabBarHeight : windowHeight,
    }),
    [shell.layoutHost, tabBarHeight, windowHeight, windowWidth],
  );
  // Expanded fits stay clear of the header, buttons, and tab bar, and with the legend or segment
  // panel open, keep to the top half of the screen like the legend's recentering.
  const expandedFitPadding = useMemo((): CameraPadding => {
    const base = shell.expandedPadding;
    const bottomChrome = shell.layoutHost === "portal" ? 0 : tabBarHeight;
    return {
      ...base,
      paddingBottom: bottomPanelsOpen
        ? Math.max(cameraPadding.paddingBottom, base.paddingBottom)
        : base.paddingBottom + bottomChrome,
    };
  }, [bottomPanelsOpen, cameraPadding, shell.expandedPadding, shell.layoutHost, tabBarHeight]);

  /** Fits the camera to `bounds` within the padded viewport; false when it can't. */
  const fitCameraToBounds = useCallback(
    (
      bounds: GeoBounds,
      viewport: ViewportSize,
      padding: CameraPadding,
      animationDuration: number,
    ): boolean => {
      const stop = boundsFocusCameraStop(bounds, viewport, padding, animationDuration, {
        offsetCenterWithPadding: true,
      });
      if (stop == null) return false;
      cameraRef.current?.setCamera({ ...stop, zoomLevel: Math.min(stop.zoomLevel, MAX_FIT_ZOOM) });
      return true;
    },
    [cameraRef],
  );

  /** Fits the camera to everything on the map; false when there's nothing to fit. */
  const fitCameraToFeatures = useCallback(
    (viewport: ViewportSize, padding: CameraPadding, animationDuration: number): boolean =>
      featureBounds != null &&
      fitCameraToBounds(featureBounds, viewport, padding, animationDuration),
    [featureBounds, fitCameraToBounds],
  );

  const fitExpandedCameraToFeatures = useCallback(() => {
    if (fitCameraToFeatures(expandedViewport, expandedFitPadding, MINIMAP_FIT_BOUNDS_ANIMATION_MS)) {
      markCameraFittedToBoundsAfter(FIT_SETTLE_MS);
    }
  }, [expandedFitPadding, expandedViewport, fitCameraToFeatures, markCameraFittedToBoundsAfter]);

  const applyCollapsedCamera = useCallback(
    (size: MapLayoutSize) => {
      if (!mountNativeMap || expanded) return;
      resetPitchAndHeading(COLLAPSED_CAMERA_ANIMATION_MS);
      if (!fitCameraToFeatures(size, COLLAPSED_FIT_PADDING, COLLAPSED_CAMERA_ANIMATION_MS)) {
        cameraRef.current?.setCamera({
          centerCoordinate: homeCenter,
          zoomLevel: homeZoom,
          padding: NO_CAMERA_PADDING,
          animationDuration: COLLAPSED_CAMERA_ANIMATION_MS,
        });
      }
      settleCollapsedLayout();
    },
    [
      cameraRef,
      expanded,
      fitCameraToFeatures,
      homeCenter,
      homeZoom,
      mountNativeMap,
      resetPitchAndHeading,
      settleCollapsedLayout,
    ],
  );

  const applyExpandedCamera = useCallback(() => {
    if (!mountNativeMap || !expanded) return;
    if (featureBounds != null) {
      fitExpandedCameraToFeatures();
    } else {
      markCameraFittedToBounds();
    }
  }, [
    expanded,
    featureBounds,
    fitExpandedCameraToFeatures,
    markCameraFittedToBounds,
    mountNativeMap,
  ]);

  const { markPendingCollapsedCamera, markPendingExpandedCamera, onMapLayout } =
    useMiniMapViewportCameraOnLayout({
      expanded,
      onCollapsedLayoutStable: applyCollapsedCamera,
      onExpandedLayoutStable: applyExpandedCamera,
    });

  useEffect(() => {
    registerCollapseCleanup(markPendingCollapsedCamera);
    return () => registerCollapseCleanup(null);
  }, [registerCollapseCleanup, markPendingCollapsedCamera]);

  // Re-home the collapsed camera once the user's position arrives or the features change.
  useEffect(() => {
    if (!mountNativeMap || expanded) return;
    markPendingCollapsedCamera();
  }, [grantedUserLocation, featureBounds, markPendingCollapsedCamera, expanded, mountNativeMap]);

  useEffect(() => {
    if (!mountNativeMap || !expanded) return;
    markPendingExpandedCamera();
  }, [expanded, mountNativeMap, markPendingExpandedCamera]);

  // Features that change while expanded (a finished upload, a new waypoint) leave the camera
  // unfitted, so the reset-to-bounds button shows.
  const previousFeatureBoundsRef = useRef(featureBounds);
  useEffect(() => {
    const changed = previousFeatureBoundsRef.current !== featureBounds;
    previousFeatureBoundsRef.current = featureBounds;
    if (changed && expanded) markCameraMovedFromBounds();
  }, [featureBounds, expanded, markCameraMovedFromBounds]);

  // Selecting a segment focuses the camera on it. Its segment panel is open while it's selected,
  // so the fit padding keeps the segment in the top half of the screen, clear of the legend and
  // the panel. Only a new selection refocuses: a segment growing while it's recorded, or one
  // selected before it has waypoints (a recording that just started), leaves the camera alone.
  const selectedSegmentBounds = selectedSegment?.bounds ?? null;
  const focusedSegmentIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!expanded || selectedSegmentId == null) {
      focusedSegmentIdRef.current = null;
      return;
    }
    if (focusedSegmentIdRef.current === selectedSegmentId) return;
    focusedSegmentIdRef.current = selectedSegmentId;
    if (selectedSegmentBounds == null) return;
    markCameraMovedFromBounds();
    fitCameraToBounds(
      selectedSegmentBounds,
      expandedViewport,
      expandedFitPadding,
      MINIMAP_FIT_BOUNDS_ANIMATION_MS,
    );
  }, [
    expanded,
    expandedFitPadding,
    expandedViewport,
    fitCameraToBounds,
    markCameraMovedFromBounds,
    selectedSegmentBounds,
    selectedSegmentId,
  ]);

  const userLocationCoord = useForegroundUserLocation(expanded && mapBodyVisible);

  /** Adds a segment at the user's position: the live one when known, else a fresh fix. */
  const addSegmentAtUserPosition = useCallback(async () => {
    let coord: TripReportWaypoint | undefined = userLocationCoord;
    if (coord == null) {
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        coord = [position.coords.longitude, position.coords.latitude];
      } catch (error) {
        console.warn("[TripReportMiniMapView] couldn't get the position for a new segment", error);
        return;
      }
    }
    selectNextAddedSegmentRef.current = true;
    onAddSegment(coord);
  }, [onAddSegment, userLocationCoord]);

  const resetCameraToUserPosition = useCallback(() => {
    if (userLocationCoord == null) return;
    markCameraMovedFromBounds();
    cameraRef.current?.setCamera({
      centerCoordinate: userLocationCoord,
      zoomLevel: USER_LOCATION_ZOOM,
      padding: cameraPadding,
      animationDuration: 300,
    });
  }, [cameraPadding, cameraRef, markCameraMovedFromBounds, userLocationCoord]);

  const cameraOnUserPosition =
    userLocationCoord != null &&
    mapLiveCenter != null &&
    mapLiveZoom != null &&
    Math.abs(mapLiveCenter[0] - userLocationCoord[0]) <= 1e-4 &&
    Math.abs(mapLiveCenter[1] - userLocationCoord[1]) <= 1e-4 &&
    Math.abs(mapLiveZoom - USER_LOCATION_ZOOM) <= 0.05;
  const userPositionButtonVisible =
    expanded && userLocationCoord != null && mapLiveCenter != null && !cameraOnUserPosition;
  const cameraOnFeatureBounds = expanded && featureBounds != null && !boundsResetButtonVisible;
  const boundsButtonVisible = featureBounds != null && boundsResetButtonVisible;

  // Opening the first bottom panel (legend or segment panel) or closing the last one moves the
  // camera's center between the full screen and its top half. A camera focused on the user's
  // position or the features' bounds refocuses there; one the user has moved elsewhere stays put.
  const legendToggleFocusRef = useRef({ onUser: false, onBounds: false });
  legendToggleFocusRef.current = { onUser: cameraOnUserPosition, onBounds: cameraOnFeatureBounds };
  const appliedBottomPanelsOpenRef = useRef(bottomPanelsOpen);
  useEffect(() => {
    if (appliedBottomPanelsOpenRef.current === bottomPanelsOpen) return;
    appliedBottomPanelsOpenRef.current = bottomPanelsOpen;
    if (!expanded) return;
    const { onUser, onBounds } = legendToggleFocusRef.current;
    if (onBounds) {
      fitExpandedCameraToFeatures();
    } else if (onUser && userLocationCoord != null) {
      cameraRef.current?.setCamera({
        centerCoordinate: userLocationCoord,
        padding: cameraPadding,
        animationDuration: LEGEND_CAMERA_ANIMATION_MS,
      });
    }
  }, [
    bottomPanelsOpen,
    expanded,
    cameraPadding,
    cameraRef,
    fitExpandedCameraToFeatures,
    userLocationCoord,
  ]);

  useEffect(() => {
    setMapContentReady(mountNativeMap && styleReady);
  }, [mountNativeMap, styleReady, setMapContentReady]);

  const headerTop = shell.insets.top + headerChrome.rowTopInset;
  const buttonStackTop = expandedMiniMapHeaderRowStackTop(headerTop, headerChrome, mapChrome);
  const overlayEdgeGap = expandedMiniMapOverlayEdgeGap(uiScale, fontScale);
  // Portal hosts already clear the tab bar, so only the scaled gap applies there.
  const legendBottomOffset = expandedMiniMapOverlayBottomOffset(
    shell.layoutHost === "portal" ? 0 : tabBarHeight,
    uiScale,
    fontScale,
  );

  return (
    <>
      {shell.mapBodyVisible ? (
        <MiniMapNativeGestureHost expanded={shell.expanded}>
          <MapView
            styleURL={mapLayers.styleUrl}
            style={[minimapStyles.map, !shell.mapChromeInteractive ? styles.hidden : null]}
            projection="globe"
            onLayout={onMapLayout}
            {...miniMapInteractionProps(shell.expanded)}
            scaleBarEnabled={false}
            attributionEnabled={shell.expanded}
            logoEnabled={shell.expanded}
            logoPosition={Platform.OS === "android" ? { bottom: 40, left: 10 } : undefined}
            attributionPosition={Platform.OS === "android" ? { bottom: 40, right: 10 } : undefined}
            onCameraChanged={(state) => {
              onCameraChanged(state);
              if (shell.expanded) {
                setMapLiveCenter(state.properties.center as [number, number]);
                setMapLiveZoom(state.properties.zoom);
              }
            }}
            onDidFinishLoadingMap={onStyleReady}
            onDidFinishLoadingStyle={onStyleFinishedLoading}
            onMapLoadingError={onStyleLoadError}
          >
            <LocationPuck
              puckBearingEnabled
              puckBearing="heading"
              pulsing={{ isEnabled: true, radius: "accuracy" }}
            />
            <Camera
              ref={cameraRef}
              defaultSettings={
                featureBounds != null
                  ? {
                      bounds: {
                        ne: [featureBounds.east, featureBounds.north],
                        sw: [featureBounds.west, featureBounds.south],
                        ...COLLAPSED_FIT_PADDING,
                      },
                    }
                  : { centerCoordinate: homeCenter, zoomLevel: homeZoom }
              }
            />
            {styleReady ? (
              <>
                <MapStyleLayers
                  lightPreset={mapLayers.mapLightPreset}
                  showElevationContours={mapLayers.showContoursOnMap}
                />
                {ghostPage != null ? <GhostRouteLayer savedPage={ghostPage} /> : null}
                <ImportedAreasLayer features={features} legend={legend} />
                <RecordedSegmentsLayer
                  segments={segments}
                  waypointsSegmentId={shell.expanded ? selectedSegmentId : null}
                />
                <ImportedPointsLayer features={features} legend={legend} />
              </>
            ) : null}
          </MapView>
        </MiniMapNativeGestureHost>
      ) : null}
      {recording ? (
        <RecordingBorder
          expanded={shell.expanded}
          bottomInset={shell.layoutHost === "portal" ? 0 : tabBarHeight}
          progress={recordingPulse}
        />
      ) : null}
      {!shell.expanded && shell.layoutReady ? (
        <View style={styles.recordButton} pointerEvents="box-none">
          <SettingsButton
            designSize={RECORD_CONTROL_DESIGN_SIZE}
            onPress={() => setRecordSettingsOpen(true)}
          />
          <RecordLineSegmentButton
            recording={recording}
            blockedByOtherRecording={blockedByOtherRecording}
            onPress={onToggleRecording}
          />
        </View>
      ) : null}
      {shell.expanded ? (
        <Animated.View
          style={[styles.expandedChrome, shell.expandedChromeStyle]}
          pointerEvents="box-none"
        >
          <MiniMapHeader
            onBack={shell.requestCollapse}
            top={headerTop}
            chromeInteractive={shell.mapChromeInteractive}
            titleSlot={
              <TripReportGhostDropdown
                selectedPage={ghostPage}
                onSelectPage={setGhostPageId}
                interactive={shell.mapChromeInteractive}
              />
            }
          />
          <View
            style={[StyleSheet.absoluteFill, !shell.mapChromeInteractive ? styles.dimmed : null]}
            pointerEvents={shell.mapChromeInteractive ? "box-none" : "none"}
          >
            {segmentPanelVisible ? (
              <TripReportSegmentPanel
                key={selectedSegment.id}
                enterDelayMs={panelSwitchedSegments ? TRIP_REPORT_SEGMENT_PANEL_EXIT_MS : 0}
                segment={selectedSegment}
                maxHeight={windowHeight / 3}
                leftOffset={shell.insets.left + overlayEdgeGap}
                rightOffset={windowWidth / 2 + SEGMENT_PANEL_LEGEND_GAP / 2}
                bottomOffset={legendBottomOffset}
                recording={selectedSegment.id === recordingSegmentId}
                recordingPulse={recordingPulse}
                onToggleRecording={() => onToggleSegmentRecording(selectedSegment.id)}
                recordDisabled={locationDisabled}
                onUpdate={(update) => onUpdateSegment(selectedSegment.id, update)}
                onDelete={() => {
                  setSelectedSegmentId(null);
                  onRemoveSegment(selectedSegment.id);
                }}
              />
            ) : null}
            <TripReportLegend
              segments={segments}
              expanded={legendExpanded}
              maxHeight={windowHeight / 3}
              leftOffset={
                windowWidth / 2 + (segmentPanelVisible ? SEGMENT_PANEL_LEGEND_GAP / 2 : 0)
              }
              bottomOffset={legendBottomOffset}
              rightInset={shell.insets.right + overlayEdgeGap}
              onToggleExpanded={toggleLegendExpanded}
              selectedSegmentId={selectedSegmentId}
              onSelectSegment={setSelectedSegmentId}
              recording={recording}
              recordingPulse={recordingPulse}
              blockedByOtherRecording={blockedByOtherRecording}
              onToggleRecording={onToggleRecording}
              recordingSegmentId={recordingSegmentId}
              onAddSegment={() => void addSegmentAtUserPosition()}
              addSegmentDisabled={locationDisabled}
            />
            <ButtonStack top={buttonStackTop}>
              <ButtonStack.Slot id="map-layers" visible>
                <MapLayersButton
                  stacked
                  customized={mapLayers.customized}
                  onPress={openMapLayersSheet}
                  disabled={!shell.mapChromeInteractive}
                />
              </ButtonStack.Slot>
              <ButtonStack.Slot id="bounds" visible={boundsButtonVisible}>
                <ResetCameraToBoundsButton
                  stacked
                  onPress={fitExpandedCameraToFeatures}
                  visible={boundsButtonVisible}
                />
              </ButtonStack.Slot>
              <ButtonStack.Slot id="orientation" visible={compassVisible}>
                <ResetCameraOrientationButton
                  stacked
                  iconRotation={-cameraHeadingDeg}
                  onPress={() => resetPitchAndHeading()}
                  visible={compassVisible}
                />
              </ButtonStack.Slot>
              <ButtonStack.Slot id="user-position" visible={userPositionButtonVisible}>
                <ResetCameraToPositionButton
                  stacked
                  onPress={resetCameraToUserPosition}
                  visible={userPositionButtonVisible}
                />
              </ButtonStack.Slot>
            </ButtonStack>
          </View>
        </Animated.View>
      ) : null}
      <RecordSettingsModal
        visible={recordSettingsOpen}
        onClose={() => setRecordSettingsOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hidden: {
    opacity: 0,
  },
  expandedChrome: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    elevation: 4,
  },
  dimmed: {
    opacity: 0.45,
  },
  recordingBorder: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  recordButton: {
    position: "absolute",
    top: EXPAND_BUTTON_INSET,
    right: EXPAND_BUTTON_INSET,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
