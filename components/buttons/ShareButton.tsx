import { Image } from "expo-image";
import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from "react-native";

export type ShareButtonProps = {
  onPress: () => void;
  /** Absolute top offset (stacked below the save button). */
  top: number;
  style?: StyleProp<ViewStyle>;
};

/** Circular header control for sharing the page (share.png). */
export function ShareButton({ onPress, top, style }: ShareButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, { top }, style]}
      accessibilityLabel="Share page"
      accessibilityRole="button"
    >
      <Image
        source={require("@/assets/images/icons/share.png")}
        style={styles.image}
        contentFit="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 16,
    zIndex: 3600,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: 22,
    height: 22,
  },
});
