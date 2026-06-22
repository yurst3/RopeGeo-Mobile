import { PlaceholderBadge } from "@/components/badges/PlaceholderBadge";
import { useColorTheme } from "@/context/ColorThemeContext";
import { usePreviewLayoutMetrics, PAGE_PREVIEW_TRAILING_MARGIN } from "@/utils/previewLayout";
import { Image } from "expo-image";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/** Matches {@link PagePreview} / {@link RegionPreview} thumbnail. */
const IMAGE_SIZE = 96;
const MISSING_IMAGE = require("@/assets/images/icons/missingImage.png");

export type PlaceholderPreviewProps = {
  /** When `true`, show `missingImage` instead of a loading spinner in the image slot. */
  error?: boolean;
  /** When `true`, include an AKA placeholder line (4 text rows like pages with aka names). */
  showAkaLine?: boolean;
};

/**
 * Skeleton row matching {@link PagePreview} / {@link RegionPreview} layout (image + body + source
 * column), without ratings or badge rows — rectangles only plus one {@link PlaceholderBadge}.
 */
export function PlaceholderPreview({
  error = false,
  showAkaLine = false,
}: PlaceholderPreviewProps) {
  const layoutMetrics = usePreviewLayoutMetrics();
  const { image, placeholder, loadingIndicator } = useColorTheme();
  const rowGap = layoutMetrics.placeholderTextRowGap;

  return (
    <View style={styles.card}>
      <View style={[styles.imageWrap, { backgroundColor: image.background }]}>
        {error ? (
          <View style={[styles.imageCenter, { backgroundColor: image.background }]}>
            <Image
              source={MISSING_IMAGE}
              style={[
                styles.missingImage,
                {
                  width: layoutMetrics.noImageIconSize,
                  height: layoutMetrics.noImageIconSize,
                  tintColor: image.missingIcon,
                },
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
        <View
          style={[
            styles.titlePlaceholder,
            {
              backgroundColor: placeholder,
              height: layoutMetrics.titleCapHeight,
              marginBottom: rowGap,
            },
          ]}
        />
        <View style={[styles.middleRow, { marginBottom: rowGap }]}>
          <View style={[styles.metaColumn, { gap: rowGap }]}>
            {showAkaLine ? (
              <View
                style={[
                  styles.metaBar,
                  styles.akaBar,
                  {
                    backgroundColor: placeholder,
                    height: layoutMetrics.metaBarHeight,
                  },
                ]}
              />
            ) : null}
            <View
              style={[
                styles.metaBar,
                {
                  backgroundColor: placeholder,
                  height: layoutMetrics.metaBarHeight,
                },
              ]}
            />
          </View>
          <View style={styles.trailingControl}>
            <PlaceholderBadge size={layoutMetrics.sourceIconCircleSize} />
          </View>
        </View>
        <View
          style={[
            styles.starPlaceholder,
            {
              backgroundColor: placeholder,
              height: layoutMetrics.starRatingSize,
            },
          ]}
        />
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
  missingImage: {},
  body: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    justifyContent: "center",
  },
  titlePlaceholder: {
    width: "100%",
    alignSelf: "flex-start",
    borderRadius: 4,
  },
  metaColumn: {
    flex: 1,
    minWidth: 0,
  },
  middleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaBar: {
    width: "85%",
    borderRadius: 4,
  },
  akaBar: {
    width: "65%",
  },
  starPlaceholder: {
    width: "55%",
    alignSelf: "flex-start",
    borderRadius: 4,
  },
  trailingControl: {
    marginLeft: PAGE_PREVIEW_TRAILING_MARGIN,
    alignItems: "center",
  },
});
