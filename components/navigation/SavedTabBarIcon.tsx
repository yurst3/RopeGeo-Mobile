import { useSavedTabHighlight } from "@/context/SavedTabHighlightContext";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

type Props = {
  color: string;
  size?: number;
  focused: boolean;
};

/** Halo diameter — matches prior layout. */
const HALO_SIZE = 56;
/** Layered solid circles (simulated radial); avoids react-native-svg RadialGradient on Fabric (shows “Unimplemented”). */
const HALO_LAYERS = [
  { size: HALO_SIZE, color: "rgba(74, 222, 128, 0.32)" },
  { size: 40, color: "rgba(74, 222, 128, 0.42)" },
  { size: 26, color: "rgba(134, 239, 172, 0.55)" },
] as const;

const HALO_SHRINK_MS = 240;

function SavedTabHalo() {
  return (
    <View style={styles.haloSlot} pointerEvents="none">
      {HALO_LAYERS.map(({ size, color }) => {
        const offset = (HALO_SIZE - size) / 2;
        return (
          <View
            key={size}
            style={[
              styles.haloDisc,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                top: offset,
                left: offset,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/**
 * Saved tab icon; shows a layered circular halo when {@link SavedTabHighlightContext} is active
 * (e.g. “Page saved” toast on RopewikiPageScreen).
 */
export function SavedTabBarIcon({ color, size, focused }: Props) {
  const { highlightSavedTab } = useSavedTabHighlight();
  const dim = size ?? 26;
  const [renderHalo, setRenderHalo] = useState(false);
  const haloScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (highlightSavedTab) {
      haloScale.stopAnimation();
      setRenderHalo(true);
      haloScale.setValue(0);
      Animated.spring(haloScale, {
        toValue: 1,
        friction: 7,
        tension: 88,
        useNativeDriver: true,
      }).start();
    } else {
      haloScale.stopAnimation();
      Animated.timing(haloScale, {
        toValue: 0,
        duration: HALO_SHRINK_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setRenderHalo(false);
      });
    }
  }, [highlightSavedTab]);

  return (
    <View
      style={[
        styles.wrap,
        renderHalo && styles.wrapWithHalo,
      ]}
    >
      {renderHalo ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.haloAnimatedWrap,
            { transform: [{ scale: haloScale }] },
          ]}
        >
          <SavedTabHalo />
        </Animated.View>
      ) : null}
      <Image
        source={
          focused
            ? require("@/assets/images/icons/buttons/saved-solid.png")
            : require("@/assets/images/icons/buttons/saved.png")
        }
        style={[styles.icon, { width: dim, height: dim, tintColor: color }]}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
    padding: 4,
  },
  wrapWithHalo: {
    width: HALO_SIZE,
    height: HALO_SIZE,
    padding: 0,
  },
  haloSlot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  haloAnimatedWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  haloDisc: {
    position: "absolute",
  },
  icon: {
    zIndex: 1,
  },
});
