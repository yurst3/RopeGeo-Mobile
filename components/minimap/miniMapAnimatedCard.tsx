import { miniMapHostStyles } from "@/components/minimap/shared/miniMapHostStyles";
import {
  MiniMapDirectionsButtons,
  MiniMapExpandButton,
  minimapStyles,
} from "@/components/minimap/shared/minimapShared";
import { type Rect, useMiniMapAnimation } from "@/components/minimap/shared/useMiniMapAnimation";
import { PlaceholderMiniMap } from "@/components/minimap/PlaceholderMiniMap";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import type { EdgeInsets } from "react-native-safe-area-context";

export type MiniMapShellApi = {
  anchorRect: Rect | null;
  mountNativeMap: boolean;
  expanded: boolean;
  /** True when native map is on and no blocking error (interior may render MapView). */
  mapBodyVisible: boolean;
  expandedPadding: ReturnType<typeof useMiniMapAnimation>["expandedPadding"];
  insets: EdgeInsets;
  setBlockingErrorMessage: (message: string | null) => void;
  setLoadingOverlayVisible: (visible: boolean) => void;
  registerCollapseCleanup: (fn: (() => void) | null) => void;
};

const MiniMapShellContext = createContext<MiniMapShellApi | null>(null);

export function useMiniMapShell(): MiniMapShellApi {
  const v = useContext(MiniMapShellContext);
  if (v == null) {
    throw new Error("useMiniMapShell must be used within MiniMapAnimatedCard");
  }
  return v;
}

const mapLoadingOverlayStyles = StyleSheet.create({
  overlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(229, 231, 235, 0.92)",
    borderRadius: minimapStyles.map.borderRadius,
  },
  placeholderCover: {
    zIndex: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  mapSlot: {
    flex: 1,
  },
});

type MiniMapAnimatedCardProps = {
  mountNativeMap: boolean;
  expanded: boolean;
  anchorRect: Rect | null;
  baseScrollY: number;
  scrollY: SharedValue<number>;
  onExpand: () => void;
  mapDirections?: { lat: number; lon: number } | null;
  children: ReactNode;
};

/**
 * Shared minimap chrome: host layout, expand/collapse animation, placeholder + loading overlays,
 * and collapsed expand/directions controls. Variants sync blocking/loading via {@link useMiniMapShell}.
 */
export function MiniMapAnimatedCard({
  mountNativeMap,
  expanded,
  anchorRect,
  baseScrollY,
  scrollY,
  onExpand,
  mapDirections,
  children,
}: MiniMapAnimatedCardProps) {
  const [blockingErrorMessage, setBlockingErrorMessage] = useState<string | null>(null);
  const [loadingOverlayVisible, setLoadingOverlayVisible] = useState(false);
  const collapseCleanupRef = useRef<(() => void) | null>(null);

  const registerCollapseCleanup = useCallback((fn: (() => void) | null) => {
    collapseCleanupRef.current = fn;
  }, []);

  const onCollapseTransition = useCallback(() => {
    collapseCleanupRef.current?.();
  }, []);

  const { cardStyle, expandedPadding, insets } = useMiniMapAnimation({
    anchorRect,
    baseScrollY,
    scrollY,
    expanded,
    onCollapseTransition,
  });

  const mapBodyVisible = mountNativeMap && blockingErrorMessage == null;
  const showPlaceholder = !mapBodyVisible;

  useEffect(() => {
    if (!mountNativeMap) {
      setBlockingErrorMessage(null);
      setLoadingOverlayVisible(false);
    }
  }, [mountNativeMap]);

  const shellApi = useMemo(
    (): MiniMapShellApi => ({
      anchorRect,
      mountNativeMap,
      expanded,
      mapBodyVisible,
      expandedPadding,
      insets,
      setBlockingErrorMessage,
      setLoadingOverlayVisible,
      registerCollapseCleanup,
    }),
    [
      anchorRect,
      mountNativeMap,
      expanded,
      mapBodyVisible,
      expandedPadding,
      insets,
      registerCollapseCleanup,
    ],
  );

  if (!anchorRect) return null;

  return (
    <MiniMapShellContext.Provider value={shellApi}>
      <View style={miniMapHostStyles.root} pointerEvents="box-none">
        <Animated.View
          style={[
            miniMapHostStyles.mapCard,
            cardStyle,
            expanded && miniMapHostStyles.expandedCard,
          ]}
          pointerEvents={expanded ? "auto" : "box-none"}
        >
          <View style={mapLoadingOverlayStyles.mapSlot}>
            {children}
            {showPlaceholder ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  mapLoadingOverlayStyles.placeholderCover,
                  minimapStyles.mapPlaceholder,
                ]}
                pointerEvents="auto"
              >
                <View style={[minimapStyles.map, minimapStyles.mapPlaceholder]} pointerEvents="none">
                  <PlaceholderMiniMap
                    errorMessage={
                      mountNativeMap && blockingErrorMessage != null
                        ? blockingErrorMessage
                        : undefined
                    }
                  />
                </View>
              </View>
            ) : null}
            {!showPlaceholder && loadingOverlayVisible ? (
              <View
                style={[StyleSheet.absoluteFill, mapLoadingOverlayStyles.overlay]}
                pointerEvents="none"
              >
                <PlaceholderMiniMap />
              </View>
            ) : null}
          </View>
          {!expanded && mapDirections != null ? (
            <MiniMapDirectionsButtons lat={mapDirections.lat} lon={mapDirections.lon} />
          ) : null}
          {!expanded && <MiniMapExpandButton onPress={onExpand} />}
        </Animated.View>
      </View>
    </MiniMapShellContext.Provider>
  );
}
