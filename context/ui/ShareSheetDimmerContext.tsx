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
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
} from "react-native";

const SHARE_DIMMER_FADE_MS = 220;

/** Match {@link FilterBottomSheet} overlay. */
export const SHARE_SHEET_BACKDROP_COLOR = "rgba(0,0,0,0.45)";

type ShareSheetDimmerContextValue = {
  visible: boolean;
  showShareDimmer: () => void;
  hideShareDimmer: () => void;
};

const ShareSheetDimmerContext =
  createContext<ShareSheetDimmerContextValue | null>(null);

export function useShareSheetDimmer(): ShareSheetDimmerContextValue {
  const ctx = useContext(ShareSheetDimmerContext);
  if (ctx == null) {
    throw new Error(
      "useShareSheetDimmer must be used within ShareSheetDimmerProvider",
    );
  }
  return ctx;
}

/**
 * Holds share-dimming state. Does not use `Modal` (that breaks iOS share sheet anchoring).
 * Render {@link ShareSheetDimmerOverlay} in `(tabs)/_layout` so the dimmer covers tab content + tab bar.
 */
export function ShareSheetDimmerProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const showShareDimmer = useCallback(() => setVisible(true), []);
  const hideShareDimmer = useCallback(() => setVisible(false), []);

  const value = useMemo(
    () => ({ visible, showShareDimmer, hideShareDimmer }),
    [visible, showShareDimmer, hideShareDimmer],
  );

  return (
    <ShareSheetDimmerContext.Provider value={value}>
      {children}
    </ShareSheetDimmerContext.Provider>
  );
}

/**
 * Full-screen dimmer above the tab navigator (including the tab bar). Same UI window as the share target.
 */
export function ShareSheetDimmerOverlay() {
  const { visible, hideShareDimmer } = useShareSheetDimmer();
  const opacity = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setRendered(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!rendered) return;
    const anim = Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: SHARE_DIMMER_FADE_MS,
      easing: visible
        ? Easing.out(Easing.cubic)
        : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished && !visible) {
        setRendered(false);
      }
    });
    return () => anim.stop();
  }, [visible, rendered, opacity]);

  if (!rendered) return null;

  return (
    <Animated.View
      style={[styles.overlay, { opacity }]}
      pointerEvents={visible ? "box-none" : "none"}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={hideShareDimmer}
        accessibilityRole="button"
        accessibilityLabel="Dismiss dimmed overlay"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SHARE_SHEET_BACKDROP_COLOR,
    zIndex: 99999,
    elevation: 99999,
  },
});
