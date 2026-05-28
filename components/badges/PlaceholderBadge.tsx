import { StyleSheet, View } from "react-native";

import { useColorTheme } from "@/context/ColorThemeContext";

import { Badge } from "./Badge";

const DEFAULT_SIZE = 32;

export type PlaceholderBadgeProps = {
  size?: number;
  /** When true, shows a placeholder label bar centered below the circle. */
  label?: boolean;
};

/** Grey circle, no icons, no outline — for loading / placeholder rows. */
export function PlaceholderBadge({
  size = DEFAULT_SIZE,
  label = false,
}: PlaceholderBadgeProps) {
  const themeColors = useColorTheme();
  const circle = (
    <Badge
      backgroundColor={themeColors.placeholder}
      outline={false}
      size={size}
    />
  );

  if (!label) {
    return circle;
  }

  return (
    <View style={styles.withLabel}>
      {circle}
      <View
        style={[
          styles.labelPlaceholder,
          {
            backgroundColor: themeColors.placeholder,
            width: size + 16,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  withLabel: {
    alignItems: "center",
  },
  labelPlaceholder: {
    marginTop: 4,
    height: 11,
    borderRadius: 4,
  },
});
