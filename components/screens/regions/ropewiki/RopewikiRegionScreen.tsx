import { BackButton } from "@/components/buttons/BackButton";
import { ExpandedImageModal } from "@/components/expandedImage/ExpandedImageModal";
import type { ExpandedImageAnchorRect, ExpandedImageGalleryPage } from "@/components/expandedImage/types";
import { RegionBanner, type RegionBannerHandle } from "./RegionBanner";
import { RegionMiniMap } from "./RegionMiniMap";
import { RegionContent } from "./RegionContent";
import { RegionSeamButtons } from "./RegionSeamButtons";
import {
  RopeGeoHttpRequest,
  Service,
  Method,
} from "@/components/RopeGeoHttpRequest";

import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  PanResponder,
  StyleSheet,
  View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { MiniMapType, PageDataSource, RopewikiRegionView } from "ropegeo-common/classes";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STARTING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.5);
const BANNER_HEIGHT_MAX = SCREEN_HEIGHT;
const FALLBACK_BANNER_ASPECT_RATIO = SCREEN_WIDTH / STARTING_HEIGHT;
const CARD_BORDER_RADIUS = 24;
const HERO_SWIPE_ACTIVATE_DX = 16;
const HERO_SWIPE_TRIGGER_DX = 40;
const TAP_MAX_DISPLACEMENT = 10;
const TAP_MAX_DURATION_MS = 300;


function ErrorEffect({ error }: { error: Error }) {
  const router = useRouter();
  useEffect(() => {
    router.back();
    Toast.show({
      type: "error",
      text1: "Error",
      text2: error.message,
      position: "top",
      visibilityTime: 5000,
    });
  }, [error, router]);
  return null;
}

