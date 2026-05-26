import { ExpandMiniMapButton } from "@/components/buttons/standard/ExpandMiniMapButton";
import {
  MiniMapDirectionsButtons,
  minimapStyles,
} from "@/components/minimap/shared/minimapShared";
import {
  type MiniMapExpandLayout,
  useMiniMapAnimation,
} from "@/components/minimap/shared/useMiniMapAnimation";
import { PlaceholderMiniMap } from "@/components/minimap/PlaceholderMiniMap";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
  type ReactNode,
  type RefObject,
} from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import type { EdgeInsets } from "react-native-safe-area-context";

export type MiniMapShellApi = {
  mountNativeMap: boolean;
  expanded: boolean;
  layoutReady: boolean;
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

export type MiniMapAnimatedCardHandle = {
  remeasureLayout: () => void;
};

type MiniMapAnimatedCardProps = {
  mountNativeMap: boolean;
  expanded: boolean;
  expandAnchorRef: RefObject<View | null>;
  collapsedMeasureRef: RefObject<View | null>;
  onExpand: () => void;
  mapDirections?: { lat: number; lon: number } | null;
  children: ReactNode;
};

/** Measures expand/collapse rects in gate (collapsedMeasureRef) coordinates for absolute animation. */
function measureExpandLayout(
  expandAnchorRef: RefObject<View | null>,
  collapsedMeasureRef: RefObject<View | null>,
): Promise<MiniMapExpandLayout | null> {
  return new Promise((resolve) => {
    const anchor = expandAnchorRef.current;
    const collapsedNode = collapsedMeasureRef.current;
    if (anchor == null || collapsedNode == null) {
      resolve(null);
      return;
    }
    anchor.measureInWindow((ax, ay) => {
      collapsedNode.measureInWindow((cx, cy, cw, ch) => {
        const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
        const layout = {
          collapsed: {
            x: 0,
            y: 0,
            width: cw,
            height: ch,
          },
          expanded: {
            x: ax - cx,
            y: ay - cy,
            width: windowWidth,
            height: windowHeight,
          },
        };
        resolve(layout);
      });
    });
  });
}

/**
 * Shared minimap chrome: overlay host layout, expand/collapse animation, placeholder + loading overlays,
 * and collapsed expand/directions controls. Variants sync blocking/loading via {@link useMiniMapShell}.
 */
export const MiniMapAnimatedCard = forwardRef<MiniMapAnimatedCardHandle, MiniMapAnimatedCardProps>(
  function MiniMapAnimatedCard(
    {
      mountNativeMap,
      expanded,
      expandAnchorRef,
      collapsedMeasureRef,
      onExpand,
      mapDirections,
      children,
    },
    ref,
  ) {
    const [blockingErrorMessage, setBlockingErrorMessage] = useState<string | null>(null);
    const [loadingOverlayVisible, setLoadingOverlayVisible] = useState(false);
    const [layoutReady, setLayoutReady] = useState(false);
    const [expandLayout, setExpandLayout] = useState<MiniMapExpandLayout | null>(null);
    const collapseCleanupRef = useRef<(() => void) | null>(null);
    const cardRef = useRef<View>(null);
    const pendingExpandRef = useRef(false);

    const registerCollapseCleanup = useCallback((fn: (() => void) | null) => {
      collapseCleanupRef.current = fn;
    }, []);

    const onCollapseTransition = useCallback(() => {
      collapseCleanupRef.current?.();
    }, []);

    const remeasureLayout = useCallback(() => {
      void measureExpandLayout(expandAnchorRef, collapsedMeasureRef).then((layout) => {
        if (layout != null) {
          setExpandLayout(layout);
        }
      });
    }, [collapsedMeasureRef, expandAnchorRef]);

    useImperativeHandle(ref, () => ({ remeasureLayout }), [remeasureLayout]);

    useEffect(() => {
      if (expanded) return;
      const t = setTimeout(() => setExpandLayout(null), 230);
      return () => clearTimeout(t);
    }, [expanded]);

    const { cardStyle, expandedPadding, insets } = useMiniMapAnimation({
      expandLayout,
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

    useEffect(() => {
      if (!expanded) {
        remeasureLayout();
        pendingExpandRef.current = false;
        return;
      }
      remeasureLayout();
    }, [expanded, remeasureLayout]);

    useEffect(() => {
      if (!pendingExpandRef.current || expandLayout == null) return;
      pendingExpandRef.current = false;
      onExpand();
    }, [expandLayout, onExpand]);

    useEffect(() => {
      if (!expanded || !mountNativeMap || expandLayout != null) return;
      remeasureLayout();
    }, [expanded, mountNativeMap, expandLayout, remeasureLayout]);

    const handleExpandPress = useCallback(() => {
      void measureExpandLayout(expandAnchorRef, collapsedMeasureRef).then((layout) => {
        if (layout != null) {
          setExpandLayout(layout);
          pendingExpandRef.current = true;
        }
      });
    }, [collapsedMeasureRef, expandAnchorRef]);

    const shellApi = useMemo(
      (): MiniMapShellApi => ({
        mountNativeMap,
        expanded,
        layoutReady,
        mapBodyVisible,
        expandedPadding,
        insets,
        setBlockingErrorMessage,
        setLoadingOverlayVisible,
        registerCollapseCleanup,
      }),
      [
        mountNativeMap,
        expanded,
        layoutReady,
        mapBodyVisible,
        expandedPadding,
        insets,
        registerCollapseCleanup,
      ],
    );

    return (
      <MiniMapShellContext.Provider value={shellApi}>
        <Animated.View
          ref={cardRef}
          style={[styles.mapCard, cardStyle, expanded && styles.expandedCard]}
          pointerEvents={expanded ? "auto" : "box-none"}
          collapsable={false}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setLayoutReady(width > 0 && height > 0);
          }}
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
          {!expanded && <ExpandMiniMapButton onPress={handleExpandPress} />}
        </Animated.View>
      </MiniMapShellContext.Provider>
    );
  },
);

const styles = StyleSheet.create({
  mapCard: {
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  expandedCard: {
    elevation: 8,
  },
});
