import { PlaceholderBadge } from "@/components/badges/PlaceholderBadge";
import { useColorTheme } from "@/context/ColorThemeContext";
import { Image } from "expo-image";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

/** Matches {@link PagePreview} / {@link RegionPreview} thumbnail. */
const IMAGE_SIZE = 96;
const SOURCE_ICON_COLUMN_W = 56;
const SOURCE_ICON_COLUMN_H = 32;
const MISSING_IMAGE = require("@/assets/images/icons/missingImage.png");
const MISSING_IMAGE_SIZE = 36;

export type PlaceholderPreviewProps = {
  /** When `true`, show `missingImage` instead of a loading spinner in the image slot. */
  error?: boolean;
};

/**
 * Skeleton row matching {@link PagePreview} / {@link RegionPreview} layout (image + body + source
 * column), without ratings or badge rows — rectangles only plus one {@link PlaceholderBadge}.
 */
export function PlaceholderPreview({ error = false }: PlaceholderPreviewProps) {
  const { image, placeholder, text, loadingIndicator } = useColorTheme();

  return (
    <View style={styles.card}>
      <View style={[styles.imageWrap, { backgroundColor: image.background }]}>
        {error ? (
          <View style={[styles.imageCenter, { backgroundColor: image.background }]}>
            <Image
              source={MISSING_IMAGE}
              style={[
                styles.missingImage,
                { tintColor: image.missingIcon },
              ]}
              contentFit="contain"
              accessibilityLabel="Missing preview"
            />
          </View>
        ) : (
          <View
            style={[
              styles.imageLoadingOverlay,
              { backgroundColor: image.background },
            ]}
          >
            <ActivityIndicator size="small" color={loadingIndicator} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={[styles.titlePlaceholder, { backgroundColor: placeholder }]} />
        <View style={styles.regionPlaceholderRow}>
          <View style={[styles.regionBar, { width: "40%", backgroundColor: placeholder }]} />
          <Text style={[styles.regionDot, { color: text.tertiary }]}> • </Text>
          <View style={[styles.regionBar, { width: "40%", backgroundColor: placeholder }]} />
        </View>
        <View style={styles.regionPlaceholderRow}>
          <View style={[styles.regionBar, { width: "30%", backgroundColor: placeholder }]} />
        </View>
        <View style={[styles.infoPlaceholder, { backgroundColor: placeholder }]} />
      </View>
      <View style={styles.sourceColumn}>
        <PlaceholderBadge size={28} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 3,
    marginBottom: 6,
  },
  imageWrap: {
    position: "relative",
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
    overflow: "hidden",
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  imageCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  missingImage: {
    width: MISSING_IMAGE_SIZE,
    height: MISSING_IMAGE_SIZE,
  },
  body: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    justifyContent: "center",
  },
  titlePlaceholder: {
    height: 16,
    width: "66%",
    alignSelf: "flex-start",
    borderRadius: 4,
    marginBottom: 8,
  },
  regionPlaceholderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  regionBar: {
    height: 10,
    borderRadius: 4,
  },
  regionDot: {
    fontSize: 10,
  },
  infoPlaceholder: {
    height: 10,
    width: "55%",
    alignSelf: "flex-start",
    borderRadius: 4,
    marginTop: 2,
  },
  sourceColumn: {
    width: SOURCE_ICON_COLUMN_W,
    height: SOURCE_ICON_COLUMN_H,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
