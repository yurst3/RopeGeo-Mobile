import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Image } from "expo-image";
import {
  Dimensions,
  FlatList,
  type ListRenderItemInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import RenderHtml from "react-native-render-html";
import type {
  OfflineBetaSectionImage,
  OnlineBetaSectionImage,
} from "ropegeo-common/models";
import { ExpandedImageModal } from "@/components/expandedImage/ExpandedImageModal";
import type {
  ExpandedImageAnchorRect,
  ExpandedImageGalleryPage,
} from "@/components/expandedImage/types";
import { ROPEWIKI_ORIGIN } from "@/constants/ropewikiOrigin";
import { useColorTheme } from "@/context/ColorThemeContext";
import { replaceEmbeddedImgTagsWithLinks } from "@/utils/replaceEmbeddedImgTagsWithLinks";
import {
  buildRopewikiHtmlTagsStyles,
  ROPEWIKI_CUSTOM_HTML_ELEMENT_MODELS,
  ROPEWIKI_HTML_IGNORED_STYLES,
} from "@/utils/ropewikiRenderHtml";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING_HORIZONTAL = 20;
const CONTENT_WIDTH = SCREEN_WIDTH - CARD_PADDING_HORIZONTAL * 2;
const IMAGE_HEIGHT = 220;
/** Distance from the bottom edge of the image to the indicator pill. */
const IMAGE_INDICATOR_BOTTOM_INSET = 8;
const CAPTION_FONT_SIZE = 13;
const CAPTION_LINE_HEIGHT = 18;
const CAPTION_MAX_LINES = 3;
const CAPTION_MARGIN_TOP = 8;
const CAPTION_AREA_HEIGHT = CAPTION_LINE_HEIGHT * CAPTION_MAX_LINES;
/** Fixed slide height so paging does not shift content below the gallery. */
const SLIDE_HEIGHT = IMAGE_HEIGHT + CAPTION_MARGIN_TOP + CAPTION_AREA_HEIGHT;

const MISSING_IMAGE = require("@/assets/images/icons/missingImage.png");

type BetaSectionImageSlideProps = {
  item: OnlineBetaSectionImage | OfflineBetaSectionImage;
  onOpenExpand: (item: OnlineBetaSectionImage | OfflineBetaSectionImage) => void;
  onLayoutRef: (key: string, el: View | null) => void;
};

/**
 * Memoized row: avoids re-running RenderHtml / layout when parent re-renders or sibling rows update.
 */
const BetaSectionImageSlide = React.memo(function BetaSectionImageSlide({
  item,
  onOpenExpand,
  onLayoutRef,
}: BetaSectionImageSlideProps) {
  const themeColors = useColorTheme();
  const captionTagsStyles = useMemo(
    () => buildRopewikiHtmlTagsStyles(themeColors.text),
    [themeColors.text],
  );
  const itemKey = item.linkUrl + item.order;
  const fullUrl = item.fetchType === "online" ? item.fullUrl : item.downloadedFullPath;
  const bannerUrl =
    item.fetchType === "online" ? item.bannerUrl : item.downloadedBannerPath;
  const canExpand = fullUrl != null;

  const captionSource = useMemo(
    () =>
      item.caption
        ? {
            html: replaceEmbeddedImgTagsWithLinks(item.caption),
            baseUrl: ROPEWIKI_ORIGIN,
          }
        : null,
    [item.caption]
  );

  const setLayoutRef = useCallback(
    (el: View | null) => {
      onLayoutRef(itemKey, el);
    },
    [itemKey, onLayoutRef]
  );

  const onPress = useCallback(() => {
    onOpenExpand(item);
  }, [item, onOpenExpand]);

  return (
    <View style={[styles.imageSlide, { height: SLIDE_HEIGHT }]}>
      <Pressable
        disabled={!canExpand}
        onPress={onPress}
        style={({ pressed }) => [
          styles.imageContainer,
          { backgroundColor: themeColors.image.background },
          canExpand && pressed && styles.imageContainerPressed,
        ]}
      >
        <View
          ref={setLayoutRef}
          style={styles.imageContainerInner}
          collapsable={false}
        >
          {bannerUrl != null ? (
            <Image
              source={bannerUrl}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.missingImageWrap,
                { backgroundColor: themeColors.image.background },
              ]}
            >
              <Image
                source={MISSING_IMAGE}
                style={[
                  styles.missingImageIcon,
                  { tintColor: themeColors.image.missingIcon },
                ]}
                contentFit="contain"
              />
              <Text
                style={[
                  styles.missingImageText,
                  { color: themeColors.image.missingText },
                ]}
              >
                Missing Image
              </Text>
            </View>
          )}
        </View>
      </Pressable>
      <View style={styles.captionWrap}>
        {captionSource != null ? (
          <RenderHtml
            contentWidth={CONTENT_WIDTH}
            source={captionSource}
            baseStyle={{
              ...styles.caption,
              color: themeColors.text.secondary,
            }}
            tagsStyles={captionTagsStyles}
            customHTMLElementModels={ROPEWIKI_CUSTOM_HTML_ELEMENT_MODELS}
            ignoredStyles={ROPEWIKI_HTML_IGNORED_STYLES}
            enableUserAgentStyles={false}
            defaultTextProps={{
              numberOfLines: CAPTION_MAX_LINES,
              ellipsizeMode: "clip",
            }}
          />
        ) : null}
      </View>
    </View>
  );
});

