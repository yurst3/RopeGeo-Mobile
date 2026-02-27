import type { ImageSourcePropType } from "react-native";
import { Image, Pressable, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";

const SIZE = 48;

export type ExternalLinkButtonProps = {
  icon: ImageSourcePropType;
  link: string;
  accessibilityLabel?: string;
};

export function ExternalLinkButton({
  icon,
  link,
  accessibilityLabel = "Open in browser",
}: ExternalLinkButtonProps) {
  const handlePress = async () => {
    try {
      await WebBrowser.openBrowserAsync(link);
    } catch {
      // Ignore if user cancels or link fails
    }
  };

  return (
    <Pressable
      style={styles.button}
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel}
    >
      <Image source={icon} style={styles.icon} resizeMode="contain" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    width: 28,
    height: 28,
  },
});
