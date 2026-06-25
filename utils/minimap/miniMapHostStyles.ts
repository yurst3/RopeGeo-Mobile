import { StyleSheet } from "react-native";

export const miniMapHostStyles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3500,
  },
  mapCard: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  expandedCard: {
    zIndex: 3800,
    borderRadius: 0,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 3850,
  },
  previewContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3850,
  },
});
