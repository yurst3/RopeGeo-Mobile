import { BetaSection } from "@/components/betaSection/BetaSection";
import { ExternalLinkButton } from "@/components/buttons/ExternalLinkButton";
import { MiniMapView } from "@/components/minimap/MiniMapView";
import { RegionLinks } from "@/components/RegionLinks";
import { RopeGeoCursorPaginationHttpRequest } from "@/components/RopeGeoCursorPaginationHttpRequest";
import { Service } from "@/components/RopeGeoHttpRequest";
import { PagePreview } from "@/components/previews/PagePreview";
import { RegionPreview } from "@/components/previews/RegionPreview";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  type SharedValue,
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import type { RopewikiRegionView } from "ropegeo-common";
import { PageDataSource, Preview, RopewikiRegionPreviewsParams } from "ropegeo-common";

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
};

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export function RegionContent({
  regionId,
  region,
  insets,
  scrollY,
  paddingTop,
  onCardHeightLayout,
}: RegionContentProps) {
  const loadMoreRef = useRef<() => void>(() => {});
  const miniMapGateRef = useRef<View>(null);
  const miniMapUnlockedRef = useRef(false);
  const [mountMiniMapNative, setMountMiniMapNative] = useState(false);
  const hasMiniMapSv = useSharedValue(0);
  const miniMapScrollTick = useSharedValue(0);

  const countsText = formatCounts(region.pageCount, region.regionCount);
  const url = region.externalLink ?? null;
  const regions = region.regions ?? [];
  const hasMiniMap = region.miniMap != null;

  useEffect(() => {
    hasMiniMapSv.value = hasMiniMap ? 1 : 0;
  }, [hasMiniMap, hasMiniMapSv]);

  useEffect(() => {
    miniMapUnlockedRef.current = false;
    setMountMiniMapNative(false);
  }, [regionId]);

  const checkMiniMapInView = useCallback(() => {
    if (miniMapUnlockedRef.current || !hasMiniMap) return;
    const node = miniMapGateRef.current;
    if (node == null) return;
    node.measureInWindow((_, y, __, h) => {
      const winH = Dimensions.get("window").height;
      const visTop = insets.top + 8;
      const visBottom = winH - insets.bottom - 72;
      const intersects = y + h > visTop && y < visBottom;
      if (intersects) {
        miniMapUnlockedRef.current = true;
        setMountMiniMapNative(true);
      }
    });
  }, [hasMiniMap, insets.bottom, insets.top]);

  const checkMiniMapInViewRef = useRef(checkMiniMapInView);
  checkMiniMapInViewRef.current = checkMiniMapInView;

  const runMiniMapVisibilityCheck = useCallback(() => {
    checkMiniMapInViewRef.current();
  }, []);

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

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      runOnJS(checkLoadMore)(
        event.contentOffset.y,
        event.contentSize.height,
        event.layoutMeasurement.height
      );
      if (hasMiniMapSv.value !== 1) return;
      miniMapScrollTick.value += 1;
      if (miniMapScrollTick.value % 6 === 0) {
        runOnJS(runMiniMapVisibilityCheck)();
      }
    },
  });

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
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
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
              {url ? (
                <View style={[styles.externalLinkWrap, { top: -64, left: 16 }]}>
                  <ExternalLinkButton
                    icon={require("@/assets/images/ropewiki.png")}
                    link={url}
                    accessibilityLabel="Open on RopeWiki"
                  />
                </View>
              ) : null}
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
                    <BetaSection section={region.overview} />
                  ) : null}
                  {hasMiniMap ? (
                    <View
                      ref={miniMapGateRef}
                      style={styles.miniMapWrap}
                      onLayout={() => {
                        requestAnimationFrame(() => checkMiniMapInView());
                      }}
                    >
                      <MiniMapView
                        miniMap={region.miniMap!}
                        mountNativeMap={mountMiniMapNative}
                      />
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
    zIndex: 1000,
  },
  cardWrapper: {
    position: "relative",
  },
  externalLinkWrap: {
    position: "absolute",
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
