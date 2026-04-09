import { useTheme } from "@react-navigation/native";
import { Image } from "expo-image";
import { Pressable, StyleSheet } from "react-native";

export function FilterButton({
  onPress,
  persisted = false,
}: {
  onPress: () => void;
  /** Solid asset + primary tint when this filter slot is saved to storage. */
  persisted?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      accessibilityLabel="Filter"
      accessibilityRole="button"
    >
      <Image
        source={
          persisted
            ? require("@/assets/images/icons/buttons/filter-solid.png")
            : require("@/assets/images/icons/buttons/filter.png")
        }
        style={[styles.image, persisted && { tintColor: colors.primary }]}
        contentFit="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  image: {
    width: 26.4,
    height: 26.4,
  },
});
