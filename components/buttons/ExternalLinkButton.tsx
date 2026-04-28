import { Image } from "expo-image";
import type { ImageSourcePropType } from "react-native";
import { Pressable, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";

const SIZE = 48;

export type ExternalLinkButtonProps = {
  icon: ImageSourcePropType;
  link: string;
  accessibilityLabel?: string;
  /** When true, the control is visible but does not open the browser. */
  disabled?: boolean;
};

export function ExternalLinkButton({
  icon,
  link,
  accessibilityLabel = "Open in browser",
  disabled = false,
}: ExternalLinkButtonProps) {
  const handlePress = async () => {
    if (disabled) return;
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
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      <Image source={icon} style={styles.icon} contentFit="contain" />
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
