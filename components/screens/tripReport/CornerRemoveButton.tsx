import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { FontAwesome5 } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

export type CornerRemoveButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
  /** Diameter before the icon size scale is applied. */
  designSize: number;
  /** How far the button hangs past its parent's top-right corner. */
  offset: number;
};

/** Circular X pinned to the top-right corner of its (relatively positioned) parent. */
export function CornerRemoveButton({
  onPress,
  accessibilityLabel,
  designSize,
  offset,
}: CornerRemoveButtonProps) {
  const { background, text } = useColorTheme();
  const iconSizeScale = useResolvedIconSizeScale();
  const size = Math.round(designSize * iconSizeScale);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        {
          top: -offset,
          right: -offset,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          borderColor: text.primary,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <FontAwesome5 name="times" size={Math.round(size * 0.5)} color={text.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    zIndex: 1,
  },
});