function RegionScreenBody({
  data,
  regionId,
}: {
  data: RopewikiRegionView;
  regionId: string;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const paddingTopSv = useSharedValue(STARTING_HEIGHT);
  const aspectRatioSv = useSharedValue(FALLBACK_BANNER_ASPECT_RATIO);
  const startHeightSv = useSharedValue(STARTING_HEIGHT);
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const [mapMode, setMapMode] = useState<"collapsed" | "expanded">("collapsed");
  const [regionPageVerticalScrollActive, setRegionPageVerticalScrollActive] =
    useState(false);
  const [mountMiniMapNative, setMountMiniMapNative] = useState(false);
  const [miniMapAnchorRect, setMiniMapAnchorRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const baseScrollYRef = useRef(0);
  const bannerRef = useRef<RegionBannerHandle | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const [expandedModalVisible, setExpandedModalVisible] = useState(false);
  const [expandedAnchorRect, setExpandedAnchorRect] = useState<ExpandedImageAnchorRect | null>(null);
  const [expandedPageTitle, setExpandedPageTitle] = useState("");
  const [expandedInitialIndex, setExpandedInitialIndex] = useState(0);

  const hasMiniMap = data.miniMap != null;

  useEffect(() => {
    setMountMiniMapNative(false);
    setMiniMapAnchorRect(null);
  }, [regionId]);

  const handleMiniMapAnchorRect = useCallback(
    (rect: { x: number; y: number; width: number; height: number }) => {
      setMiniMapAnchorRect(rect);
      baseScrollYRef.current = scrollY.value;
    },
    [scrollY]
  );

  const handleMountMiniMapNative = useCallback(() => {
    setMountMiniMapNative(true);
  }, []);

  const openRegionFullMap = useCallback(() => {
    setMapMode("expanded");
  }, []);

  const closeRegionFullMap = useCallback(() => {
    setMapMode("collapsed");
  }, []);

  const bottomPadding = insets.bottom + 16;
  const paddingTop =
    cardHeight != null && cardHeight < SCREEN_HEIGHT / 2
      ? Math.max(0, SCREEN_HEIGHT - cardHeight - bottomPadding)
      : STARTING_HEIGHT;

  useEffect(() => {
    // Must match scroll content `paddingTop` so the banner meets the card (no gray strip).
    startHeightSv.value = Math.min(paddingTop, BANNER_HEIGHT_MAX);
  }, [paddingTop, startHeightSv]);
  useEffect(() => {
    paddingTopSv.value = paddingTop;
  }, [paddingTop, paddingTopSv]);

  const expandedPages = useMemo((): ExpandedImageGalleryPage[] => {
    const slides = bannerRef.current?.getAllSlides() ?? [];
    if (!expandedModalVisible || slides.length === 0) return [];
    return slides.map((s) => ({
      itemKey: s.id,
      fullUrl: s.fullUrl,
      bannerUrl: s.bannerUrl,
      captionHtml: s.captionHtml,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedModalVisible]);

  const handleBannerTap = useCallback(() => {
    const handle = bannerRef.current;
    if (handle == null) return;
    const slide = handle.getCurrentSlide();
    if (slide == null) return;
    const anchorHeight = Math.min(paddingTop, SCREEN_HEIGHT / 2);
    setExpandedAnchorRect({ x: 0, y: 0, width: SCREEN_WIDTH, height: anchorHeight });
    setExpandedPageTitle(slide.pageName);
    setExpandedInitialIndex(handle.getCurrentIndex());
    setExpandedModalVisible(true);
  }, [paddingTop]);

  const handleExpandedPageChange = useCallback(
    (_pageIndex: number, _itemKey: string) => {
      const slides = bannerRef.current?.getAllSlides() ?? [];
      const next = slides.find((s) => s.id === _itemKey);
      if (next != null) {
        setExpandedPageTitle(next.pageName);
      }
    },
    [],
  );

  const handleExpandedDismissed = useCallback(() => {
    setExpandedModalVisible(false);
    setExpandedAnchorRect(null);
  }, []);

  const heroSwipeLayerStyle = useAnimatedStyle(() => ({
    height: Math.max(0, paddingTopSv.value - CARD_BORDER_RADIUS - scrollY.value),
  }));

  const bannerImageFrameStyle = useAnimatedStyle(() => {
    const height = Math.max(
      Math.round(SCREEN_WIDTH / aspectRatioSv.value),
      Math.min(BANNER_HEIGHT_MAX, startHeightSv.value - scrollY.value)
    );
    const width = height * aspectRatioSv.value;
    return {
      height,
      width,
      left: (SCREEN_WIDTH - width) / 2,
    };
  });

  useEffect(() => {
    if (mapMode !== "expanded") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setMapMode("collapsed");
      return true;
    });
    return () => sub.remove();
  }, [mapMode]);

  useEffect(() => {
    if (mapMode === "expanded") {
      setRegionPageVerticalScrollActive(false);
    }
  }, [mapMode]);

  const heroSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > HERO_SWIPE_ACTIVATE_DX &&
        Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < HERO_SWIPE_TRIGGER_DX) return;
        bannerRef.current?.swipeBy(g.dx < 0 ? 1 : -1);
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  return (
    <View style={styles.container}>
      <RegionBanner
        ref={bannerRef}
        regionId={regionId}
        layoutWidth={SCREEN_WIDTH}
        layoutHeight={BANNER_HEIGHT_MAX}
        imageFrameStyle={bannerImageFrameStyle}
        verticalScrollActive={regionPageVerticalScrollActive}
      />

      {mapMode !== "expanded" ? (
        <Animated.View
          {...heroSwipeResponder.panHandlers}
          pointerEvents="box-only"
          onTouchStart={(e) => {
            touchStartRef.current = {
              x: e.nativeEvent.pageX,
              y: e.nativeEvent.pageY,
              time: Date.now(),
            };
          }}
          onTouchEnd={(e) => {
            const start = touchStartRef.current;
            touchStartRef.current = null;
            if (start == null) return;
            const dx = Math.abs(e.nativeEvent.pageX - start.x);
            const dy = Math.abs(e.nativeEvent.pageY - start.y);
            const dt = Date.now() - start.time;
            if (dx < TAP_MAX_DISPLACEMENT && dy < TAP_MAX_DISPLACEMENT && dt < TAP_MAX_DURATION_MS) {
              handleBannerTap();
            }
          }}
          style={[
            styles.heroSwipeLayer,
            heroSwipeLayerStyle,
          ]}
        />
      ) : null}

      <RegionContent
        regionId={regionId}
        region={data}
        insets={insets}
        scrollY={scrollY}
        paddingTop={paddingTop}
        onCardHeightLayout={setCardHeight}
        onOpenFullMap={openRegionFullMap}
        mapExpanded={mapMode === "expanded"}
        onMiniMapAnchorRect={handleMiniMapAnchorRect}
        onMountMiniMapNative={handleMountMiniMapNative}
        onVerticalScrollActiveChange={setRegionPageVerticalScrollActive}
      />

      <RegionSeamButtons
        url={data.externalLink ?? null}
        scrollY={scrollY}
        paddingTop={paddingTop}
        mapExpanded={mapMode === "expanded"}
      />

      {mapMode !== "expanded" && (
        <BackButton onPress={() => router.back()} top={insets.top + 8} />
      )}
      {hasMiniMap && data.miniMap?.miniMapType === MiniMapType.GeoJson ? (
        <RegionMiniMap
          regionName={data.name}
          regionId={regionId}
          source={PageDataSource.Ropewiki}
          mountNativeMap={mountMiniMapNative}
          expanded={mapMode === "expanded"}
          anchorRect={miniMapAnchorRect}
          baseScrollY={baseScrollYRef.current}
          scrollY={scrollY}
          onExpand={openRegionFullMap}
          onCollapse={closeRegionFullMap}
        />
      ) : null}

      {expandedModalVisible && expandedAnchorRect != null && expandedPages.length > 0 ? (
        <ExpandedImageModal
          anchorRect={expandedAnchorRect}
          pages={expandedPages}
          initialPageIndex={expandedInitialIndex}
          onPageChange={handleExpandedPageChange}
          headerPageTitle={expandedPageTitle}
          onDismissed={handleExpandedDismissed}
        />
      ) : null}
    </View>
  );
}

export type RopewikiRegionScreenProps = {
  regionId: string;
};

export function RopewikiRegionScreen({ regionId }: RopewikiRegionScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <RopeGeoHttpRequest<RopewikiRegionView>
      service={Service.WEBSCRAPER}
      method={Method.GET}
      path="/ropewiki/region/:id"
      pathParams={{ id: regionId }}
    >
      {({ loading, data, errors }) => {
        if (errors != null) {
          return <ErrorEffect error={errors} />;
        }
        if (loading) {
          return (
            <View style={styles.container}>
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#666" />
              </View>
              <BackButton onPress={() => router.back()} top={insets.top + 8} />
            </View>
          );
        }
        if (data == null) {
          return null;
        }
        return <RegionScreenBody data={data} regionId={regionId} />;
      }}
    </RopeGeoHttpRequest>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e7eb",
  },
  heroSwipeLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
});
