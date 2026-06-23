import { ConstantText } from "@/components/text/ConstantText";
import { useTextStyle } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import { useColorTheme } from "@/context/ColorThemeContext";
import { Image } from "expo-image";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
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
  onBannerImageLoad: (width: number, height: number) => void;
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
  onBannerImageLoad,
  onBannerImageLoadEnd,
}: PageBannerProps) {
  const { image, loadingIndicator } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

  return (
    <Animated.View pointerEvents="none" style={[styles.bannerWrap, imageFrameStyle]}>
      {bannerUrl ? (
        <>
          <View ref={bannerFullRectRef} style={StyleSheet.absoluteFill} collapsable={false}>
            <Image
              source={bannerUrl}
              style={styles.bannerImage}
              contentFit="contain"
              onLoad={(event) => {
                onBannerImageLoad(event.source.width, event.source.height);
              }}
              onLoadEnd={onBannerImageLoadEnd}
            />
          </View>
          {bannerImageLoading ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.bannerLoadingOverlay,
                { backgroundColor: image.background },
              ]}
            >
              <ActivityIndicator size="large" color={loadingIndicator} />
            </View>
          ) : null}
        </>
      ) : (
        <View style={[styles.bannerNoImageWrap, { backgroundColor: image.background }]}>
          <Image
            source={
              hasBannerImageObject
                ? require("@/assets/images/icons/missingImage.png")
                : require("@/assets/images/icons/noImage.png")
            }
            style={[
              styles.bannerNoImageIcon,
              { tintColor: image.missingIcon },
            ]}
            contentFit="contain"
          />
          {hasBannerImageObject ? (
            <ConstantText
              size={uiScale.pageScreen.text.metaData}
              typography={textStyle.map.markerTooltip}
              style={[styles.missingImageText, { color: image.missingText }]}
            >
              Missing Image
            </ConstantText>
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
  },
  bannerNoImageIcon: {
    width: 64,
    height: 64,
  },
  missingImageText: {
    marginTop: 8,
  },
  bannerLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
