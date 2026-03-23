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
import type { BetaSectionImage } from "ropegeo-common";
import { ExpandedImageModal } from "@/components/expandedImage/ExpandedImageModal";
import type {
  ExpandedImageAnchorRect,
  ExpandedImageGalleryPage,
} from "@/components/expandedImage/types";
import { ROPEWIKI_ORIGIN } from "@/constants/ropewikiOrigin";
import { replaceEmbeddedImgTagsWithLinks } from "@/utils/replaceEmbeddedImgTagsWithLinks";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING_HORIZONTAL = 20;
const CONTENT_WIDTH = SCREEN_WIDTH - CARD_PADDING_HORIZONTAL * 2;
const IMAGE_HEIGHT = 220;
const IMAGE_INDICATOR_HEIGHT = 28;

const MISSING_IMAGE = require("@/assets/images/missingImage.png");

const HTML_TAGS_STYLES = {
  a: {
    color: "#3b82f6",
    textDecorationLine: "underline" as const,
  },
  b: { fontWeight: "700" as const },
  strong: { fontWeight: "700" as const },
  i: { fontStyle: "italic" as const },
  em: { fontStyle: "italic" as const },
  caption: {
    textAlign: "center" as const,
    fontSize: 14,
    color: "#6b7280",
  },
};

type BetaSectionImageSlideProps = {
  item: BetaSectionImage;
  onOpenExpand: (item: BetaSectionImage) => void;
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
  const itemKey = item.linkUrl + item.order;
  const canExpand = item.fullUrl != null;

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
    <View style={styles.imageSlide}>
      <Pressable
        disabled={!canExpand}
        onPress={onPress}
        style={({ pressed }) => [
          styles.imageContainer,
          canExpand && pressed && styles.imageContainerPressed,
        ]}
      >
        <View
          ref={setLayoutRef}
          style={styles.imageContainerInner}
          collapsable={false}
        >
          {item.bannerUrl != null ? (
            <Image
              source={item.bannerUrl}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={styles.missingImageWrap}>
              <Image
                source={MISSING_IMAGE}
                style={styles.missingImageIcon}
                contentFit="contain"
              />
              <Text style={styles.missingImageText}>Missing Image</Text>
            </View>
          )}
        </View>
      </Pressable>
      {captionSource != null ? (
        <View style={styles.captionWrap}>
          <RenderHtml
            contentWidth={CONTENT_WIDTH}
            source={captionSource}
            baseStyle={styles.caption}
            tagsStyles={HTML_TAGS_STYLES}
          />
        </View>
      ) : null}
    </View>
  );
});

export type BetaSectionImagesProps = {
  images: BetaSectionImage[];
  /** Ropewiki page (or region) name — bold top line in expanded image header. */
  pageTitle: string;
  /** Same label as `BetaSection`’s heading (smaller line below page name). */
  sectionTitle: string;
};

const keyExtractor = (item: BetaSectionImage) => item.linkUrl + item.order;

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const sortedImages = useMemo(
    () => [...images].sort((a, b) => a.order - b.order),
    [images]
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [anchorRect, setAnchorRect] = useState<ExpandedImageAnchorRect | null>(
    null,
  );
  const [expandedItem, setExpandedItem] = useState<BetaSectionImage | null>(null);

  const itemRefs = useRef<Map<string, View>>(new Map());
  const flatListRef = useRef<FlatList<BetaSectionImage> | null>(null);
  /** Inner rAF id for anchor remeasure (see effect cleanup). */
  const anchorMeasureRaf2Ref = useRef<number | undefined>(undefined);

  /** Keep collapse animation aligned with the thumbnail for the image currently shown (including after next/prev swipe). */
  useEffect(() => {
    if (!modalVisible || expandedItem == null || expandedItem.fullUrl == null) {
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
      if (img.fullUrl == null) continue;
      out.push({
        itemKey: img.linkUrl + img.order,
        fullUrl: img.fullUrl,
        bannerUrl: img.bannerUrl,
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

  const handleOpenExpand = useCallback((item: BetaSectionImage) => {
    if (item.fullUrl == null) return;
    const key = item.linkUrl + item.order;
    const node = itemRefs.current.get(key);
    if (node == null) return;
    node.measureInWindow((x, y, width, height) => {
      setExpandedItem(item);
      setAnchorRect({ x, y, width, height });
      setModalVisible(true);
    });
  }, []);

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
    ({ item }: ListRenderItemInfo<BetaSectionImage>) => (
      <BetaSectionImageSlide
        item={item}
        onOpenExpand={handleOpenExpand}
        onLayoutRef={handleLayoutRef}
      />
    ),
    [handleOpenExpand, handleLayoutRef]
  );

  return (
    <View style={styles.imagesWrap}>
      <FlatList
        ref={flatListRef}
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
      {sortedImages.length > 1 && (
        <View style={styles.imageIndicator}>
          <Text style={styles.imageIndicatorText}>
            {currentIndex + 1}/{sortedImages.length}
          </Text>
        </View>
      )}

      {modalVisible &&
      anchorRect != null &&
      expandedItem != null &&
      expandedItem.fullUrl != null ? (
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
    marginLeft: -CARD_PADDING_HORIZONTAL,
    marginRight: -CARD_PADDING_HORIZONTAL,
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: CARD_PADDING_HORIZONTAL,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
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
    backgroundColor: "#e5e7eb",
  },
  missingImageIcon: {
    width: 52,
    height: 52,
  },
  missingImageText: {
    marginTop: 8,
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },
  captionWrap: {
    marginTop: 8,
  },
  caption: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  imageIndicator: {
    position: "absolute",
    bottom: 44,
    left: 0,
    right: 0,
    height: IMAGE_INDICATOR_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  imageIndicatorText: {
    fontSize: 13,
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
});
