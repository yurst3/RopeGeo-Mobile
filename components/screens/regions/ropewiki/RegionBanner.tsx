import { RopeGeoCursorPaginationHttpRequest } from "@/components/RopeGeoCursorPaginationHttpRequest";
import { Service } from "@/components/RopeGeoHttpRequest";
import {
  RopewikiRegionImagesParams,
  RopewikiRegionImageView,
} from "ropegeo-common";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Image,
  StyleSheet,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

const IMAGES_PAGE_LIMIT = 10;
const AUTO_ADVANCE_MS = 3000;
const SWIPE_DURATION_MS = 300;
const SWIPE_MIN_DISTANCE = 40;
const SWIPE_VELOCITY_THRESHOLD = 200;

function toImageUrls(data: RopewikiRegionImageView[]): string[] {
  return data.map((item) => item.url).filter(Boolean);
}

type RegionBannerCarouselProps = {
  style: React.ComponentProps<typeof Animated.View>["style"];
  loading: boolean;
  loadingMore: boolean;
  images: string[];
  loadMore: () => void;
  hasMore: boolean;
};

function RegionBannerCarousel({
  style,
  loading,
  loadingMore,
  images,
  loadMore,
  hasMore,
}: RegionBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(() => new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevIndexRef = useRef(0);
  const directionRef = useRef<"next" | "prev">("next");
  const slideOutX = useRef(new RNAnimated.Value(0)).current;
  const slideInX = useRef(new RNAnimated.Value(0)).current;

  const showPlaceholder = images.length === 0;
  const currentSlideIndex = currentIndex;
  const currentUri = images.length > 0 ? images[currentSlideIndex] : null;
  const currentImageLoading =
    images.length > 0 &&
    currentUri != null &&
    !loadedIndices.has(currentSlideIndex);

  const goToNext = useCallback(() => {
    if (images.length === 0 || isAnimating) return;
    if (currentImageLoading) return;
    if (
      currentSlideIndex >= images.length - 1 &&
      hasMore &&
      loadingMore
    )
      return;
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= images.length) {
        if (hasMore && loadingMore) return prev;
        if (hasMore && !loadingMore) {
          queueMicrotask(() => loadMore());
        }
        return hasMore ? prev : 0;
      }
      return next;
    });
    directionRef.current = "next";
  }, [images.length, isAnimating, currentImageLoading, currentSlideIndex, hasMore, loadingMore, loadMore]);

  const goToPrev = useCallback(() => {
    if (images.length <= 1 || isAnimating) return;
    setCurrentIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
    directionRef.current = "prev";
  }, [images.length, isAnimating]);

  useEffect(() => {
    if (images.length === 0) return;
    if (loadingMore) return;
    if (currentImageLoading) return;
    const id = setInterval(goToNext, AUTO_ADVANCE_MS);
    intervalRef.current = id;
    return () => {
      if (intervalRef.current != null) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [images.length, hasMore, loadingMore, currentImageLoading, goToNext]);

  useEffect(() => {
    if (images.length < 2 || containerWidth <= 0) {
      prevIndexRef.current = currentIndex;
      return;
    }
    if (prevIndexRef.current === currentIndex) return;
    const isNext = directionRef.current === "next";
    setIsAnimating(true);
    slideOutX.setValue(0);
    slideInX.setValue(isNext ? containerWidth : -containerWidth);
    RNAnimated.parallel([
      RNAnimated.timing(slideOutX, {
        toValue: isNext ? -containerWidth : containerWidth,
        duration: SWIPE_DURATION_MS,
        useNativeDriver: true,
      }),
      RNAnimated.timing(slideInX, {
        toValue: 0,
        duration: SWIPE_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        prevIndexRef.current = currentIndex;
        setIsAnimating(false);
      }
    });
  }, [currentIndex, images.length, containerWidth, slideOutX, slideInX]);

  useEffect(() => {
    images.forEach((uri) => {
      if (uri) Image.prefetch(uri).catch(() => {});
    });
  }, [images]);

  const markImageLoaded = useCallback((index: number) => {
    setLoadedIndices((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const onLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setContainerWidth(w);
  }, []);

  const currentImageUri =
    images.length > 0 ? images[currentSlideIndex] : null;
  const outgoingImageUri =
    isAnimating && images.length > 0 ? images[prevIndexRef.current] : null;
  const incomingImageUri = currentImageUri;
  const showTwoSlides = isAnimating && outgoingImageUri != null && incomingImageUri != null;

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-20, 20])
        .failOffsetY([-15, 15])
        .onEnd((e) => {
          if (loading || showPlaceholder || images.length === 0) return;
          const { translationX, velocityX } = e;
          const threshold =
            Math.abs(velocityX) >= SWIPE_VELOCITY_THRESHOLD
              ? velocityX
              : translationX;
          if (threshold < -SWIPE_MIN_DISTANCE) {
            goToNext();
          } else if (threshold > SWIPE_MIN_DISTANCE) {
            goToPrev();
          }
        }),
    [loading, showPlaceholder, images.length, goToNext, goToPrev]
  );

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View pointerEvents="box-none" style={[styles.bannerWrap, style]}>
        <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
        {loading ? (
          <View style={styles.bannerNoImageWrap}>
            <ActivityIndicator size="large" color="#6b7280" />
          </View>
        ) : showPlaceholder ? (
          <View style={styles.bannerNoImageWrap}>
            <Image
              source={require("@/assets/images/noImage.png")}
              style={styles.bannerNoImageIcon}
              resizeMode="contain"
            />
          </View>
        ) : showTwoSlides ? (
          <>
            <RNAnimated.View
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ translateX: slideOutX }] },
              ]}
            >
              <Image
                source={{ uri: outgoingImageUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            </RNAnimated.View>
            <RNAnimated.View
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ translateX: slideInX }] },
              ]}
            >
              <Image
                source={{ uri: incomingImageUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                onLoadEnd={() => markImageLoaded(currentSlideIndex)}
              />
              {currentImageLoading ? (
                <View
                  style={styles.imageLoadingOverlay}
                  pointerEvents="none"
                >
                  <ActivityIndicator size="large" color="#6b7280" />
                </View>
              ) : null}
            </RNAnimated.View>
          </>
        ) : currentImageUri != null ? (
          <View style={styles.currentImageWrap}>
            <Image
              key={currentImageUri}
              source={{ uri: currentImageUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onLoadEnd={() => markImageLoaded(currentSlideIndex)}
            />
            {currentImageLoading ? (
              <View
                style={styles.imageLoadingOverlay}
                pointerEvents="none"
              >
                <ActivityIndicator size="large" color="#6b7280" />
              </View>
            ) : null}
          </View>
        ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export type RegionBannerProps = {
  regionId: string;
  style: React.ComponentProps<typeof Animated.View>["style"];
};

export function RegionBanner({ regionId, style }: RegionBannerProps) {
  const queryParams = useMemo(
    () => new RopewikiRegionImagesParams(IMAGES_PAGE_LIMIT),
    []
  );
  const pathParams = useMemo(() => ({ regionId }), [regionId]);

  return (
    <RopeGeoCursorPaginationHttpRequest<RopewikiRegionImageView>
      service={Service.WEBSCRAPER}
      path="/ropewiki/region/:regionId/images"
      pathParams={pathParams}
      queryParams={queryParams}
    >
      {({ loading, loadingMore, data, loadMore, hasMore }) => (
        <RegionBannerCarousel
          style={style}
          loading={loading}
          loadingMore={loadingMore}
          images={toImageUrls(data)}
          loadMore={loadMore}
          hasMore={hasMore}
        />
      )}
    </RopeGeoCursorPaginationHttpRequest>
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
  currentImageWrap: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});
