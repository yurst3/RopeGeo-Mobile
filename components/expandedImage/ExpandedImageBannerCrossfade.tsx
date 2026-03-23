import React from "react";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import type { ExpandedImageGalleryPage } from "./types";

const BANNER_BLUR_RADIUS = 28;

type ExpandedImageBannerCrossfadeProps = {
  /** Horizontal content offset of the gallery `FlatList` (pixels). */
  scrollX: SharedValue<number>;
  /** Scroll distance between consecutive pages (viewport width + inter-slide gap). */
  slideStride: number;
  pages: ExpandedImageGalleryPage[];
  overlayShowsFullImage: boolean;
};

function BannerFill({
  bannerUrl,
  blurRadius,
}: {
  bannerUrl: string | null;
  blurRadius: number;
}) {
  if (bannerUrl == null) {
    return <View style={[StyleSheet.absoluteFill, styles.fallbackBg]} />;
  }
  return (
    <Image
      source={bannerUrl}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      blurRadius={blurRadius}
    />
  );
}

/**
 * One banner layer: full opacity at rest on its page, fades to 0 toward neighbors.
 */
function ScrollLinkedBannerLayer({
  index,
  scrollX,
  slideStride,
  page,
  blurRadius,
}: {
  index: number;
  scrollX: SharedValue<number>;
  slideStride: number;
  page: ExpandedImageGalleryPage;
  blurRadius: number;
}) {
  const style = useAnimatedStyle(() => {
    const w = slideStride;
    const x = scrollX.value;
    return {
      opacity: interpolate(
        x,
        [(index - 1) * w, index * w, (index + 1) * w],
        [0, 1, 0],
        Extrapolation.CLAMP
      ),
    };
  }, [index, slideStride]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
    >
      <BannerFill bannerUrl={page.bannerUrl} blurRadius={blurRadius} />
    </Animated.View>
  );
}

/**
 * Full-bleed blurred banners behind the gallery; opacity follows horizontal scroll
 * (triangle blend between adjacent slides).
 */
export function ExpandedImageBannerCrossfade({
  scrollX,
  slideStride,
  pages,
  overlayShowsFullImage,
}: ExpandedImageBannerCrossfadeProps) {
  const blurRadius = overlayShowsFullImage ? BANNER_BLUR_RADIUS : 0;

  if (pages.length === 0) {
    return null;
  }

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
      pointerEvents="none"
    >
      {pages.map((page, index) => (
        <ScrollLinkedBannerLayer
          key={page.itemKey}
          index={index}
          scrollX={scrollX}
          slideStride={slideStride}
          page={page}
          blurRadius={blurRadius}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackBg: {
    backgroundColor: "#111",
  },
});
