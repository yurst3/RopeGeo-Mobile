import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { FontAwesome } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

type Props = {
  size?: number;
  focused: boolean;
};

/** Slightly inset FontAwesome glyphs so they fit like {@link SavedTabBarIcon} `contentFit="contain"`. */
const GLYPH_INSET_RATIO = 0.88;

/**
 * Explore tab icon — wrapped and inset like {@link SavedTabBarIcon} so scaled map glyphs
 * stay inside React Navigation’s tab icon slot.
 */
export function ExploreTabBarIcon({ size, focused }: Props) {
  const { tabBar } = useColorTheme();
  const iconColor = focused ? tabBar.iconFocused : tabBar.iconUnfocused;
  const dim = size ?? 26;
  const glyphSize = Math.round(dim * GLYPH_INSET_RATIO);

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconSlot, { width: dim, height: dim }]}>
        <FontAwesome
          name={focused ? "map" : "map-o"}
          size={glyphSize}
          color={iconColor}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
    padding: 4,
  },
  iconSlot: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
});
