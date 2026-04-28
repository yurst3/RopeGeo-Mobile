import {
  RopeGeoCursorPaginationHttpRequest,
  Service,
} from "ropegeo-common/components";
import {
  RopewikiRegionImagesParams,
  RopewikiRegionImageView,
} from "ropegeo-common/models";
import { TOAST_HORIZONTAL_INSET } from "@/constants/toast";
import { useToast } from "@/context/ToastContext";
import { useNetworkStatus } from "@/context/NetworkStatusContext";
import { REQUEST_TIMEOUT_SECONDS } from "@/lib/network/requestTimeout";
import { usePathname } from "expo-router";
import React, {
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

const IMAGES_PAGE_LIMIT = 10;
const AUTO_ADVANCE_MS = 5000;
const AUTO_ADVANCE_PAUSE_AFTER_SWIPE_MS = 5000;

function regionBannerImagesErrorToastKey(regionId: string): string {
  return `region-banner-images-error-${regionId}`;
}

type RegionBannerSlide = {
  id: string;
  bannerUrl: string | null;
  fullUrl: string | null;
  pageName: string;
  captionHtml: string | null;
};

function toSlides(data: RopewikiRegionImageView[]): RegionBannerSlide[] {
  return data.map((item) => ({
    id: item.id,
    bannerUrl: item.bannerUrl ?? null,
    fullUrl: item.fullUrl ?? null,
    pageName: item.pageName,
    captionHtml: item.caption ?? null,
  }));
}

type RegionBannerCarouselProps = {
  regionId: string;
  regionName: string;
  /** Fixed width for paging (full screen); parent does not animate this. */
  layoutWidth: number;
  /**
   * Vertical extent of each FlatList page (typically full window height).
   * Parallax only animates the inner image frame; a tall slot avoids clipping when the frame grows.
   */
  layoutHeight: number;
  /** Reanimated style for the inner image frame (width/height/left) — same as former full-banner parallax. */
  imageFrameStyle: React.ComponentProps<typeof Animated.View>["style"];
  loading: boolean;
  loadingMore: boolean;
  slides: RegionBannerSlide[];
  loadMore: () => void;
  hasMore: boolean;
  errors: Error | null;
  verticalScrollActive: boolean;
  controlRef: React.RefObject<RegionBannerHandle | null>;
};

export type RegionBannerCurrentSlide = {
  id: string;
  fullUrl: string;
  bannerUrl: string | null;
  pageName: string;
  captionHtml: string | null;
};

export type RegionBannerHandle = {
  swipeBy: (delta: number) => void;
  getCurrentSlide: () => RegionBannerCurrentSlide | null;
  getAllSlides: () => RegionBannerCurrentSlide[];
  getCurrentIndex: () => number;
};

function RegionBannerCarousel({
  regionId,
  regionName,
  layoutWidth,
  layoutHeight,
  imageFrameStyle,
  loading,
  loadingMore,
  slides,
  loadMore,
  hasMore,
  errors,
  verticalScrollActive,
  controlRef,
}: RegionBannerCarouselProps) {
  const { upsertPill, dismiss } = useToast();
  const pathname = usePathname();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(() => new Set());
  const listRef = useRef<FlatList<RegionBannerSlide> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoAdvancePaused, setAutoAdvancePaused] = useState(false);
  const programmaticScrollRef = useRef(false);

  const bannerImagesErrorToastKey = regionBannerImagesErrorToastKey(regionId);
  const bannerLoadMoreError = errors != null && slides.length > 0 ? errors : null;

  useEffect(() => {
    if (bannerLoadMoreError != null) {
      const subtitle = bannerLoadMoreError.message?.trim();
      upsertPill({
        key: bannerImagesErrorToastKey,
        variant: "error",
        message: `Error loading ${regionName} banner images`,
        subtitle: subtitle === "" ? undefined : subtitle,
        durationMs: null,
        allowedRoutes: [pathname],
        horizontalInset: TOAST_HORIZONTAL_INSET,
      });
    } else {
      dismiss(bannerImagesErrorToastKey);
    }
    return () => {
      dismiss(bannerImagesErrorToastKey);
    };
  }, [
    bannerLoadMoreError,
    regionName,
    pathname,
    upsertPill,
    dismiss,
    bannerImagesErrorToastKey,
  ]);

  useEffect(() => {
    if (bannerLoadMoreError != null) {
      setAutoAdvancePaused(true);
      if (cooldownTimerRef.current != null) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    } else {
      setAutoAdvancePaused(false);
    }
  }, [bannerLoadMoreError]);

  const pageWidthRef = useRef(layoutWidth);
  useEffect(() => {
    pageWidthRef.current = layoutWidth;
  }, [layoutWidth]);

  const carouselIndexRef = useRef(0);
  useEffect(() => {
    carouselIndexRef.current = carouselIndex;
  }, [carouselIndex]);

  const intervalGateRef = useRef({
    slidesLength: 0,
    hasMore: false,
    loadingMore: false,
  });
  useEffect(() => {
    intervalGateRef.current = {
      slidesLength: slides.length,
      hasMore,
      loadingMore,
    };
  }, [slides.length, hasMore, loadingMore]);

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  const verticalScrollActiveRef = useRef(verticalScrollActive);
  useEffect(() => {
    verticalScrollActiveRef.current = verticalScrollActive;
  }, [verticalScrollActive]);

  const showPlaceholder = slides.length === 0;
  const currentUri =
    slides.length > 0 ? slides[carouselIndex]?.bannerUrl ?? null : null;
  const currentImageLoading =
    slides.length > 0 &&
    currentUri != null &&
    !loadedIndices.has(carouselIndex);

  const currentImageLoadingRef = useRef(false);
  useEffect(() => {
    currentImageLoadingRef.current = currentImageLoading;
  }, [currentImageLoading]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current != null) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  const firstSlideId = slides.length > 0 ? slides[0].id : undefined;
  const prevFirstSlideIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (slides.length === 0) {
      prevFirstSlideIdRef.current = undefined;
      setLoadedIndices(new Set());
      setCarouselIndex(0);
      return;
    }
    const fid = slides[0].id;
    if (prevFirstSlideIdRef.current !== fid) {
      prevFirstSlideIdRef.current = fid;
      setLoadedIndices(new Set());
      setCarouselIndex(0);
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
    }
  }, [firstSlideId, slides.length]);

  useEffect(() => {
    setCarouselIndex((i) =>
      slides.length === 0 ? 0 : Math.min(i, Math.max(0, slides.length - 1))
    );
  }, [slides.length]);

  useLayoutEffect(() => {
    if (slides.length === 0 || layoutWidth <= 0 || layoutHeight <= 0) return;
    const i = Math.min(carouselIndexRef.current, slides.length - 1);
    listRef.current?.scrollToOffset({
      offset: Math.max(0, i) * layoutWidth,
      animated: false,
    });
  }, [slides.length, layoutWidth, layoutHeight]);

  const scrollToPage = useCallback(
    (index: number, animated: boolean) => {
      const w = pageWidthRef.current;
      if (w <= 0 || slides.length === 0) return;
      const clamped = Math.max(0, Math.min(index, slides.length - 1));
      listRef.current?.scrollToOffset({
        offset: clamped * w,
        animated,
      });
    },
    [slides.length]
  );

  const pauseAutoAdvance = useCallback(() => {
    setAutoAdvancePaused(true);
    if (cooldownTimerRef.current != null) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => {
      cooldownTimerRef.current = null;
      setAutoAdvancePaused(false);
    }, AUTO_ADVANCE_PAUSE_AFTER_SWIPE_MS);
  }, []);

  useImperativeHandle(
    controlRef,
    () => ({
      swipeBy: (delta: number) => {
        if (slides.length <= 1) return;
        const next = Math.max(
          0,
          Math.min(slides.length - 1, carouselIndexRef.current + delta)
        );
        if (next !== carouselIndexRef.current) {
          pauseAutoAdvance();
          programmaticScrollRef.current = true;
          scrollToPage(next, true);
        }
      },
      getCurrentSlide: (): RegionBannerCurrentSlide | null => {
        const slide = slides[carouselIndexRef.current];
        if (slide == null || slide.fullUrl == null) return null;
        return {
          id: slide.id,
          fullUrl: slide.fullUrl,
          bannerUrl: slide.bannerUrl,
          pageName: slide.pageName,
          captionHtml: slide.captionHtml,
        };
      },
      getAllSlides: (): RegionBannerCurrentSlide[] =>
        slides.flatMap((s) =>
          s.fullUrl != null
            ? [{
                id: s.id,
                fullUrl: s.fullUrl,
                bannerUrl: s.bannerUrl,
                pageName: s.pageName,
                captionHtml: s.captionHtml,
              }]
            : [],
        ),
      getCurrentIndex: () => carouselIndexRef.current,
    }),
    [pauseAutoAdvance, scrollToPage, slides]
  );

  const syncIndexFromOffset = useCallback(
    (contentOffsetX: number) => {
      const w = pageWidthRef.current;
      if (w <= 0 || slides.length === 0) return;
      const idx = Math.round(contentOffsetX / w);
      const clamped = Math.max(0, Math.min(slides.length - 1, idx));
      setCarouselIndex(clamped);
    },
    [slides.length]
  );

  const onScrollSettled = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const wasProgrammatic = programmaticScrollRef.current;
      programmaticScrollRef.current = false;

      const prevIndex = carouselIndexRef.current;
      syncIndexFromOffset(e.nativeEvent.contentOffset.x);
      const { slidesLength, hasMore: hm, loadingMore: lm } =
        intervalGateRef.current;
      if (slidesLength === 0) return;
      const w = pageWidthRef.current;
      if (w <= 0) return;
      const idx = Math.round(e.nativeEvent.contentOffset.x / w);
      const clamped = Math.max(0, Math.min(slidesLength - 1, idx));
      if (clamped !== prevIndex && !wasProgrammatic) {
        pauseAutoAdvance();
      }
      if (clamped >= slidesLength - 1 && hm && !lm) {
        queueMicrotask(() => loadMoreRef.current());
      }
    },
    [pauseAutoAdvance, syncIndexFromOffset]
  );

  const goToNext = useCallback(() => {
    if (verticalScrollActiveRef.current) return;
    const { slidesLength, hasMore: hm, loadingMore: lm } =
      intervalGateRef.current;
    if (slidesLength === 0) return;
    if (currentImageLoadingRef.current) return;
    const i = carouselIndexRef.current;
    const w = pageWidthRef.current;
    if (w <= 0) return;

    programmaticScrollRef.current = true;
    if (i >= slidesLength - 1 && hm && lm) return;
    if (i >= slidesLength - 1 && hm && !lm) {
      queueMicrotask(() => loadMoreRef.current());
      return;
    }
    if (i >= slidesLength - 1 && !hm) {
      if (slidesLength <= 1) return;
      scrollToPage(0, true);
      return;
    }
    scrollToPage(i + 1, true);
  }, [scrollToPage]);

  useEffect(() => {
    if (slides.length === 0) return;
    if (loadingMore) return;
    if (currentImageLoading) return;
    if (verticalScrollActive) return;
    if (autoAdvancePaused) return;
    const id = setInterval(goToNext, AUTO_ADVANCE_MS);
    intervalRef.current = id;
    return () => {
      if (intervalRef.current != null) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [
    slides.length,
    hasMore,
    loadingMore,
    currentImageLoading,
    verticalScrollActive,
    autoAdvancePaused,
    goToNext,
  ]);

  useEffect(() => {
    const urls = slides
      .map((slide) => slide.bannerUrl)
      .filter((uri): uri is string => Boolean(uri));
    if (urls.length > 0) Image.prefetch(urls).catch(() => {});
  }, [slides]);

  const markImageLoaded = useCallback((index: number) => {
    setLoadedIndices((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: layoutWidth,
      offset: layoutWidth * index,
      index,
    }),
    [layoutWidth]
  );

  const keyExtractor = useCallback((item: RegionBannerSlide) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<RegionBannerSlide>) => {
      const uri = item.bannerUrl;
      const imageLoading = uri != null && !loadedIndices.has(index);
      return (
        <View
          pointerEvents="box-none"
          style={{
            width: layoutWidth,
            height: layoutHeight,
            overflow: "hidden",
          }}
        >
          {uri != null ? (
            <>
              <Animated.View
                pointerEvents="auto"
                style={[styles.parallaxImageFrame, imageFrameStyle]}
              >
                <Image
                  source={uri}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  onLoadEnd={() => markImageLoaded(index)}
                />
              </Animated.View>
              {imageLoading ? (
                <View
                  style={styles.imageLoadingOverlay}
                  pointerEvents="none"
                >
                  <ActivityIndicator size="large" color="#6b7280" />
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.bannerNoImageWrap} pointerEvents="auto">
              <Image
                source={require("@/assets/images/icons/missingImage.png")}
                style={styles.bannerNoImageIcon}
                contentFit="contain"
              />
              <Text style={styles.missingImageText}>Missing Image</Text>
            </View>
          )}
        </View>
      );
    },
    [
      imageFrameStyle,
      layoutHeight,
      layoutWidth,
      loadedIndices,
      markImageLoaded,
    ]
  );

  const onScrollToIndexFailed = useCallback(
    ({ index }: { index: number }) => {
      const w = pageWidthRef.current;
      if (w <= 0) return;
      listRef.current?.scrollToOffset({
        offset: index * w,
        animated: false,
      });
    },
    []
  );

  const canShowList = layoutWidth > 0 && layoutHeight > 0;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.bannerWrap,
        { width: layoutWidth, height: layoutHeight },
      ]}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {loading ? (
          <View style={styles.bannerNoImageWrap} pointerEvents="box-none">
            <ActivityIndicator size="large" color="#6b7280" />
          </View>
        ) : showPlaceholder ? (
          <View style={styles.bannerNoImageWrap} pointerEvents="box-none">
            <Image
              source={require("@/assets/images/icons/noImage.png")}
              style={styles.bannerNoImageIcon}
              contentFit="contain"
            />
          </View>
        ) : canShowList ? (
          <FlatList
            ref={listRef}
            data={slides}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            scrollEnabled={!verticalScrollActive && slides.length > 1}
            showsHorizontalScrollIndicator={false}
            bounces={slides.length > 1}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            pointerEvents="box-none"
            style={styles.list}
            getItemLayout={getItemLayout}
            initialNumToRender={Math.min(slides.length, 3)}
            maxToRenderPerBatch={3}
            windowSize={5}
            removeClippedSubviews={false}
            onMomentumScrollEnd={onScrollSettled}
            onScrollEndDrag={onScrollSettled}
            onScrollToIndexFailed={onScrollToIndexFailed}
          />
        ) : (
          <View style={styles.bannerNoImageWrap} pointerEvents="box-none">
            <ActivityIndicator size="large" color="#6b7280" />
          </View>
        )}
      </View>
    </View>
  );
}

