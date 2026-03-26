import { useTheme } from "@react-navigation/native";
import { Image } from "expo-image";
import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from "react-native";

export type SaveButtonProps = {
  saved: boolean;
  onPress: () => void;
  /** Absolute top offset (e.g. `insets.top + 8`). */
  top: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Circular header control toggling saved state (saved.png / saved-solid.png + primary tint when saved).
 */
export function SaveButton({ saved, onPress, top, style }: SaveButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, { top }, style]}
      accessibilityLabel={saved ? "Remove from saved" : "Save page"}
      accessibilityRole="button"
    >
      <Image
        source={
          saved ? require("@/assets/images/icons/saved-solid.png") : require("@/assets/images/icons/saved.png")
        }
        style={[styles.image, saved && { tintColor: colors.primary }]}
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
