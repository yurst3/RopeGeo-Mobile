import { BetaSection } from "@/components/betaSection/BetaSection";
import { minimapStyles } from "@/components/minimap/minimapShared";
import { RegionLinks } from "@/components/RegionLinks";
import {
  RopeGeoCursorPaginationHttpRequest,
  Service,
} from "ropegeo-common/components";
import { PagePreview } from "@/components/previews/PagePreview";
import { RegionPreview } from "@/components/previews/RegionPreview";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  type SharedValue,
  runOnJS,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import type { RopewikiRegionView } from "ropegeo-common/models";
import { PageDataSource, Preview, RopewikiRegionPreviewsParams } from "ropegeo-common/models";

const PREVIEWS_PAGE_LIMIT = 10;
const LOAD_MORE_THRESHOLD = 100;
const CARD_BORDER_RADIUS = 24;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const INITIAL_LOADING_MIN_HEIGHT = SCREEN_HEIGHT * 0.5;

function formatCounts(pageCount: number, regionCount: number): string {
  if (regionCount === 0) {
    return `(${pageCount} ${pageCount === 1 ? "page" : "pages"})`;
  }
  const pages = `${pageCount} ${pageCount === 1 ? "page" : "pages"}`;
  const regions = `${regionCount} ${regionCount === 1 ? "region" : "regions"}`;
  return `(${pages} and ${regions})`;
}

