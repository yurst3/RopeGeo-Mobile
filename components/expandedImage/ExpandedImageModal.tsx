import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Image, type ImageProps } from "expo-image";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ListRenderItemInfo,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  FlatList as GHFlatList,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExpandedImageBannerCrossfade } from "./ExpandedImageBannerCrossfade";
import { ExpandedImageCaption, containImageBottomY } from "./ExpandedImageCaption";
import { ExpandedImageGallerySlide } from "./ExpandedImageGallerySlide";
import {
  ExpandedImageHeader,
  type ExpandedImageSectionImagePosition,
} from "./ExpandedImageHeader";
import type { ExpandedImageAnchorRect, ExpandedImageGalleryPage } from "./types";
import { useExpandedImageExpandAnimation } from "./useExpandedImageExpandAnimation";

const CHROME_FADE_MS = 220;

/** Visible only while swiping: each cell is `screen + gap` wide; image uses full screen width. */
const GALLERY_INTER_SLIDE_GAP = 12;

const ReanimatedGalleryFlatList =
  Animated.createAnimatedComponent(GHFlatList<ExpandedImageGalleryPage>);

function prefetchImageSource(source: NonNullable<ImageProps["source"]>): void {
  if (typeof source === "string") {
    void Image.prefetch(source);
    return;
  }
  if (
    source &&
    typeof source === "object" &&
    "uri" in source &&
    typeof (source as { uri: unknown }).uri === "string"
  ) {
    void Image.prefetch((source as { uri: string }).uri);
  }
}

export type ExpandedImageModalProps = {
  anchorRect: ExpandedImageAnchorRect;
  /** One or more fullscreen pages; horizontal paging when length > 1. */
  pages: ExpandedImageGalleryPage[];
  /** Starting page (clamped to `pages` length). */
  initialPageIndex: number;
  /** Sync parent state when the user changes page (e.g. beta thumbnails / collapse anchor). */
  onPageChange?: (pageIndex: number, itemKey: string) => void;
  /** Page name (bold, top line in header). */
  headerPageTitle: string;
  /** Beta section name; optional second line with `(current/total)` when set. */
  headerSectionSubtitle?: string | null;
  /** Called after collapse animation + teardown (~220ms). */
  onDismissed: () => void;
};

/**
 * Full-screen expanded image viewer (blur backdrop, zoom/pan, optional HTML caption).
 * Mount when opening; parent clears anchor state in `onDismissed`.
 */
