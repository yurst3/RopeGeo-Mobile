import { ButtonStack } from "@/components/buttons/ButtonStack";
import { AddMidWaypointButton } from "@/components/buttons/standard/AddMidWaypointButton";
import { BackButton } from "@/components/buttons/standard/BackButton";
import {
  RECORD_CONTROL_DESIGN_SIZE,
  RecordLineSegmentButton,
} from "@/components/buttons/standard/RecordLineSegmentButton";
import { RemoveWaypointButton } from "@/components/buttons/standard/RemoveWaypointButton";
import { SplitSegmentButton } from "@/components/buttons/standard/SplitSegmentButton";
import { UndoButton } from "@/components/buttons/standard/UndoButton";
import {
  recordedSegmentLineLayerIds,
  recordedSegmentWaypointLayerIds,
  RecordedSegmentsLayer,
} from "@/components/modals/minimap/RecordedSegmentsLayer";
import { RecordSettingsModal } from "@/components/modals/recordSettings/RecordSettingsModal";
import { RecordSettingsButton } from "@/components/buttons/standard/RecordSettingsButton";
import { MapLayersButton } from "@/components/buttons/standard/MapLayersButton";
import { ResetCameraOrientationButton } from "@/components/buttons/standard/ResetCameraOrientationButton";
import { ResetCameraToBoundsButton } from "@/components/buttons/standard/ResetCameraToBoundsButton";
import { ResetCameraToPositionButton } from "@/components/buttons/standard/ResetCameraToPositionButton";
import { GhostRouteLayer } from "@/components/modals/minimap/GhostRouteLayer";
import { ImportedAreasLayer } from "@/components/modals/minimap/ImportedFeaturesLayer";
import {
  MarkerDragHandle,
  MarkerDragPreview,
} from "@/components/modals/minimap/MarkerDragHandle";
import {
  TRIP_REPORT_MARKERS_LAYER_ID,
  TripReportMarkersLayer,
} from "@/components/modals/minimap/TripReportMarkersLayer";
import {
  SelectedWaypointDragHandle,
  WaypointDragPreview,
  type WaypointDragSession,
} from "@/components/modals/minimap/WaypointDragHandle";
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
import { mapPositionAt } from "@/utils/map/mapPositionAt";
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
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import {
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from "react-native";

import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import type {
  LegendItem,
  TripReportLineSegment,
  TripReportMarker,
  TripReportWaypoint,
} from "ropegeo-common/models";
import { TRIP_REPORT_EDIT_PANEL_EXIT_MS } from "./panels/TripReportEditPanel";
import { TripReportLegend } from "./panels/TripReportLegend";
import { TripReportMarkerPanel } from "./panels/TripReportMarkerPanel";
import { TripReportSegmentPanel } from "./panels/TripReportSegmentPanel";
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

/** `view`'s frame in window coordinates, or null if it isn't mounted. */
function measureInWindow(
  view: View | null,
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (view == null) {
      resolve(null);
      return;
    }
    view.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
  });
}

/** Default map center when location is unavailable (Moab, UT). [lng, lat]. */
const DEFAULT_MAP_CENTER: [number, number] = [-109.5508, 38.5733];
const DEFAULT_ZOOM = 13;
const USER_LOCATION_ZOOM = 14;
const COLLAPSED_CAMERA_ANIMATION_MS = 250;
const LEGEND_CAMERA_ANIMATION_MS = 300;
/** Horizontal gap between an edit panel and the legend, split around the screen center. */
const EDIT_PANEL_LEGEND_GAP = 8;
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
/** Taps this close (in points) to a marker or line select it, so thin lines are easy to hit. */
const MAP_PRESS_TOLERANCE = 12;
/** Waits out the fit animation before treating the camera as fitted to the features. */
const FIT_SETTLE_MS = MINIMAP_FIT_BOUNDS_ANIMATION_MS + 80;

/** Bounds of everything drawn on the map: segments with waypoints, markers, and imported areas. */
function useFeatureBounds(
  segments: readonly TripReportLineSegment[],
  markers: readonly TripReportMarker[],
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
          ...markers.map((marker) => marker.toFeature()),
          ...features,
        ],
      }),
    [segments, markers, features],
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
  markers: readonly TripReportMarker[];
  /** Imported polygon features, each with a legend id keyed into `legend`. */
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
  onUpdateMarker: (markerId: string, update: (marker: TripReportMarker) => TripReportMarker) => void;
  onRemoveMarker: (markerId: string) => void;
  /** Adds a new marker at `position`. */
  onAddMarker: (position: TripReportWaypoint) => void;
  /** Geometric waypoint move (pushes map-block undo). */
  onMoveWaypoint: (
    segmentId: string,
    waypointIndex: number,
    position: TripReportWaypoint,
  ) => void;
  /** Inserts a waypoint at `index` (pushes map-block undo). */
  onInsertWaypoint: (
    segmentId: string,
    index: number,
    position: TripReportWaypoint,
  ) => void;
  /** Removes a waypoint (pushes map-block undo). */
  onRemoveWaypoint: (segmentId: string, waypointIndex: number) => void;
  /** Splits a segment at `waypointIndex` (pushes map-block undo). */
  onSplitSegment: (segmentId: string, waypointIndex: number) => void;
  /** Geometric marker move (pushes map-block undo). */
  onMoveMarker: (markerId: string, position: TripReportWaypoint) => void;
  /** Whether the map block has anything on its undo stack. */
  canUndo: boolean;
  onUndo: () => void;
};

