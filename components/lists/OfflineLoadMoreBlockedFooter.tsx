import { useColorTheme } from "@/context/ColorThemeContext";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

const MISSING_IMAGE = require("@/assets/images/icons/missingImage.png");

/** Shown at the end of a list when offline but more pages exist on the server. */
export function OfflineLoadMoreBlockedFooter() {
  const { text: themeText } = useColorTheme();

  return (
    <View style={styles.wrap}>
      <Image
        source={MISSING_IMAGE}
        style={styles.icon}
        contentFit="contain"
        accessibilityLabel="Missing image"
      />
      <Text style={[styles.text, { color: themeText.error }]}>
        Unable to load more data
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 40,
    height: 40,
  },
  text: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
});
