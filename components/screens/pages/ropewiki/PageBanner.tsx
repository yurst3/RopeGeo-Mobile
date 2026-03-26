import { Image } from "expo-image";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";

export type PageBannerProps = {
  /** Parallax frame: width, height, left — matches scroll `paddingTop` / aspect ratio. */
  imageFrameStyle: AnimatedStyle<ViewStyle>;
  bannerUrl: string | null;
  hasBannerImageObject: boolean;
  bannerImageLoading: boolean;
  /** For `measureInWindow` when expanding the banner image. */
  bannerFullRectRef: React.RefObject<View | null>;
  onBannerImageLoadEnd: () => void;
};

/**
 * Static hero image behind the page scroll (z-index 0), same role as `RegionBanner` visuals.
 */
export function PageBanner({
  imageFrameStyle,
  bannerUrl,
  hasBannerImageObject,
  bannerImageLoading,
  bannerFullRectRef,
  onBannerImageLoadEnd,
}: PageBannerProps) {
  return (
    <Animated.View pointerEvents="none" style={[styles.bannerWrap, imageFrameStyle]}>
      {bannerUrl ? (
        <>
          <View
            ref={bannerFullRectRef}
            style={StyleSheet.absoluteFill}
            collapsable={false}
          >
            <Image
              source={bannerUrl}
              style={styles.bannerImage}
              contentFit="contain"
              onLoadEnd={onBannerImageLoadEnd}
            />
          </View>
          {bannerImageLoading ? (
            <View style={[StyleSheet.absoluteFill, styles.bannerLoadingOverlay]}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.bannerNoImageWrap}>
          <Image
            source={
              hasBannerImageObject
                ? require("@/assets/images/icons/missingImage.png")
                : require("@/assets/images/icons/noImage.png")
            }
            style={styles.bannerNoImageIcon}
            contentFit="contain"
          />
          {hasBannerImageObject ? (
            <Text style={styles.missingImageText}>Missing Image</Text>
          ) : null}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
    zIndex: 0,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerNoImageWrap: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e5e7eb",
  },
  bannerNoImageIcon: {
    width: 64,
    height: 64,
  },
  missingImageText: {
    marginTop: 8,
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },
  bannerLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
});
