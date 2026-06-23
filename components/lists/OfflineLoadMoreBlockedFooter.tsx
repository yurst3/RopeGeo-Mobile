import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useTextStyle } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

const MISSING_IMAGE = require("@/assets/images/icons/missingImage.png");

/** Shown at the end of a list when offline but more pages exist on the server. */
export function OfflineLoadMoreBlockedFooter() {
  const { text: themeText } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

  return (
    <View style={styles.wrap}>
      <Image
        source={MISSING_IMAGE}
        style={styles.icon}
        contentFit="contain"
        accessibilityLabel="Missing image"
      />
      <ConstantText
        size={uiScale.toast.text.message}
        typography={textStyle.toast.message}
        style={[styles.text, { color: themeText.error }]}
      >
        Unable to load more data
      </ConstantText>
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
    textAlign: "center",
  },
});
