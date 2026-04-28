import { openAppleMaps, openGoogleMaps } from "@/lib/openExternalMaps";
import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MiniMapType } from "ropegeo-common/models";

/** True when the minimap is a page tile map ({@link MiniMapType.Page}). */
export function isPageMiniMapType(t: MiniMapType): boolean {
  return t === MiniMapType.Page;
}

/** True when the minimap is the centered-region fallback ({@link MiniMapType.CenteredRegion}). */
export function isCenteredRegionMiniMapType(t: MiniMapType): boolean {
  return t === MiniMapType.CenteredRegion;
}

export const MINI_MAP_BORDER_RADIUS = 12;
export const EXPAND_BUTTON_SIZE = 40;
export const EXPAND_BUTTON_INSET = 8;
/** Horizontal gap between grouped map overlay circle buttons (e.g. directions). */
export const MAP_OVERLAY_BUTTON_GAP = 8;

export const CAMERA_PADDING = {
  paddingTop: 12,
  paddingBottom: 52,
  paddingLeft: 12,
  paddingRight: 12,
} as const;

export const minimapStyles = StyleSheet.create({
  wrapper: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: MINI_MAP_BORDER_RADIUS,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#e5e7eb",
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: MINI_MAP_BORDER_RADIUS,
  },
  mapPlaceholder: {
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  circleMapButton: {
    width: EXPAND_BUTTON_SIZE,
    height: EXPAND_BUTTON_SIZE,
    borderRadius: EXPAND_BUTTON_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  expandButton: {
    position: "absolute",
    bottom: EXPAND_BUTTON_INSET,
    right: EXPAND_BUTTON_INSET,
  },
  directionsButtonRow: {
    position: "absolute",
    bottom: EXPAND_BUTTON_INSET,
    left: EXPAND_BUTTON_INSET,
    flexDirection: "row",
    alignItems: "center",
    gap: MAP_OVERLAY_BUTTON_GAP,
  },
});

export function MiniMapExpandButton({
  onPress,
}: {
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[minimapStyles.circleMapButton, minimapStyles.expandButton]}
      onPress={onPress ?? (() => {})}
      accessibilityLabel="Expand map"
      accessibilityRole="button"
    >
      <FontAwesome5 name="expand" size={18} color="#000" />
    </Pressable>
  );
}

/** 22 × 1.2 — directions icons inside the 40pt overlay circles. */
const DIRECTIONS_ICON_SIZE = 30;

export function MiniMapDirectionsButtons({
  lat,
  lon,
}: {
  lat: number;
  lon: number;
}) {
  const onApple = useCallback(() => {
    void openAppleMaps(lat, lon);
  }, [lat, lon]);

  const onGoogle = useCallback(() => {
    void openGoogleMaps(lat, lon);
  }, [lat, lon]);

  return (
    <View style={minimapStyles.directionsButtonRow} pointerEvents="box-none">
      <Pressable
        style={({ pressed }) => [
          minimapStyles.circleMapButton,
          pressed && { opacity: 0.85 },
        ]}
        onPress={onApple}
        accessibilityLabel="Open Apple Maps"
        accessibilityRole="button"
      >
        <Image
          source={require("@/assets/images/icons/buttons/apple-directions.png")}
          style={directionsIconStyles.icon}
          contentFit="contain"
        />
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          minimapStyles.circleMapButton,
          pressed && { opacity: 0.85 },
        ]}
        onPress={onGoogle}
        accessibilityLabel="Open Google Maps"
        accessibilityRole="button"
      >
        <Image
          source={require("@/assets/images/icons/buttons/google-directions.png")}
          style={directionsIconStyles.icon}
          contentFit="contain"
        />
      </Pressable>
    </View>
  );
}

const directionsIconStyles = StyleSheet.create({
  icon: {
    width: DIRECTIONS_ICON_SIZE,
    height: DIRECTIONS_ICON_SIZE,
  },
});