export type RegionContentProps = {
  regionId: string;
  region: RopewikiRegionView;
  insets: { top: number; bottom: number };
  scrollY: SharedValue<number>;
  paddingTop: number;
  onCardHeightLayout: (height: number) => void;
  onOpenFullMap: () => void;
  mapExpanded: boolean;
  onMiniMapAnchorRect: (rect: { x: number; y: number; width: number; height: number }) => void;
  onMountMiniMapNative: () => void;
  /** True while the user is dragging or flinging the page vertically (parallax scroll). */
  onVerticalScrollActiveChange?: (active: boolean) => void;
};

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export function RegionContent({
  regionId,
  region,
  insets,
  scrollY,
  paddingTop,
  onCardHeightLayout,
  onOpenFullMap,
  mapExpanded,
  onMiniMapAnchorRect,
  onMountMiniMapNative,
  onVerticalScrollActiveChange,
}: RegionContentProps) {
  const loadMoreRef = useRef<() => void>(() => {});
  const miniMapGateRef = useRef<View>(null);
  const miniMapUnlockedRef = useRef(false);
  const scrollIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const countsText = formatCounts(region.pageCount, region.regionCount);
  const regions = region.regions ?? [];
  const hasMiniMap = region.miniMap != null;

  useEffect(() => {
    miniMapUnlockedRef.current = false;
  }, [regionId]);

  const checkMiniMapInView = useCallback(() => {
    if (!hasMiniMap) return;
    const node = miniMapGateRef.current;
    if (node == null) return;
    node.measureInWindow((x, y, width, h) => {
      onMiniMapAnchorRect({ x, y, width, height: h });
      const winH = Dimensions.get("window").height;
      const visTop = insets.top + 8;
      const visBottom = winH - insets.bottom - 72;
      const intersects = y + h > visTop && y < visBottom;
      if (intersects && !miniMapUnlockedRef.current) {
        miniMapUnlockedRef.current = true;
        onMountMiniMapNative();
      }
    });
  }, [hasMiniMap, insets.bottom, insets.top, onMiniMapAnchorRect, onMountMiniMapNative]);

  const queryParams = useMemo(
    () => new RopewikiRegionPreviewsParams(PREVIEWS_PAGE_LIMIT),
    []
  );

  const pathParams = useMemo(() => ({ regionId }), [regionId]);

  const checkLoadMore = useCallback(
    (contentOffsetY: number, contentHeight: number, layoutHeight: number) => {
      const canScroll = contentHeight > layoutHeight;
      const isNearBottom =
        contentOffsetY + layoutHeight >= contentHeight - LOAD_MORE_THRESHOLD;
      if (canScroll && isNearBottom) {
        loadMoreRef.current();
      }
    },
    []
  );

  useEffect(() => {
    if (!hasMiniMap) return;
    const t = setTimeout(() => checkMiniMapInView(), 0);
    return () => clearTimeout(t);
  }, [hasMiniMap, checkMiniMapInView]);

  useEffect(() => {
    return () => {
      if (scrollIdleTimeoutRef.current != null) {
        clearTimeout(scrollIdleTimeoutRef.current);
      }
    };
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      runOnJS(checkLoadMore)(
        event.contentOffset.y,
        event.contentSize.height,
        event.layoutMeasurement.height
      );
    },
  });

  const clearScrollIdleTimeout = useCallback(() => {
    if (scrollIdleTimeoutRef.current != null) {
      clearTimeout(scrollIdleTimeoutRef.current);
      scrollIdleTimeoutRef.current = null;
    }
  }, []);

  const handleScrollBeginDrag = useCallback(() => {
    clearScrollIdleTimeout();
    onVerticalScrollActiveChange?.(true);
  }, [clearScrollIdleTimeout, onVerticalScrollActiveChange]);

  const handleMomentumScrollBegin = useCallback(() => {
    clearScrollIdleTimeout();
  }, [clearScrollIdleTimeout]);

  const handleScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      checkMiniMapInView();
      const vy = e.nativeEvent.velocity?.y;
      if (vy != null && Math.abs(vy) >= 8) {
        return;
      }
      if (vy != null) {
        onVerticalScrollActiveChange?.(false);
        return;
      }
      clearScrollIdleTimeout();
      scrollIdleTimeoutRef.current = setTimeout(() => {
        scrollIdleTimeoutRef.current = null;
        onVerticalScrollActiveChange?.(false);
      }, 100);
    },
    [
      checkMiniMapInView,
      clearScrollIdleTimeout,
      onVerticalScrollActiveChange,
    ]
  );

  const handleMomentumScrollEnd = useCallback(() => {
    clearScrollIdleTimeout();
    onVerticalScrollActiveChange?.(false);
    checkMiniMapInView();
  }, [checkMiniMapInView, clearScrollIdleTimeout, onVerticalScrollActiveChange]);

  return (
    <RopeGeoCursorPaginationHttpRequest<Preview>
      service={Service.WEBSCRAPER}
      path="/ropewiki/region/:regionId/previews"
      pathParams={pathParams}
      queryParams={queryParams}
    >
      {({ loading, loadingMore, data, loadMore }) => {
        loadMoreRef.current = loadMore;
        const items = data;
        return (
          <AnimatedScrollView
            style={styles.scrollView}
            contentContainerStyle={{
              paddingTop,
              paddingBottom: 0,
              flexGrow: 1,
            }}
            pointerEvents={mapExpanded ? "none" : "auto"}
            nestedScrollEnabled
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            scrollEnabled={!mapExpanded}
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            onMomentumScrollBegin={handleMomentumScrollBegin}
            onMomentumScrollEnd={handleMomentumScrollEnd}
          >
            <View
              style={[
                styles.cardWrapper,
                { marginTop: -CARD_BORDER_RADIUS },
                loading && items.length === 0 && {
                  minHeight: INITIAL_LOADING_MIN_HEIGHT,
                },
              ]}
              onLayout={(e) => onCardHeightLayout(e.nativeEvent.layout.height)}
            >
              <View style={styles.cardWrap}>
                <View
                  style={[
                    styles.cardInner,
                    {
                      paddingTop: 20,
                      paddingBottom: 16,
                    },
                  ]}
                >
                  <Text style={styles.title}>{region.name}</Text>
                  <RegionLinks
                    source={PageDataSource.Ropewiki}
                    regions={regions}
                  />
                  <Text style={styles.counts}>{countsText}</Text>
                  {region.overview != null ? (
                    <BetaSection section={region.overview} pageTitle={region.name} />
                  ) : null}
                  {hasMiniMap ? (
                    <View
                      ref={miniMapGateRef}
                      collapsable={false}
                      style={styles.miniMapWrap}
                      onLayout={(e) => {
                        const { width, height } = e.nativeEvent.layout;
                        onMiniMapAnchorRect({ x: 0, y: 0, width, height });
                        requestAnimationFrame(() => checkMiniMapInView());
                      }}
                    >
                      <View style={minimapStyles.wrapper} />
                    </View>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.previewsSection,
                    { paddingBottom: insets.bottom + 16 },
                  ]}
                >
                  {loading && items.length === 0 ? (
                    <View
                      style={[
                        styles.previewsLoading,
                        { minHeight: INITIAL_LOADING_MIN_HEIGHT - 120 },
                      ]}
                    >
                      <ActivityIndicator size="small" />
                    </View>
                  ) : (
                    <>
                      {items.map((item, index) =>
                        item.isPagePreview() ? (
                          <PagePreview
                            key={`page-${item.id}-${index}`}
                            preview={item}
                          />
                        ) : item.isRegionPreview() ? (
                          <RegionPreview
                            key={`region-${item.id}-${index}`}
                            preview={item}
                          />
                        ) : null
                      )}
                      {loadingMore ? (
                        <View style={styles.loadMoreIndicator}>
                          <ActivityIndicator size="small" />
                        </View>
                      ) : null}
                    </>
                  )}
                </View>
              </View>
            </View>
          </AnimatedScrollView>
        );
      }}
    </RopeGeoCursorPaginationHttpRequest>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    /** Always above the absolute banner layer. */
    position: "relative",
    zIndex: 1000,
    ...Platform.select({
      android: { elevation: 3 },
      default: {},
    }),
  },
  cardWrapper: {
    position: "relative",
  },
  cardWrap: {
    backgroundColor: "#fff",
    borderTopLeftRadius: CARD_BORDER_RADIUS,
    borderTopRightRadius: CARD_BORDER_RADIUS,
    overflow: "hidden",
  },
  cardInner: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },
  counts: {
    fontSize: 16,
    color: "#6b7280",
  },
  miniMapWrap: {
    marginTop: 16,
  },
  previewsSection: {
    paddingHorizontal: 20,
  },
  previewsLoading: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadMoreIndicator: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