export type BetaSectionImagesProps = {
  images: (OnlineBetaSectionImage | OfflineBetaSectionImage)[];
  /** Ropewiki page (or region) name — bold top line in expanded image header. */
  pageTitle: string;
  /** Same label as `BetaSection`’s heading (smaller line below page name). */
  sectionTitle: string;
};

const keyExtractor = (item: OnlineBetaSectionImage | OfflineBetaSectionImage) =>
  item.linkUrl + item.order;

const getItemLayout = (_: unknown, index: number) => ({
  length: SCREEN_WIDTH,
  offset: SCREEN_WIDTH * index,
  index,
});

export function BetaSectionImages({
  images,
  pageTitle,
  sectionTitle,
}: BetaSectionImagesProps) {
  const themeColors = useColorTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const sortedImages = useMemo(
    () => [...images].sort((a, b) => a.order - b.order),
    [images]
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [anchorRect, setAnchorRect] = useState<ExpandedImageAnchorRect | null>(
    null,
  );
  const [expandedItem, setExpandedItem] = useState<
    OnlineBetaSectionImage | OfflineBetaSectionImage | null
  >(null);

  const itemRefs = useRef<Map<string, View>>(new Map());
  const flatListRef = useRef<
    FlatList<OnlineBetaSectionImage | OfflineBetaSectionImage> | null
  >(null);
  /** Inner rAF id for anchor remeasure (see effect cleanup). */
  const anchorMeasureRaf2Ref = useRef<number | undefined>(undefined);

  /** Keep collapse animation aligned with the thumbnail for the image currently shown (including after next/prev swipe). */
  useEffect(() => {
    const expandedFullUrl =
      expandedItem == null
        ? null
        : expandedItem.fetchType === "online"
          ? expandedItem.fullUrl
          : expandedItem.downloadedFullPath;
    if (!modalVisible || expandedItem == null || expandedFullUrl == null) {
      return;
    }

    const key = expandedItem.linkUrl + expandedItem.order;
    const idx = sortedImages.findIndex(
      (img) =>
        img.linkUrl === expandedItem.linkUrl && img.order === expandedItem.order
    );
    if (idx < 0) return;

    flatListRef.current?.scrollToOffset({
      offset: idx * SCREEN_WIDTH,
      animated: false,
    });

    let cancelled = false;
    const id1 = requestAnimationFrame(() => {
      anchorMeasureRaf2Ref.current = requestAnimationFrame(() => {
        anchorMeasureRaf2Ref.current = undefined;
        if (cancelled) return;
        const node = itemRefs.current.get(key);
        if (node == null) return;
        node.measureInWindow((x, y, width, height) => {
          if (cancelled) return;
          if (width > 0 && height > 0) {
            setAnchorRect({ x, y, width, height });
          }
        });
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(id1);
      if (anchorMeasureRaf2Ref.current !== undefined) {
        cancelAnimationFrame(anchorMeasureRaf2Ref.current);
        anchorMeasureRaf2Ref.current = undefined;
      }
    };
  }, [expandedItem, modalVisible, sortedImages]);

  const galleryPages = useMemo((): ExpandedImageGalleryPage[] => {
    const out: ExpandedImageGalleryPage[] = [];
    for (const img of sortedImages) {
      const fullUrl =
        img.fetchType === "online" ? img.fullUrl : img.downloadedFullPath;
      const bannerUrl =
        img.fetchType === "online" ? img.bannerUrl : img.downloadedBannerPath;
      if (fullUrl == null) continue;
      out.push({
        itemKey: img.linkUrl + img.order,
        fullUrl,
        bannerUrl,
        linkUrl: img.linkUrl,
        captionHtml: img.caption ?? null,
      });
    }
    return out;
  }, [sortedImages]);

  const expandedGalleryIndex = useMemo(() => {
    if (expandedItem == null) return 0;
    const i = galleryPages.findIndex(
      (p) => p.itemKey === expandedItem.linkUrl + expandedItem.order
    );
    return i >= 0 ? i : 0;
  }, [expandedItem, galleryPages]);

  const handleGalleryPageChange = useCallback(
    (_pageIndex: number, itemKey: string) => {
      const next = sortedImages.find(
        (img) => img.linkUrl + img.order === itemKey
      );
      if (next != null) {
        setExpandedItem(next);
      }
    },
    [sortedImages]
  );

  const handleExpandedDismissed = useCallback(() => {
    setModalVisible(false);
    setExpandedItem(null);
    setAnchorRect(null);
  }, []);

  const handleLayoutRef = useCallback((key: string, el: View | null) => {
    if (el) {
      itemRefs.current.set(key, el);
    } else {
      itemRefs.current.delete(key);
    }
  }, []);

  const handleOpenExpand = useCallback(
    (item: OnlineBetaSectionImage | OfflineBetaSectionImage) => {
      const fullUrl =
        item.fetchType === "online" ? item.fullUrl : item.downloadedFullPath;
      if (fullUrl == null) return;
    const key = item.linkUrl + item.order;
    const node = itemRefs.current.get(key);
    if (node == null) return;
    node.measureInWindow((x, y, width, height) => {
      setExpandedItem(item);
      setAnchorRect({ x, y, width, height });
      setModalVisible(true);
    });
    },
    [],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;
  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderItem = useCallback(
    ({
      item,
    }: ListRenderItemInfo<OnlineBetaSectionImage | OfflineBetaSectionImage>) => (
      <BetaSectionImageSlide
        item={item}
        onOpenExpand={handleOpenExpand}
        onLayoutRef={handleLayoutRef}
      />
    ),
    [handleLayoutRef, handleOpenExpand]
  );

  return (
    <View style={styles.imagesWrap}>
      <FlatList
        ref={flatListRef}
        style={styles.flatList}
        data={sortedImages}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        initialNumToRender={Math.min(3, sortedImages.length || 1)}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      {sortedImages.length > 1 ? (
        <View style={styles.imageIndicator} pointerEvents="none">
          <Text
            style={[
              styles.imageIndicatorText,
              {
                color: themeColors.image.text,
                backgroundColor: themeColors.image.textBackground,
              },
            ]}
          >
            {currentIndex + 1}/{sortedImages.length}
          </Text>
        </View>
      ) : null}

      {modalVisible &&
      anchorRect != null &&
      expandedItem != null &&
      (expandedItem.fetchType === "online"
        ? expandedItem.fullUrl != null
        : expandedItem.downloadedFullPath != null) ? (
        <ExpandedImageModal
          anchorRect={anchorRect}
          pages={galleryPages}
          initialPageIndex={expandedGalleryIndex}
          onPageChange={handleGalleryPageChange}
          headerPageTitle={pageTitle}
          headerSectionSubtitle={sectionTitle}
          onDismissed={handleExpandedDismissed}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  imagesWrap: {
    position: "relative",
    height: SLIDE_HEIGHT,
    marginLeft: -CARD_PADDING_HORIZONTAL,
    marginRight: -CARD_PADDING_HORIZONTAL,
  },
  flatList: {
    height: SLIDE_HEIGHT,
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: CARD_PADDING_HORIZONTAL,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  imageContainerPressed: {
    opacity: 0.92,
  },
  imageContainerInner: {
    width: CONTENT_WIDTH,
    height: IMAGE_HEIGHT,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  missingImageWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  missingImageIcon: {
    width: 52,
    height: 52,
  },
  missingImageText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
  },
  captionWrap: {
    marginTop: CAPTION_MARGIN_TOP,
    height: CAPTION_AREA_HEIGHT,
    overflow: "hidden",
  },
  caption: {
    fontSize: CAPTION_FONT_SIZE,
    lineHeight: CAPTION_LINE_HEIGHT,
  },
  imageIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    top: IMAGE_HEIGHT - IMAGE_INDICATOR_BOTTOM_INSET,
    transform: [{ translateY: "-100%" }],
    alignItems: "center",
    zIndex: 2,
  },
  imageIndicatorText: {
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
});
