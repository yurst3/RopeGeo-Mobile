import { Image } from "expo-image";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { minimapStyles } from "./shared/minimapShared";

export type PlaceholderMiniMapProps = {
  /** When set, shows missing-image + this message in red instead of the loading spinner. */
  errorMessage?: string;
};

/**
 * Same footprint as {@link minimapStyles.wrapper} (square `aspectRatio: 1`, shared minimap border radius)
 * used by {@link PageMiniMapView} and region scroll content — grey fill with spinner or error UI.
 */
export function PlaceholderMiniMap({ errorMessage }: PlaceholderMiniMapProps) {
  const isError = errorMessage != null && errorMessage !== "";

  return (
    <View style={[minimapStyles.wrapper, styles.center]}>
      {isError ? (
        <>
          <Image
            source={require("@/assets/images/icons/missingImage.png")}
            style={styles.missingImage}
            contentFit="contain"
          />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </>
      ) : (
        <ActivityIndicator size="small" color="#666" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  missingImage: {
    width: 48,
    height: 48,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#dc2626",
    textAlign: "center",
    paddingHorizontal: 12,
  },
});
