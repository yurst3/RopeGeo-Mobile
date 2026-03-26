import { useTheme } from "@react-navigation/native";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

const GLYPH_SIZE = 22;

type Props = {
  isSaved: boolean;
};

/**
 * Shared bookmark art for the page header and route preview strip.
 * Solid (saved) state uses the navigation primary tint, matching the active tab bar color.
 */
export function SavedPageGlyph({ isSaved }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Image
        source={
          isSaved
            ? require("@/assets/images/saved-solid.png")
            : require("@/assets/images/saved.png")
        }
        style={[styles.image, isSaved && { tintColor: colors.primary }]}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: GLYPH_SIZE,
    height: GLYPH_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: GLYPH_SIZE,
    height: GLYPH_SIZE,
  },
});