/**
 * Minimap for a trip report map block. Loads no backend data: it shows the base map, the block's
 * line segments and markers, and its imported areas. With anything on the map, the collapsed
 * camera fits all of it; otherwise it centers on the user's position when location is already
 * allowed, else on Moab. Must be rendered inside a `MiniMapAnimatedCard`.
 */
export function TripReportMiniMapView({
  segments,
  markers,
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
  onUpdateMarker,
  onRemoveMarker,
  onAddMarker,
  onMoveWaypoint,
  onInsertWaypoint,
  onRemoveWaypoint,
  onSplitSegment,
  onMoveMarker,
  canUndo,
  onUndo,
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
  const featureBounds = useFeatureBounds(segments, markers, features);

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

  // One segment or marker is selected at a time (their ids never collide within a block).
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedSegment = segments.find((segment) => segment.id === selectedItemId) ?? null;
  const selectedMarker = markers.find((marker) => marker.id === selectedItemId) ?? null;
  // Index into the selected segment's waypoints when one is being edited; null otherwise.
  const [selectedWaypointIndex, setSelectedWaypointIndex] = useState<number | null>(null);
  // A marker being dragged is drawn under the finger and left off the map; the block only changes
  // when it's dropped. Unselected markers start from MapView long-press; the selected marker uses
  // a hit target so a drag moves it immediately.
  const [draggedMarkerId, setDraggedMarkerId] = useState<string | null>(null);
  /** True while a long-press (not selected-handle) marker drag is in progress. */
  const [markerTouchDragActive, setMarkerTouchDragActive] = useState(false);
  const markerDragX = useSharedValue(0);
  const markerDragY = useSharedValue(0);
  const markerDragging = useSharedValue(false);
  // Same for a waypoint: the map hides it (and the edges through it) while the preview follows the
  // finger; the segment only changes when it's dropped. Unselected waypoints start from MapView
  // long-press; the selected waypoint uses a hit target so a drag moves it immediately.
  const [draggedWaypointIndex, setDraggedWaypointIndex] = useState<number | null>(null);
  const [waypointDragSession, setWaypointDragSession] = useState<WaypointDragSession | null>(null);
  const waypointDragX = useSharedValue(0);
  const waypointDragY = useSharedValue(0);
  const waypointDragging = useSharedValue(false);
  // Bumped as the camera moves while a marker or waypoint is selected, so its drag handle follows.
  const [cameraRevision, setCameraRevision] = useState(0);
  // Fingers down on the map frame; drag handles cancel when a second finger starts a pinch.
  const mapPointerCount = useSharedValue(0);
  const syncMapPointerCount = useCallback((event: GestureResponderEvent) => {
    mapPointerCount.value = event.nativeEvent.touches.length;
  }, [mapPointerCount]);
  const mapTouchRootRef = useRef<View>(null);
  const mapFrameRef = useRef<View>(null);
  /** Window origin of the map touch root; feature drag math is in that view's space. */
  const overlayWindowOriginRef = useRef<{ x: number; y: number } | null>(null);
  /** Ignore MapView onPress shortly after a long-press so both don't fire for one gesture. */
  const ignoreMapPressUntilRef = useRef(0);
  const draggedWaypointIndexRef = useRef<number | null>(null);
  draggedWaypointIndexRef.current = draggedWaypointIndex;
  const draggedMarkerIdRef = useRef<string | null>(null);
  draggedMarkerIdRef.current = draggedMarkerId;
  /**
   * Long-press drags follow the finger via the map root's touch move handlers. Selected-handle
   * drags use RNGH instead, so those handlers must stay out of the way.
   */
  const waypointDragTracksTouchRef = useRef(false);
  const markerDragTracksTouchRef = useRef(false);
  /** Selects a legend item (or clears selection) and drops any feature being dragged. */
  const selectItem = useCallback((id: string | null) => {
    setSelectedItemId(id);
    setSelectedWaypointIndex(null);
    setDraggedWaypointIndex(null);
    setWaypointDragSession(null);
    waypointDragTracksTouchRef.current = false;
    waypointDragging.value = false;
    setDraggedMarkerId(null);
    setMarkerTouchDragActive(false);
    markerDragTracksTouchRef.current = false;
    markerDragging.value = false;
  }, [markerDragging, waypointDragging]);
  // An edit panel shows whenever an item is selected, whether or not the legend is expanded.
  const editPanelVisible = selectedSegment != null || selectedMarker != null;
  /** The legend or an edit panel covers the bottom of the screen. */
  const bottomPanelsOpen = legendExpanded || editPanelVisible;
  // The panel is keyed by item, so switching items slides the old panel out and a new one in.
  // When it replaces another item's panel, the new one waits for the old one to leave.
  const panelItemId = editPanelVisible ? selectedItemId : null;
  const [panelItemIds, setPanelItemIds] = useState({
    current: panelItemId,
    previous: null as string | null,
  });
  if (panelItemIds.current !== panelItemId) {
    setPanelItemIds({ current: panelItemId, previous: panelItemIds.current });
  }
  const panelSwitchedItems = panelItemIds.previous != null && panelItemId != null;
  const editPanelEnterDelayMs = panelSwitchedItems ? TRIP_REPORT_EDIT_PANEL_EXIT_MS : 0;

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
    if (recording || selectNextAddedSegmentRef.current) selectItem(lastSegmentId);
    selectNextAddedSegmentRef.current = false;
  }, [lastSegmentId, recording, segments.length, selectItem]);

  useEffect(() => {
    if (!expanded) {
      setLegendExpanded(false);
      selectItem(null);
    }
  }, [expanded, selectItem]);

  // Drop the waypoint selection when the segment goes away or the index is no longer valid.
  useEffect(() => {
    if (selectedWaypointIndex == null) return;
    if (selectedSegment == null || selectedWaypointIndex >= selectedSegment.waypoints.length) {
      setSelectedWaypointIndex(null);
    }
  }, [selectedSegment, selectedWaypointIndex]);

  // Collapsing the legend keeps the selection, and the edit panel stays open beside it.
  const toggleLegendExpanded = () => setLegendExpanded(!legendExpanded);

  /**
   * With the legend or an edit panel open, camera padding moves the camera's center to the middle
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
  // Expanded fits stay clear of the header, buttons, and tab bar, and with the legend or an edit
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

  // Selecting a segment or marker focuses the camera on it. Its edit panel is open while it's
  // selected, so the fit padding keeps it in the top half of the screen, clear of the legend and
  // the panel. Only a new selection refocuses: a segment growing while it's recorded, a marker
  // being edited, or a segment selected before it has waypoints (a recording that just started)
  // leaves the camera alone.
  const selectedItemBounds = useMemo((): GeoBounds | null => {
    if (selectedSegment != null) return selectedSegment.bounds;
    if (selectedMarker == null) return null;
    const [lng, lat] = selectedMarker.position;
    return { north: lat, south: lat, east: lng, west: lng };
  }, [selectedSegment, selectedMarker]);
  const selectedItemBoundsRef = useRef(selectedItemBounds);
  selectedItemBoundsRef.current = selectedItemBounds;
  const focusedItemIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!expanded || selectedItemId == null) {
      focusedItemIdRef.current = null;
      return;
    }
    if (focusedItemIdRef.current === selectedItemId) return;
    focusedItemIdRef.current = selectedItemId;
    const bounds = selectedItemBoundsRef.current;
    if (bounds == null) return;
    markCameraMovedFromBounds();
    fitCameraToBounds(bounds, expandedViewport, expandedFitPadding, MINIMAP_FIT_BOUNDS_ANIMATION_MS);
  }, [
    expanded,
    expandedFitPadding,
    expandedViewport,
    fitCameraToBounds,
    markCameraMovedFromBounds,
    selectedItemId,
  ]);

  // A marker added by the add marker button opens its edit panel and expands the legend to show
  // it. It's already in the middle of the visible map, so the camera stays put rather than
  // focusing on it.
  const lastMarkerId = markers.length > 0 ? markers[markers.length - 1].id : null;
  const previousMarkersRef = useRef({ count: markers.length, lastId: lastMarkerId });
  const selectNextAddedMarkerRef = useRef(false);
  useEffect(() => {
    const previous = previousMarkersRef.current;
    previousMarkersRef.current = { count: markers.length, lastId: lastMarkerId };
    const added =
      lastMarkerId != null && lastMarkerId !== previous.lastId && markers.length > previous.count;
    if (!added || !selectNextAddedMarkerRef.current) return;
    selectNextAddedMarkerRef.current = false;
    focusedItemIdRef.current = lastMarkerId;
    selectItem(lastMarkerId);
    setLegendExpanded(true);
  }, [lastMarkerId, markers.length, selectItem]);

  // Tapping a marker, waypoint, or line on the expanded map selects it, like tapping its legend
  // row, and expands the legend to show it. Markers win over waypoints, waypoints over lines;
  // tapping none of them clears the selection. Short-press centers on a marker or waypoint;
  // long-press starts a drag without moving the camera (same query hit-testing as press).
  const mapRef = useRef<ComponentRef<typeof MapView>>(null);
  const pressableLayerIds = useMemo(() => {
    const waypointIds =
      selectedSegment != null ? recordedSegmentWaypointLayerIds(selectedSegment) : [];
    return [
      ...(markers.length > 0 ? [TRIP_REPORT_MARKERS_LAYER_ID] : []),
      ...waypointIds,
      ...segments.flatMap(recordedSegmentLineLayerIds),
    ];
  }, [markers.length, segments, selectedSegment]);
  const waypointLayerIds = useMemo(
    () => (selectedSegment != null ? recordedSegmentWaypointLayerIds(selectedSegment) : []),
    [selectedSegment],
  );
  const markerLayerIds = useMemo(
    () => (markers.length > 0 ? [TRIP_REPORT_MARKERS_LAYER_ID] : []),
    [markers.length],
  );

  const queryHitsAtScreenPoint = useCallback(
    async (x: number, y: number, layerIds: string[]) => {
      const map = mapRef.current;
      if (map == null || layerIds.length === 0) return [] as GeoJSON.Feature[];
      const t = MAP_PRESS_TOLERANCE;
      try {
        const rendered = await map.queryRenderedFeaturesInRect(
          [y - t, x - t, y + t, x + t],
          [],
          layerIds,
        );
        return rendered?.features ?? [];
      } catch (error) {
        console.warn("[TripReportMiniMapView] couldn't query pressed features", error);
        return [];
      }
    },
    [],
  );

  const endWaypointDrag = useCallback(
    async (dropped: boolean) => {
      const index = draggedWaypointIndexRef.current;
      const segment = selectedSegment;
      const map = mapRef.current;
      let position: TripReportWaypoint | null = null;
      if (dropped && index != null && segment != null && map != null) {
        const from = segment.waypoints[index];
        if (from != null) {
          try {
            position = await mapPositionAt(
              map,
              [waypointDragX.value, waypointDragY.value],
              from,
            );
          } catch {
            /* leave where it was */
          }
        }
      }
      waypointDragging.value = false;
      waypointDragTracksTouchRef.current = false;
      setDraggedWaypointIndex(null);
      setWaypointDragSession(null);
      if (index != null && position != null && segment != null) {
        onMoveWaypoint(segment.id, index, position);
      }
    },
    [onMoveWaypoint, selectedSegment, waypointDragX, waypointDragY, waypointDragging],
  );

  const endMarkerTouchDrag = useCallback(
    async (dropped: boolean) => {
      const markerId = draggedMarkerIdRef.current;
      const marker = markers.find((entry) => entry.id === markerId) ?? null;
      const map = mapRef.current;
      let position: TripReportWaypoint | null = null;
      if (dropped && marker != null && map != null) {
        try {
          position = await mapPositionAt(
            map,
            [markerDragX.value, markerDragY.value],
            marker.position,
          );
        } catch {
          /* leave where it was */
        }
      }
      markerDragging.value = false;
      markerDragTracksTouchRef.current = false;
      setMarkerTouchDragActive(false);
      setDraggedMarkerId(null);
      if (markerId != null && position != null) {
        onMoveMarker(markerId, position);
      }
    },
    [markerDragX, markerDragY, markerDragging, markers, onMoveMarker],
  );

  const beginMarkerTouchDrag = useCallback(
    async (marker: TripReportMarker, screenPoint: [number, number]) => {
      markerDragX.value = screenPoint[0];
      markerDragY.value = screenPoint[1];
      markerDragging.value = true;
      markerDragTracksTouchRef.current = true;
      setDraggedMarkerId(marker.id);
      setMarkerTouchDragActive(true);
      const overlay = await measureInWindow(mapTouchRootRef.current);
      if (overlay != null) {
        overlayWindowOriginRef.current = { x: overlay.x, y: overlay.y };
      }
    },
    [markerDragX, markerDragY, markerDragging],
  );

  const beginWaypointDrag = useCallback(
    async (segment: TripReportLineSegment, index: number, screenPoint: [number, number]) => {
      const map = mapRef.current;
      // Hide the map waypoint and follow the finger right away; neighbors / overlay origin fill in.
      waypointDragX.value = screenPoint[0];
      waypointDragY.value = screenPoint[1];
      waypointDragging.value = true;
      setDraggedWaypointIndex(index);
      setWaypointDragSession({
        index,
        origin: screenPoint,
        neighbors: { prev: null, next: null },
      });
      const overlay = await measureInWindow(mapTouchRootRef.current);
      if (overlay != null) {
        overlayWindowOriginRef.current = { x: overlay.x, y: overlay.y };
      }
      const neighborPoint = async (neighborIndex: number): Promise<[number, number] | null> => {
        if (map == null || neighborIndex < 0 || neighborIndex >= segment.waypoints.length) {
          return null;
        }
        const wp = segment.waypoints[neighborIndex];
        if (wp == null) return null;
        try {
          const point = (await map.getPointInView(wp)) as [number, number];
          return point[0] >= 0 && point[1] >= 0 ? point : null;
        } catch {
          return null;
        }
      };
      const [prev, next] = await Promise.all([
        neighborPoint(index - 1),
        neighborPoint(index + 1),
      ]);
      setWaypointDragSession((current) =>
        current?.index === index ? { ...current, neighbors: { prev, next } } : current,
      );
    },
    [waypointDragX, waypointDragY, waypointDragging],
  );

  const onMapPress = useCallback(
    async (feature: GeoJSON.Feature) => {
      if (!expanded) return;
      if (Date.now() < ignoreMapPressUntilRef.current) return;
      if (draggedWaypointIndexRef.current != null || draggedMarkerIdRef.current != null) return;
      if (pressableLayerIds.length === 0) {
        selectItem(null);
        return;
      }
      const { screenPointX: x, screenPointY: y } = feature.properties as {
        screenPointX: number;
        screenPointY: number;
      };
      const hits = await queryHitsAtScreenPoint(x, y, pressableLayerIds);
      const idFrom = (key: "markerId" | "segmentId") =>
        hits.map((hit) => hit.properties?.[key]).find((id) => typeof id === "string") ?? null;
      const pressedMarkerId = idFrom("markerId");
      if (pressedMarkerId != null) {
        const marker = markers.find((entry) => entry.id === pressedMarkerId);
        // Prefer centering on the tapped marker over the selection-effect fit (and re-center when
        // it's already selected).
        focusedItemIdRef.current = pressedMarkerId;
        selectItem(pressedMarkerId);
        setLegendExpanded(true);
        if (marker != null) {
          const [lng, lat] = marker.position;
          markCameraMovedFromBounds();
          fitCameraToBounds(
            { north: lat, south: lat, east: lng, west: lng },
            expandedViewport,
            expandedFitPadding,
            MINIMAP_FIT_BOUNDS_ANIMATION_MS,
          );
        }
        return;
      }
      const waypointHit = hits.find((hit) => {
        const index = hit.properties?.waypointIndex;
        return typeof index === "number" && typeof hit.properties?.segmentId === "string";
      });
      if (waypointHit != null) {
        const segmentId = waypointHit.properties!.segmentId as string;
        const index = waypointHit.properties!.waypointIndex as number;
        const segment = segments.find((entry) => entry.id === segmentId);
        const waypoint = segment?.waypoints[index];
        // Prefer centering on the tapped waypoint over a segment-wide fit.
        focusedItemIdRef.current = segmentId;
        setSelectedItemId(segmentId);
        setSelectedWaypointIndex(index);
        setLegendExpanded(true);
        if (waypoint != null) {
          const [lng, lat] = waypoint;
          markCameraMovedFromBounds();
          fitCameraToBounds(
            { north: lat, south: lat, east: lng, west: lng },
            expandedViewport,
            expandedFitPadding,
            MINIMAP_FIT_BOUNDS_ANIMATION_MS,
          );
        }
        return;
      }
      const pressedSegmentId = idFrom("segmentId");
      selectItem(pressedSegmentId);
      if (pressedSegmentId != null) setLegendExpanded(true);
    },
    [
      expanded,
      expandedFitPadding,
      expandedViewport,
      fitCameraToBounds,
      markCameraMovedFromBounds,
      markers,
      pressableLayerIds,
      queryHitsAtScreenPoint,
      segments,
      selectItem,
    ],
  );

  const onMapLongPress = useCallback(
    async (feature: GeoJSON.Feature) => {
      if (!expanded) return;
      if (draggedWaypointIndexRef.current != null || draggedMarkerIdRef.current != null) return;
      const { screenPointX: x, screenPointY: y } = feature.properties as {
        screenPointX: number;
        screenPointY: number;
      };
      if (markerLayerIds.length > 0) {
        const markerHits = await queryHitsAtScreenPoint(x, y, markerLayerIds);
        const markerId =
          markerHits
            .map((hit) => hit.properties?.markerId)
            .find((id) => typeof id === "string") ?? null;
        const marker = markerId != null ? markers.find((entry) => entry.id === markerId) : null;
        if (marker != null) {
          ignoreMapPressUntilRef.current = Date.now() + 800;
          // Keep the camera put; clear any waypoint edit without wiping the drag we're starting.
          focusedItemIdRef.current = marker.id;
          setSelectedItemId(marker.id);
          setSelectedWaypointIndex(null);
          setDraggedWaypointIndex(null);
          setWaypointDragSession(null);
          waypointDragTracksTouchRef.current = false;
          waypointDragging.value = false;
          setLegendExpanded(true);
          await beginMarkerTouchDrag(marker, [x, y]);
          return;
        }
      }
      if (selectedSegment == null || waypointLayerIds.length === 0) return;
      const hits = await queryHitsAtScreenPoint(x, y, waypointLayerIds);
      const waypointHit = hits.find((hit) => {
        const index = hit.properties?.waypointIndex;
        return (
          typeof index === "number" &&
          hit.properties?.segmentId === selectedSegment.id
        );
      });
      if (waypointHit == null) return;
      const index = waypointHit.properties!.waypointIndex as number;
      ignoreMapPressUntilRef.current = Date.now() + 800;
      // Keep the camera put: mark the segment as already focused so the selection effect skips.
      focusedItemIdRef.current = selectedSegment.id;
      setSelectedItemId(selectedSegment.id);
      setSelectedWaypointIndex(index);
      setLegendExpanded(true);
      waypointDragTracksTouchRef.current = true;
      await beginWaypointDrag(selectedSegment, index, [x, y]);
    },
    [
      beginMarkerTouchDrag,
      beginWaypointDrag,
      expanded,
      markerLayerIds,
      markers,
      queryHitsAtScreenPoint,
      selectedSegment,
      waypointDragging,
      waypointLayerIds,
    ],
  );

  const onMapTouchMove = useCallback(
    (event: GestureResponderEvent) => {
      syncMapPointerCount(event);
      const trackingWaypoint =
        waypointDragTracksTouchRef.current && draggedWaypointIndexRef.current != null;
      const trackingMarker =
        markerDragTracksTouchRef.current && draggedMarkerIdRef.current != null;
      if (!trackingWaypoint && !trackingMarker) return;
      if (event.nativeEvent.touches.length > 1) {
        if (trackingWaypoint) void endWaypointDrag(false);
        if (trackingMarker) void endMarkerTouchDrag(false);
        return;
      }
      const touch = event.nativeEvent.touches[0];
      const origin = overlayWindowOriginRef.current;
      if (touch == null || origin == null) return;
      const x = touch.pageX - origin.x;
      const y = touch.pageY - origin.y;
      if (trackingWaypoint) {
        waypointDragX.value = x;
        waypointDragY.value = y;
      }
      if (trackingMarker) {
        markerDragX.value = x;
        markerDragY.value = y;
      }
    },
    [
      endMarkerTouchDrag,
      endWaypointDrag,
      markerDragX,
      markerDragY,
      syncMapPointerCount,
      waypointDragX,
      waypointDragY,
    ],
  );

  const onMapTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      syncMapPointerCount(event);
      if (event.nativeEvent.touches.length !== 0) return;
      if (waypointDragTracksTouchRef.current && draggedWaypointIndexRef.current != null) {
        void endWaypointDrag(true);
      }
      if (markerDragTracksTouchRef.current && draggedMarkerIdRef.current != null) {
        void endMarkerTouchDrag(true);
      }
    },
    [endMarkerTouchDrag, endWaypointDrag, syncMapPointerCount],
  );

  const onMapTouchCancel = useCallback(
    (event: GestureResponderEvent) => {
      syncMapPointerCount(event);
      if (waypointDragTracksTouchRef.current && draggedWaypointIndexRef.current != null) {
        void endWaypointDrag(false);
      }
      if (markerDragTracksTouchRef.current && draggedMarkerIdRef.current != null) {
        void endMarkerTouchDrag(false);
      }
    },
    [endMarkerTouchDrag, endWaypointDrag, syncMapPointerCount],
  );

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

  const headerTop = shell.insets.top + headerChrome.rowTopInset;

  // Where the header row (with the ghost route dropdown) ends, and the views measured to find the
  // middle of the visible map.
  const headerHeightRef = useRef(0);
  const chromeRef = useRef<View>(null);
  const legendCardRef = useRef<View>(null);
  const editPanelCardRef = useRef<View>(null);

  /**
   * Geographic position in the middle of the visible map: centered across it, and halfway between
   * the bottom of the ghost route dropdown and the top of the legend or edit panel.
   */
  const positionAtVisibleMapMiddle = useCallback(async (): Promise<TripReportWaypoint | null> => {
    const map = mapRef.current;
    if (map == null) return null;
    const [chrome, legendCard, editPanelCard] = await Promise.all([
      measureInWindow(chromeRef.current),
      measureInWindow(legendCardRef.current),
      measureInWindow(editPanelCardRef.current),
    ]);
    if (chrome == null) return null;
    const panelTops = [legendCard, editPanelCard]
      .filter((card) => card != null)
      .map((card) => card.y - chrome.y);
    const panelsTop = panelTops.length > 0 ? Math.min(...panelTops) : chrome.height;
    const dropdownBottom = headerTop + headerHeightRef.current;
    const screenPoint: [number, number] = [chrome.width / 2, (dropdownBottom + panelsTop) / 2];
    try {
      const center = await map.getCenter();
      return await mapPositionAt(map, screenPoint, [center[0], center[1]]);
    } catch {
      return null;
    }
  }, [headerTop]);

  /**
   * Adds a marker in the middle of the visible map.
   */
  const addMarkerAtMapMiddle = useCallback(async () => {
    const position = await positionAtVisibleMapMiddle();
    if (position == null) {
      console.warn("[TripReportMiniMapView] couldn't place the new marker");
      return;
    }
    selectNextAddedMarkerRef.current = true;
    onAddMarker(position);
  }, [onAddMarker, positionAtVisibleMapMiddle]);

  /** ~15 m nudge when a new waypoint would land on the selected one. */
  const NUDGE_DEG = 0.00015;

  const insertWaypointNearVisibleMiddle = useCallback(
    async (segmentId: string, index: number, avoid: TripReportWaypoint | null) => {
      let position = await positionAtVisibleMapMiddle();
      if (position == null) {
        console.warn("[TripReportMiniMapView] couldn't place the new waypoint");
        return;
      }
      if (
        avoid != null &&
        Math.abs(position[0] - avoid[0]) < NUDGE_DEG &&
        Math.abs(position[1] - avoid[1]) < NUDGE_DEG
      ) {
        position = [avoid[0] + NUDGE_DEG, avoid[1] + NUDGE_DEG];
      }
      onInsertWaypoint(segmentId, index, position);
      setSelectedWaypointIndex(index);
    },
    [onInsertWaypoint, positionAtVisibleMapMiddle],
  );

  const addMidWaypoint = useCallback(() => {
    if (selectedSegment == null || selectedWaypointIndex == null) return;
    const avoid = selectedSegment.waypoints[selectedWaypointIndex] ?? null;
    void insertWaypointNearVisibleMiddle(
      selectedSegment.id,
      selectedWaypointIndex + 1,
      avoid,
    );
  }, [insertWaypointNearVisibleMiddle, selectedSegment, selectedWaypointIndex]);

  const addEndWaypoint = useCallback(() => {
    if (selectedSegment == null) return;
    const last = selectedSegment.lastWaypoint;
    void insertWaypointNearVisibleMiddle(
      selectedSegment.id,
      selectedSegment.waypoints.length,
      last,
    );
  }, [insertWaypointNearVisibleMiddle, selectedSegment]);

  const removeSelectedWaypoint = useCallback(() => {
    if (selectedSegment == null || selectedWaypointIndex == null) return;
    const segmentId = selectedSegment.id;
    const index = selectedWaypointIndex;
    setSelectedWaypointIndex(null);
    onRemoveWaypoint(segmentId, index);
  }, [onRemoveWaypoint, selectedSegment, selectedWaypointIndex]);

  /** After a split, select the new segment's first waypoint (the former split point). */
  const pendingSplitSelectRef = useRef<string | null>(null);
  useEffect(() => {
    const afterId = pendingSplitSelectRef.current;
    if (afterId == null) return;
    const index = segments.findIndex((segment) => segment.id === afterId);
    const next = index >= 0 ? segments[index + 1] : null;
    if (next == null) return;
    pendingSplitSelectRef.current = null;
    focusedItemIdRef.current = next.id;
    setSelectedItemId(next.id);
    setSelectedWaypointIndex(0);
  }, [segments]);

  const splitAtSelectedWaypoint = useCallback(() => {
    if (selectedSegment == null || selectedWaypointIndex == null || selectedWaypointIndex === 0) {
      return;
    }
    pendingSplitSelectRef.current = selectedSegment.id;
    onSplitSegment(selectedSegment.id, selectedWaypointIndex);
  }, [onSplitSegment, selectedSegment, selectedWaypointIndex]);

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

  // Opening the first bottom panel (legend or edit panel) or closing the last one moves the
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

  const buttonStackTop = expandedMiniMapHeaderRowStackTop(headerTop, headerChrome, mapChrome);
  const overlayEdgeGap = expandedMiniMapOverlayEdgeGap(uiScale, fontScale);
  // Portal hosts already clear the tab bar, so only the scaled gap applies there.
  const legendBottomOffset = expandedMiniMapOverlayBottomOffset(
    shell.layoutHost === "portal" ? 0 : tabBarHeight,
    uiScale,
    fontScale,
  );
  const editPanelLeftOffset = shell.insets.left + overlayEdgeGap;
  const editPanelRightOffset = windowWidth / 2 + EDIT_PANEL_LEGEND_GAP / 2;

  return (
    <>
      {shell.mapBodyVisible ? (
        <View
          ref={mapTouchRootRef}
          collapsable={false}
          style={styles.mapTouchRoot}
          onTouchStart={syncMapPointerCount}
          onTouchMove={onMapTouchMove}
          onTouchEnd={onMapTouchEnd}
          onTouchCancel={onMapTouchCancel}
        >
          <View ref={mapFrameRef} collapsable={false} style={styles.mapFrame}>
            <MiniMapNativeGestureHost expanded={shell.expanded}>
              <MapView
                ref={mapRef}
                styleURL={mapLayers.styleUrl}
                style={[minimapStyles.map, !shell.mapChromeInteractive ? styles.hidden : null]}
                projection="globe"
                onLayout={onMapLayout}
                {...(() => {
                  const interaction = miniMapInteractionProps(shell.expanded);
                  return {
                    ...interaction,
                    gestureSettings: {
                      ...interaction.gestureSettings,
                      // Hold the map still while a feature follows the finger after long-press.
                      panEnabled:
                        interaction.gestureSettings.panEnabled &&
                        draggedWaypointIndex == null &&
                        draggedMarkerId == null,
                    },
                  };
                })()}
                scaleBarEnabled={false}
                attributionEnabled={shell.expanded}
                logoEnabled={shell.expanded}
                logoPosition={Platform.OS === "android" ? { bottom: 40, left: 10 } : undefined}
                attributionPosition={Platform.OS === "android" ? { bottom: 40, right: 10 } : undefined}
                onCameraChanged={(state) => {
                  onCameraChanged(state);
                  if (selectedMarker != null || selectedWaypointIndex != null) {
                    setCameraRevision((revision) => revision + 1);
                  }
                  if (shell.expanded) {
                    setMapLiveCenter(state.properties.center as [number, number]);
                    setMapLiveZoom(state.properties.zoom);
                  }
                }}
                onPress={onMapPress}
                onLongPress={onMapLongPress}
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
                      waypointsSegmentId={
                        shell.expanded ? (selectedSegment?.id ?? null) : null
                      }
                      selectedWaypointIndex={
                        shell.expanded ? selectedWaypointIndex : null
                      }
                      hiddenWaypointIndex={
                        shell.expanded ? draggedWaypointIndex : null
                      }
                    />
                    <TripReportMarkersLayer
                      markers={markers}
                      selectedMarkerId={
                        shell.expanded ? (selectedMarker?.id ?? null) : null
                      }
                      hiddenMarkerId={draggedMarkerId}
                    />
                  </>
                ) : null}
              </MapView>
            </MiniMapNativeGestureHost>
          </View>
          {shell.expanded &&
          styleReady &&
          selectedSegment != null &&
          selectedWaypointIndex != null &&
          selectedSegment.waypoints[selectedWaypointIndex] != null ? (
            <SelectedWaypointDragHandle
              key={`${selectedSegment.id}-${selectedWaypointIndex}`}
              mapRef={mapRef}
              waypoint={selectedSegment.waypoints[selectedWaypointIndex]}
              cameraRevision={cameraRevision}
              pointerCount={mapPointerCount}
              dragX={waypointDragX}
              dragY={waypointDragY}
              dragging={waypointDragging}
              onDragStart={(screenPoint) => {
                waypointDragTracksTouchRef.current = false;
                void beginWaypointDrag(selectedSegment, selectedWaypointIndex, screenPoint);
              }}
              onDragEnd={(dropped) => {
                void endWaypointDrag(dropped);
              }}
            />
          ) : null}
          {shell.expanded &&
          styleReady &&
          selectedSegment != null &&
          waypointDragSession != null ? (
            <WaypointDragPreview
              segment={selectedSegment}
              session={waypointDragSession}
              dragX={waypointDragX}
              dragY={waypointDragY}
              dragging={waypointDragging}
            />
          ) : null}
          {shell.expanded &&
          styleReady &&
          markerTouchDragActive &&
          selectedMarker != null ? (
            <MarkerDragPreview
              marker={selectedMarker}
              dragX={markerDragX}
              dragY={markerDragY}
              dragging={markerDragging}
            />
          ) : null}
          {shell.expanded && styleReady && selectedMarker != null && !markerTouchDragActive ? (
            <MarkerDragHandle
              key={selectedMarker.id}
              mapRef={mapRef}
              marker={selectedMarker}
              cameraRevision={cameraRevision}
              pointerCount={mapPointerCount}
              onDragStart={() => setDraggedMarkerId(selectedMarker.id)}
              onDragEnd={(position) => {
                setDraggedMarkerId(null);
                if (position != null) {
                  onMoveMarker(selectedMarker.id, position);
                }
              }}
            />
          ) : null}
        </View>
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
          <RecordSettingsButton
            designSize={RECORD_CONTROL_DESIGN_SIZE}
            onPress={() => setRecordSettingsOpen(true)}
          />
          <RecordLineSegmentButton
            recording={recording}
            onPress={onToggleRecording}
            disabled={blockedByOtherRecording}
            showLineSegment
            designSize={RECORD_CONTROL_DESIGN_SIZE}
            accessibilityLabel={blockedByOtherRecording ? "Recording another map" : undefined}
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
            showBack={false}
            top={headerTop}
            onHeaderHeightChange={(height) => (headerHeightRef.current = height)}
            chromeInteractive={shell.mapChromeInteractive}
            titleSlot={
              <TripReportGhostDropdown
                selectedPage={ghostPage}
                onSelectPage={setGhostPageId}
                interactive={shell.mapChromeInteractive}
              />
            }
          />
          <ButtonStack top={headerTop} left={headerChrome.edgeInset}>
            <ButtonStack.Slot id="back" visible animateLayout={false}>
              <BackButton onPress={shell.requestCollapse} />
            </ButtonStack.Slot>
            <ButtonStack.Slot id="add-mid-waypoint" visible={selectedWaypointIndex != null}>
              <AddMidWaypointButton onPress={addMidWaypoint} />
            </ButtonStack.Slot>
            <ButtonStack.Slot
              id="split-segment"
              visible={selectedWaypointIndex != null && selectedWaypointIndex > 0}
            >
              <SplitSegmentButton onPress={splitAtSelectedWaypoint} />
            </ButtonStack.Slot>
            <ButtonStack.Slot id="remove-waypoint" visible={selectedWaypointIndex != null}>
              <RemoveWaypointButton onPress={removeSelectedWaypoint} />
            </ButtonStack.Slot>
            <ButtonStack.Slot id="undo" visible={canUndo}>
              <UndoButton onPress={onUndo} />
            </ButtonStack.Slot>
          </ButtonStack>
          <View
            ref={chromeRef}
            collapsable={false}
            style={[StyleSheet.absoluteFill, !shell.mapChromeInteractive ? styles.dimmed : null]}
            pointerEvents={shell.mapChromeInteractive ? "box-none" : "none"}
          >
            {selectedSegment != null ? (
              <TripReportSegmentPanel
                key={selectedSegment.id}
                enterDelayMs={editPanelEnterDelayMs}
                segment={selectedSegment}
                cardRef={editPanelCardRef}
                maxHeight={windowHeight / 3}
                leftOffset={editPanelLeftOffset}
                rightOffset={editPanelRightOffset}
                bottomOffset={legendBottomOffset}
                recording={selectedSegment.id === recordingSegmentId}
                recordingPulse={recordingPulse}
                onToggleRecording={() => onToggleSegmentRecording(selectedSegment.id)}
                recordDisabled={locationDisabled}
                onOpenRecordSettings={() => setRecordSettingsOpen(true)}
                onAddEndWaypoint={addEndWaypoint}
                onUpdate={(update) => onUpdateSegment(selectedSegment.id, update)}
                onDelete={() => {
                  selectItem(null);
                  onRemoveSegment(selectedSegment.id);
                }}
              />
            ) : null}
            {selectedMarker != null ? (
              <TripReportMarkerPanel
                key={selectedMarker.id}
                enterDelayMs={editPanelEnterDelayMs}
                marker={selectedMarker}
                cardRef={editPanelCardRef}
                maxHeight={windowHeight / 3}
                leftOffset={editPanelLeftOffset}
                rightOffset={editPanelRightOffset}
                bottomOffset={legendBottomOffset}
                onUpdate={(update) => onUpdateMarker(selectedMarker.id, update)}
                onDelete={() => {
                  selectItem(null);
                  onRemoveMarker(selectedMarker.id);
                }}
              />
            ) : null}
            <TripReportLegend
              segments={segments}
              markers={markers}
              expanded={legendExpanded}
              maxHeight={windowHeight / 3}
              leftOffset={windowWidth / 2 + (editPanelVisible ? EDIT_PANEL_LEGEND_GAP / 2 : 0)}
              bottomOffset={legendBottomOffset}
              rightInset={shell.insets.right + overlayEdgeGap}
              onToggleExpanded={toggleLegendExpanded}
              selectedItemId={selectedItemId}
              onSelectItem={selectItem}
              recording={recording}
              recordingPulse={recordingPulse}
              blockedByOtherRecording={blockedByOtherRecording}
              onToggleRecording={onToggleRecording}
              recordingSegmentId={recordingSegmentId}
              onAddSegment={() => void addSegmentAtUserPosition()}
              addSegmentDisabled={locationDisabled}
              onAddMarker={() => void addMarkerAtMapMiddle()}
              cardRef={legendCardRef}
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
  /** Wraps the map and drag handles so finger count includes both. */
  mapTouchRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  mapFrame: {
    ...StyleSheet.absoluteFillObject,
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
