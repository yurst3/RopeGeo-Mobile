import { FontAwesome5 } from "@expo/vector-icons";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet } from "react-native";

const BUTTON_SIZE = 44;

/**
 * When `top` is provided the button positions itself absolutely (screen-level usage).
 * Without `top` it renders inline (e.g. inside a header row).
 */
export function BackButton({
  onPress,
  top,
  style,
}: {
  onPress: () => void;
  top?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      style={[
        styles.button,
        top != null && styles.fixed,
        top != null && { top },
        style,
      ]}
      onPress={onPress}
      accessibilityLabel="Go back"
    >
      <FontAwesome5 name="arrow-left" size={20} color="#000" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  fixed: {
    position: "absolute",
    left: 16,
    zIndex: 3600,
  },
});
