import { Image } from "expo-image";
import { Pressable, StyleSheet } from "react-native";
import { minimapStyles } from "@/components/minimap/shared/minimapShared";

type ExpandMiniMapButtonProps = {
  onPress?: () => void;
};

/** Collapsed minimap control: expands the card to full-screen map. */
export function ExpandMiniMapButton({ onPress }: ExpandMiniMapButtonProps) {
  return (
    <Pressable
      style={[minimapStyles.circleMapButton, minimapStyles.expandButton]}
      onPress={onPress ?? (() => {})}
      accessibilityLabel="Expand map"
      accessibilityRole="button"
    >
      <Image
        source={require("@/assets/images/icons/buttons/expand.png")}
        style={styles.icon}
        contentFit="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 22,
    height: 22,
  },
});