export function ExpandedImageModal({
  anchorRect,
  pages,
  initialPageIndex,
  onPageChange,
  headerPageTitle,
  headerSectionSubtitle,
  onDismissed,
}: ExpandedImageModalProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const pageWidth = windowWidth;
  const slideStride = pageWidth + GALLERY_INTER_SLIDE_GAP;

  const safeInitial = Math.max(
    0,
    Math.min(initialPageIndex, Math.max(0, pages.length - 1))
  );

  const scrollX = useSharedValue(safeInitial * slideStride);

  const galleryScrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const [layoutExpanded, setLayoutExpanded] = useState(false);
  const [expandedFullIntrinsic, setExpandedFullIntrinsic] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [expandedStageLayout, setExpandedStageLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [overlayShowsFullImage, setOverlayShowsFullImage] = useState(true);
  const [showUi, setShowUi] = useState(true);
  const [activeIndex, setActiveIndex] = useState(safeInitial);
  const [pagerScrollEnabled, setPagerScrollEnabled] = useState(true);

  const chromeOpacity = useSharedValue(1);
  const galleryRef = useRef<GHFlatList<ExpandedImageGalleryPage> | null>(null);
  /** Ignore momentum events until initial `scrollToOffset` (if any) has been applied. */
  const galleryPositioningReadyRef = useRef(false);

  const stageHeight =
    expandedStageLayout?.height ?? Math.max(0, windowHeight - 0);

  const headerSectionImagePosition: ExpandedImageSectionImagePosition | null =
    headerSectionSubtitle != null && pages.length > 0
      ? { current: activeIndex + 1, total: pages.length }
      : null;

  useEffect(() => {
    chromeOpacity.value = withTiming(showUi ? 1 : 0, {
      duration: CHROME_FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [showUi, chromeOpacity]);

  const chromeHeaderFadeStyle = useAnimatedStyle(() => ({
    opacity: chromeOpacity.value,
  }));
  const chromeCaptionFadeStyle = useAnimatedStyle(() => ({
    opacity: chromeOpacity.value,
  }));

  const toggleShowUi = useCallback(() => {
    setShowUi((v) => !v);
  }, []);

  const hideChrome = useCallback(() => {
    setShowUi(false);
  }, []);

  const collapseModal = useCallback(() => {
    setOverlayShowsFullImage(false);
    requestAnimationFrame(() => {
      setLayoutExpanded(false);
    });
  }, []);

  const onCollapseTransition = useCallback(() => {
    setTimeout(() => {
      setExpandedFullIntrinsic(null);
      setExpandedStageLayout(null);
      setOverlayShowsFullImage(true);
      setShowUi(true);
      setLayoutExpanded(false);
      onDismissed();
    }, 220);
  }, [onDismissed]);

  const { cardStyle } = useExpandedImageExpandAnimation({
    anchorRect,
    expanded: layoutExpanded,
    onCollapseTransition,
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setLayoutExpanded(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!layoutExpanded) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      collapseModal();
      return true;
    });
    return () => sub.remove();
  }, [layoutExpanded, collapseModal]);

  /** Preload neighbors (and current) full-resolution images. */
  useEffect(() => {
    if (pages.length === 0) return;
    const indices = new Set<number>();
    for (const d of [-1, 0, 1]) {
      const i = activeIndex + d;
      if (i >= 0 && i < pages.length) {
        indices.add(i);
      }
    }
    indices.forEach((i) => {
      prefetchImageSource(pages[i].fullUrl);
      const b = pages[i].bannerUrl;
      if (b != null) {
        prefetchImageSource(b as NonNullable<ImageProps["source"]>);
      }
    });
  }, [activeIndex, pages]);

  const handleZoomedChange = useCallback((zoomed: boolean) => {
    setPagerScrollEnabled(!zoomed);
  }, []);

  const handleActiveImageGeometry = useCallback(
    (dims: { width: number; height: number }) => {
      setExpandedFullIntrinsic(dims);
    },
    []
  );

  const onGalleryScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!galleryPositioningReadyRef.current) {
        return;
      }
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.min(
        pages.length - 1,
        Math.max(0, Math.round(x / slideStride))
      );
      if (next === activeIndex) {
        return;
      }
      scrollX.value = x;
      setActiveIndex(next);
      setExpandedFullIntrinsic(null);
      setShowUi(true);
      setPagerScrollEnabled(true);
      const page = pages[next];
      if (page != null) {
        onPageChange?.(next, page.itemKey);
      }
    },
    [activeIndex, onPageChange, pages, scrollX, slideStride]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: slideStride,
      offset: slideStride * index,
      index,
    }),
    [slideStride]
  );

  const keyExtractor = useCallback(
    (item: ExpandedImageGalleryPage) => item.itemKey,
    []
  );

  const renderGalleryItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ExpandedImageGalleryPage>) => (
      <View
        style={{
          width: slideStride,
          height: stageHeight,
          flexDirection: "row",
        }}
      >
        <ExpandedImageGallerySlide
          page={item}
          containerWidth={pageWidth}
          containerHeight={stageHeight}
          overlayShowsFullImage={overlayShowsFullImage}
          disableEdgeNavigation={pages.length > 1}
          isActive={index === activeIndex}
          onToggleUi={toggleShowUi}
          onZoomPanHideUi={hideChrome}
          onZoomedChange={pages.length > 1 ? handleZoomedChange : undefined}
          onActiveImageGeometry={handleActiveImageGeometry}
        />
        <View
          style={{
            width: GALLERY_INTER_SLIDE_GAP,
            height: stageHeight,
            backgroundColor: "transparent",
          }}
        />
      </View>
    ),
    [
      activeIndex,
      handleActiveImageGeometry,
      handleZoomedChange,
      hideChrome,
      overlayShowsFullImage,
      pageWidth,
      pages.length,
      slideStride,
      stageHeight,
      toggleShowUi,
    ]
  );

  const activeCaptionHtml =
    pages[activeIndex]?.captionHtml ?? null;

  const expandedImageBottomY = useMemo(() => {
    if (expandedStageLayout == null || expandedFullIntrinsic == null) {
      return null;
    }
    return containImageBottomY(
      expandedStageLayout.width,
      expandedStageLayout.height,
      expandedFullIntrinsic.width,
      expandedFullIntrinsic.height,
    );
  }, [expandedFullIntrinsic, expandedStageLayout]);

  const captionBottomInset = Math.max(insets.bottom, 12);
  const expandedCaptionBandHeight =
    expandedStageLayout != null && expandedImageBottomY != null
      ? expandedStageLayout.height - expandedImageBottomY - captionBottomInset
      : 0;
  const expandedCaptionFits =
    expandedImageBottomY != null && expandedCaptionBandHeight > 20;

  useEffect(() => {
    if (!layoutExpanded || pages.length === 0) return;
    galleryPositioningReadyRef.current = false;
    let cancelled = false;
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => {
        if (cancelled) return;
        const offset = safeInitial * slideStride;
        scrollX.value = offset;
        if (safeInitial > 0) {
          galleryRef.current?.scrollToOffset({
            offset,
            animated: false,
          });
        }
        galleryPositioningReadyRef.current = true;
      });
      return id2;
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id1);
    };
  }, [layoutExpanded, pages.length, safeInitial, scrollX, slideStride]);

  if (pages.length === 0) {
    return null;
  }

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={styles.modalRoot}>
        <View style={styles.modalInner} pointerEvents="box-none">
          <Animated.View style={[styles.expandedCard, cardStyle]}>
            <View
              style={styles.expandedImageStage}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setExpandedStageLayout({ width, height });
              }}
            >
              <ExpandedImageBannerCrossfade
                scrollX={scrollX}
                slideStride={slideStride}
                pages={pages}
                overlayShowsFullImage={overlayShowsFullImage}
              />
              <View style={styles.galleryLayer} pointerEvents="box-none">
                {overlayShowsFullImage &&
                pages.some((p) => p.bannerUrl != null) ? (
                  <View
                    style={styles.expandedBlurDarken}
                    pointerEvents="none"
                  />
                ) : null}
                {stageHeight > 0 ? (
                  <ReanimatedGalleryFlatList
                    style={styles.galleryFlatList}
                    ref={galleryRef}
                    data={pages}
                    keyExtractor={keyExtractor}
                    renderItem={renderGalleryItem}
                    horizontal
                    pagingEnabled={false}
                    snapToInterval={slideStride}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    scrollEnabled={pagerScrollEnabled && pages.length > 1}
                    showsHorizontalScrollIndicator={false}
                    bounces={pages.length > 1}
                    keyboardShouldPersistTaps="handled"
                    getItemLayout={getItemLayout}
                    initialNumToRender={Math.min(
                      pages.length,
                      Math.max(safeInitial + 2, 3)
                    )}
                    maxToRenderPerBatch={3}
                    windowSize={5}
                    onScroll={galleryScrollHandler}
                    scrollEventThrottle={1}
                    onMomentumScrollEnd={onGalleryScrollEnd}
                    onScrollToIndexFailed={({ index }) => {
                      const off = index * slideStride;
                      scrollX.value = off;
                      galleryRef.current?.scrollToOffset({
                        offset: off,
                        animated: false,
                      });
                    }}
                  />
                ) : (
                  <View style={styles.loadingOverlay} pointerEvents="none">
                    <ActivityIndicator size="large" color="#fff" />
                  </View>
                )}
              </View>
              {overlayShowsFullImage &&
              activeCaptionHtml != null &&
              expandedCaptionFits &&
              expandedStageLayout != null &&
              expandedImageBottomY != null ? (
                <Animated.View
                  style={[styles.chromeCaptionLayer, chromeCaptionFadeStyle]}
                  pointerEvents={showUi ? "box-none" : "none"}
                >
                  <ExpandedImageCaption
                    caption={activeCaptionHtml}
                    stageWidth={expandedStageLayout.width}
                    imageBottomY={expandedImageBottomY}
                    bottomInset={captionBottomInset}
                  />
                </Animated.View>
              ) : null}
            </View>
          </Animated.View>
          <Animated.View
            style={[styles.chromeHeaderLayer, chromeHeaderFadeStyle]}
            pointerEvents={showUi ? "box-none" : "none"}
          >
            <ExpandedImageHeader
              pageTitle={headerPageTitle}
              sectionSubtitle={headerSectionSubtitle}
              sectionImagePosition={headerSectionImagePosition ?? undefined}
              onBack={collapseModal}
              top={insets.top + 8}
            />
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: "transparent",
  },
  modalInner: {
    flex: 1,
    backgroundColor: "transparent",
  },
  expandedCard: {
    backgroundColor: "#000",
    zIndex: 1,
  },
  expandedImageStage: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  galleryLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  expandedBlurDarken: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
    zIndex: 0,
  },
  galleryFlatList: {
    flex: 1,
    zIndex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  chromeHeaderLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },
  chromeCaptionLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },
});