export type RegionBannerProps = {
  regionId: string;
  regionName: string;
  layoutWidth: number;
  /** Full-window height recommended so the parallax image can grow without hitting a short cell. */
  layoutHeight: number;
  imageFrameStyle: React.ComponentProps<typeof Animated.View>["style"];
  verticalScrollActive?: boolean;
};

export const RegionBanner = forwardRef<RegionBannerHandle, RegionBannerProps>(function RegionBanner({
  regionId,
  regionName,
  layoutWidth,
  layoutHeight,
  imageFrameStyle,
  verticalScrollActive = false,
}, ref) {
  const { isOnline } = useNetworkStatus();
  const queryParams = useMemo(
    () => new RopewikiRegionImagesParams(IMAGES_PAGE_LIMIT),
    []
  );
  const pathParams = useMemo(() => ({ regionId }), [regionId]);
  const controlRef = useRef<RegionBannerHandle | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      swipeBy: (delta: number) => {
        controlRef.current?.swipeBy(delta);
      },
      getCurrentSlide: () => controlRef.current?.getCurrentSlide() ?? null,
      getAllSlides: () => controlRef.current?.getAllSlides() ?? [],
      getCurrentIndex: () => controlRef.current?.getCurrentIndex() ?? 0,
    }),
    []
  );

  return (
    <RopeGeoCursorPaginationHttpRequest<RopewikiRegionImageView>
      service={Service.WEBSCRAPER}
      path="/ropewiki/region/:regionId/images"
      pathParams={pathParams}
      queryParams={queryParams}
      timeoutAfterSeconds={REQUEST_TIMEOUT_SECONDS}
      isOnline={isOnline}
    >
      {({ loading, loadingMore, data, errors, loadMore, hasMore }) => (
        <RegionBannerCarousel
          regionId={regionId}
          regionName={regionName}
          layoutWidth={layoutWidth}
          layoutHeight={layoutHeight}
          imageFrameStyle={imageFrameStyle}
          loading={loading}
          loadingMore={loadingMore}
          slides={toSlides(data ?? [])}
          loadMore={loadMore}
          hasMore={hasMore}
          errors={errors}
          verticalScrollActive={verticalScrollActive}
          controlRef={controlRef}
        />
      )}
    </RopeGeoCursorPaginationHttpRequest>
  );
});

const styles = StyleSheet.create({
  bannerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
    /**
     * Below RegionContent ScrollView so the card/map stay on top for hits & paint.
     * Hero swipes still work: ScrollView uses pointerEvents="box-none" and passes touches
     * through the transparent paddingTop band to this FlatList; only the image frame uses
     * pointerEvents="auto" so the list doesn’t steal touches from the white card.
     */
    zIndex: 0,
  },
  parallaxImageFrame: {
    position: "absolute",
    top: 0,
    overflow: "hidden",
  },
  list: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
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
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(229, 231, 235, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});
