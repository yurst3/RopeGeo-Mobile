import { FontAwesome5 } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

export function FilterButton({
  onPress,
  persisted = false,
}: {
  onPress: () => void;
  /** Solid blue when this filter slot is saved to storage. */
  persisted?: boolean;
}) {
  const iconColor = persisted ? "#3b82f6" : "#111827";
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
      <FontAwesome5 name="filter" size={18} color={iconColor} solid={persisted} />
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
});
