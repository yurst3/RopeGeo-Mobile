import { Image } from "expo-image";
import { SAVED_PAGE_GLYPH_KEY } from "@/constants/buttons";
import { StyleSheet, View } from "react-native";

import { useColorTheme } from "@/context/theme/ColorThemeContext";


const GLYPH_SIZE = 22;

type Props = {
  isSaved: boolean;
};

/**
 * Shared bookmark art for the page header and route preview strip.
 * Solid (saved) state uses the standard button highlight tint.
 */
export function SavedPageGlyph({ isSaved }: Props) {
  const { iconHighlight } = useColorTheme().button.standard[SAVED_PAGE_GLYPH_KEY];
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Image
        source={
          isSaved
            ? require("@/assets/images/icons/buttons/saved-solid.png")
            : require("@/assets/images/icons/buttons/saved.png")
        }
        style={[
          styles.image,
          isSaved && { tintColor: iconHighlight },
        ]}
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
