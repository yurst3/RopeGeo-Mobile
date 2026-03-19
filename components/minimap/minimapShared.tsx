import { FontAwesome5 } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

export const MINI_MAP_BORDER_RADIUS = 12;
export const EXPAND_BUTTON_SIZE = 40;
export const EXPAND_BUTTON_INSET = 8;

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
  expandButton: {
    position: "absolute",
    bottom: EXPAND_BUTTON_INSET,
    right: EXPAND_BUTTON_INSET,
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
});

export function MiniMapExpandButton({
  onPress,
}: {
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={minimapStyles.expandButton}
      onPress={onPress ?? (() => {})}
      accessibilityLabel="Expand map"
      accessibilityRole="button"
    >
      <FontAwesome5 name="expand" size={18} color="#000" />
    </Pressable>
  );
}

