import { FontAwesome5 } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

export function FilterButton({ onPress }: { onPress: () => void }) {
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
      <FontAwesome5 name="filter" size={18} color="#111827" />
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
