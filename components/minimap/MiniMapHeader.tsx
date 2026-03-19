import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BackButton } from "@/components/buttons/BackButton";
import {
  HEADER_BUTTON_SIZE,
  HEADER_SIDE_SLOT_WIDTH,
} from "@/components/minimap/fullScreenMapLayout";

export function MiniMapHeader({
  title,
  onBack,
  rightSlot,
  top,
}: {
  title: string;
  onBack: () => void;
  rightSlot?: ReactNode;
  top: number;
}) {
  return (
    <View style={[styles.headerRow, { top }]} pointerEvents="box-none">
      <View style={[styles.headerButtonWrap, { width: HEADER_SIDE_SLOT_WIDTH }]}>
        <BackButton onPress={onBack} />
      </View>
      <View style={styles.titleBar}>
        <Text style={styles.titleText} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {rightSlot ?? <View style={{ width: HEADER_SIDE_SLOT_WIDTH }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 3900,
    flexDirection: "row",
    alignItems: "center",
  },
  headerButtonWrap: {
    height: HEADER_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  titleBar: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 4,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
});
