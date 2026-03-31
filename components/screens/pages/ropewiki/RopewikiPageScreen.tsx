import { BackButton } from "@/components/buttons/BackButton";
import { SaveButton } from "@/components/buttons/SaveButton";
import { ShareButton } from "@/components/buttons/ShareButton";
import { useDownloadQueue } from "@/context/DownloadQueueContext";
import { useSavedTabHighlight } from "@/context/SavedTabHighlightContext";
import { useSavedPages } from "@/context/SavedPagesContext";
import {
  Method,
  RopeGeoHttpRequest,
  Service,
} from "@/components/RopeGeoHttpRequest";
import { deleteOfflineBundleFiles } from "@/lib/offline/deleteOfflineBundle";
import { PageMiniMap } from "./PageMiniMap";
import { ExpandedImageModal } from "@/components/expandedImage/ExpandedImageModal";
import type { ExpandedImageAnchorRect } from "@/components/expandedImage/types";
import { PageBanner } from "./PageBanner";
import { PageContent as PageScrollContent } from "./PageContent";
import { PageSeamButtons } from "./PageSeamButtons";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Animated as RNAnimated,
  BackHandler,
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  PanResponder,
  Platform,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  MiniMapType,
  PageDataSource,
  type PageMiniMap as PageMiniMapConfig,
  Result,
  type RopewikiPageView,
  RouteType,
  SavedPage,
} from "ropegeo-common";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STARTING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.5);
/** Max banner height at scroll 0; shrinks as user scrolls, never below BANNER_HEIGHT (keeps width ≥ screen). */
const BANNER_HEIGHT_MAX = SCREEN_HEIGHT;
/** Fallback when image dimensions are not yet available (e.g. no image or before load). */
const FALLBACK_BANNER_ASPECT_RATIO = SCREEN_WIDTH / STARTING_HEIGHT;
const CARD_BORDER_RADIUS = 24;

/** Space for header circle buttons (16 inset + 44 tap area + gap). */
const HEADER_TOAST_INSET = 16 + 44 + 8;
/** Header row: safe-area padding + gap above first circle + circle size + gap before share row. */
const HEADER_ROW_TOP = 8;
const HEADER_CIRCLE_SIZE = 44;
const HEADER_BUTTON_STACK_GAP = 8;

function ropewikiPageShareUrl(pageId: string, source: PageDataSource): string {
  return `https://mobile.ropegeo.com/explore/${encodeURIComponent(pageId)}/page?source=${encodeURIComponent(source)}`;
}
const SAVED_TOAST_DURATION_MS = 2000;
const SAVED_TOAST_FADE_IN_MS = 250;
const SAVED_TOAST_FADE_OUT_MS = 300;
const SAVED_TOAST_BG = "rgba(0, 90, 55, 0.88)";
const SAVED_TOAST_TEXT = "#86efac";
const DOWNLOAD_TOAST_FADE_IN_MS = 250;
const DOWNLOAD_TOAST_FADE_OUT_MS = 300;
const TOAST_STACK_GAP = 8;
const TOAST_STACK_OFFSET = 44 + TOAST_STACK_GAP;

const DOWNLOAD_TOAST_BG = "rgba(55, 48, 0, 0.9)";
const DOWNLOAD_TOAST_TEXT = "#fde047";
const DOWNLOAD_COMPLETE_BG = SAVED_TOAST_BG;
const DOWNLOAD_COMPLETE_TEXT = SAVED_TOAST_TEXT;
const DOWNLOAD_FAIL_BG = "rgba(80, 0, 0, 0.88)";
const DOWNLOAD_FAIL_TEXT = "#fca5a5";

const DOWNLOAD_PHASE_COUNT = 4;

/** Same tap thresholds as `RopewikiRegionScreen` hero layer (pans disabled for single-image page). */
const TAP_MAX_DISPLACEMENT = 10;
const TAP_MAX_DURATION_MS = 300;

/** Visualize the hero hit strip; set `true` while debugging layout. */
const DEBUG_BANNER_EXPAND_HIT_OUTLINE = false;

export type RopewikiPageScreenProps = {
  pageId: string;
  /** Route type for badge display (e.g. Canyon, Cave, POI). */
  routeType?: RouteType;
};

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

function PageScreenBody({
  pageId,
  data,
  routeType,
}: {
  pageId: string;
  data: RopewikiPageView;
  routeType?: RouteType;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { enqueuePageDownload, getTaskSnapshot } = useDownloadQueue();
  const { setHighlightSavedTab } = useSavedTabHighlight();
  const {
    isSaved,
    removeSaved,
    toggleSaveFromRopewikiPage,
    removeDownloadBundle,
    savedEntries,
  } = useSavedPages();
  const saved = isSaved(pageId);
  const savedEntry = savedEntries.find((e) => e.preview.id === pageId) ?? null;
  const isDownloaded = savedEntry?.downloadedPageView != null;
  const routeTypeResolved = routeType ?? RouteType.Unknown;
  const downloadTask = getTaskSnapshot(pageId);
  const downloading =
    downloadTask?.state === "queued" || downloadTask?.state === "running";
  const downloadUi: 
    | { kind: "idle" }
    | { kind: "progress"; phase: number; phaseTitle: string; phaseProgress: number }
    | { kind: "success" }
    | { kind: "error" } = (() => {
    if (downloadTask == null) return { kind: "idle" };
    if (downloadTask.state === "queued" || downloadTask.state === "running") {
      return {
        kind: "progress",
        phase: downloadTask.phase,
        phaseTitle: downloadTask.phaseTitle,
        phaseProgress: downloadTask.phaseProgress,
      };
    }
    if (downloadTask.state === "success") return { kind: "success" };
    return { kind: "error" };
  })();

  const onRemoveDownloadPress = useCallback(async () => {
    if (!isDownloaded) return;
    await removeDownloadBundle(pageId);
  }, [isDownloaded, pageId, removeDownloadBundle]);

  const savedToastOpacity = useRef(new RNAnimated.Value(0)).current;
  const savedToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savedToastVisible, setSavedToastVisible] = useState(false);
  const downloadToastOpacity = useRef(new RNAnimated.Value(0)).current;
  const prevDownloadToastKindRef = useRef(downloadUi.kind);

  const dismissSavedToastImmediate = useCallback(() => {
    if (savedToastTimerRef.current != null) {
      clearTimeout(savedToastTimerRef.current);
      savedToastTimerRef.current = null;
    }
    savedToastOpacity.stopAnimation();
    savedToastOpacity.setValue(0);
    setSavedToastVisible(false);
    setHighlightSavedTab(false);
  }, [savedToastOpacity, setHighlightSavedTab]);

  const showSavedToast = useCallback(() => {
    if (savedToastTimerRef.current != null) {
      clearTimeout(savedToastTimerRef.current);
      savedToastTimerRef.current = null;
    }
    savedToastOpacity.stopAnimation();
    setHighlightSavedTab(true);
    setSavedToastVisible(true);
    savedToastOpacity.setValue(0);
    RNAnimated.timing(savedToastOpacity, {
      toValue: 1,
      duration: SAVED_TOAST_FADE_IN_MS,
      useNativeDriver: true,
    }).start();
    savedToastTimerRef.current = setTimeout(() => {
      savedToastTimerRef.current = null;
      RNAnimated.timing(savedToastOpacity, {
        toValue: 0,
        duration: SAVED_TOAST_FADE_OUT_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setSavedToastVisible(false);
          setHighlightSavedTab(false);
        }
      });
    }, SAVED_TOAST_DURATION_MS);
  }, [savedToastOpacity, setHighlightSavedTab]);

  useEffect(() => {
    const wasIdle = prevDownloadToastKindRef.current === "idle";
    const isIdle = downloadUi.kind === "idle";
    prevDownloadToastKindRef.current = downloadUi.kind;
    if (isIdle) {
      RNAnimated.timing(downloadToastOpacity, {
        toValue: 0,
        duration: DOWNLOAD_TOAST_FADE_OUT_MS,
        useNativeDriver: true,
      }).start();
      return;
    }
    if (wasIdle) {
      downloadToastOpacity.stopAnimation();
      downloadToastOpacity.setValue(0);
      RNAnimated.timing(downloadToastOpacity, {
        toValue: 1,
        duration: DOWNLOAD_TOAST_FADE_IN_MS,
        useNativeDriver: true,
      }).start();
      return;
    }
    downloadToastOpacity.setValue(1);
  }, [downloadToastOpacity, downloadUi.kind]);

  const onSavePress = () => {
    if (saved) {
      dismissSavedToastImmediate();
      removeSaved(pageId);
      return;
    }
    toggleSaveFromRopewikiPage(data, routeTypeResolved, pageId);
    showSavedToast();
  };
  const onSharePress = useCallback(() => {
    const url = ropewikiPageShareUrl(pageId, PageDataSource.Ropewiki);
    void Share.share(Platform.OS === "ios" ? { url } : { message: url });
  }, [pageId]);
  const onDownloadPress = useCallback(() => {
    if (downloading || isDownloaded) return;
    if (!saved) {
      showSavedToast();
    }
    enqueuePageDownload({
      pageId,
      apiPageId: pageId,
      data,
      routeType: routeTypeResolved,
    });
  }, [
    data,
    downloading,
    enqueuePageDownload,
    isDownloaded,
    pageId,
    routeTypeResolved,
    saved,
    showSavedToast,
  ]);
  const [bannerAspectRatio, setBannerAspectRatio] = useState<number | null>(null);
  const [bannerImageLoading, setBannerImageLoading] = useState(true);
  const bannerUrl = data.bannerImage?.bannerUrl ?? null;
  const hasBannerImageObject = data.bannerImage != null;

  const scrollY = useSharedValue(0);
  /** JS copy of scroll offset (throttled) so we can clip the banner hit rect above the overlapping card. */
  const [contentScrollY, setContentScrollY] = useState(0);
  const lastBannerHitScrollRef = useRef(0);
  const baseScrollYRef = useRef(0);
  const aspectRatioSv = useSharedValue(FALLBACK_BANNER_ASPECT_RATIO);
  const startHeightSv = useSharedValue(STARTING_HEIGHT);
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const miniMapGateRef = useRef<View>(null);
  const miniMapUnlockedRef = useRef(false);
  const [mountMiniMapNative, setMountMiniMapNative] = useState(false);
  const [mapMode, setMapMode] = useState<"collapsed" | "expanded">("collapsed");
  const [miniMapAnchorRect, setMiniMapAnchorRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  /** Full banner bounds for expand animation (`measureInWindow`). Hit testing uses a clipped overlay. */
  const bannerFullRectRef = useRef<View>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );
  const [heroPressed, setHeroPressed] = useState(false);
  const heroResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderRelease: () => {},
      onPanResponderTerminationRequest: () => true,
    }),
  ).current;
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const [bannerExpandAnchor, setBannerExpandAnchor] =
    useState<ExpandedImageAnchorRect | null>(null);
  const bannerFullUrl = data.bannerImage?.fullUrl ?? null;
  /** Prefer full-res URL; fall back to banner so expand works when API omits `fullUrl`. */
  const bannerExpandSourceUrl = bannerFullUrl ?? bannerUrl;

  const hasMiniMap = data.miniMap != null;

  useEffect(() => {
    miniMapUnlockedRef.current = false;
    setMountMiniMapNative(false);
    setMiniMapAnchorRect(null);
    setBannerExpanded(false);
    setBannerExpandAnchor(null);
    setContentScrollY(0);
    lastBannerHitScrollRef.current = 0;
    dismissSavedToastImmediate();
  }, [pageId, dismissSavedToastImmediate]);

  const checkMiniMapInView = useCallback(() => {
    if (!hasMiniMap) return;
    const node = miniMapGateRef.current;
    if (node == null) return;
    node.measureInWindow((x, y, width, h) => {
      setMiniMapAnchorRect({ x, y, width, height: h });
      baseScrollYRef.current = scrollY.value;
      const winH = Dimensions.get("window").height;
      const visTop = insets.top + HEADER_ROW_TOP;
      const visBottom = winH - insets.bottom - 72;
      const intersects = y + h > visTop && y < visBottom;
      if (intersects && !miniMapUnlockedRef.current) {
        miniMapUnlockedRef.current = true;
        setMountMiniMapNative(true);
      }
    });
  }, [hasMiniMap, insets.bottom, insets.top, scrollY]);

  useEffect(() => {
    if (!hasMiniMap) return;
    const t = setTimeout(() => {
      checkMiniMapInView();
    }, 0);
    return () => clearTimeout(t);
  }, [hasMiniMap, checkMiniMapInView]);

  const flushBannerHitScrollFromEvent = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      lastBannerHitScrollRef.current = Math.round(y * 2) / 2;
      setContentScrollY(y);
    },
    []
  );

  const onScrollEndDragPage = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      flushBannerHitScrollFromEvent(e);
      checkMiniMapInView();
    },
    [checkMiniMapInView, flushBannerHitScrollFromEvent]
  );

  const onMomentumScrollEndPage = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      flushBannerHitScrollFromEvent(e);
      checkMiniMapInView();
    },
    [checkMiniMapInView, flushBannerHitScrollFromEvent]
  );

  const openPageFullMap = useCallback(() => {
    setMapMode("expanded");
  }, []);

  const closePageFullMap = useCallback(() => {
    setMapMode("collapsed");
  }, []);

  const openBannerExpanded = useCallback(() => {
    if (bannerExpandSourceUrl == null) return;
    const node = bannerFullRectRef.current;
    if (node == null) return;
    node.measureInWindow((x, y, width, height) => {
      setBannerExpandAnchor({ x, y, width, height });
      setBannerExpanded(true);
    });
  }, [bannerExpandSourceUrl]);

  const onBannerExpandedDismissed = useCallback(() => {
    setBannerExpanded(false);
    setBannerExpandAnchor(null);
  }, []);

  useEffect(() => {
    if (mapMode !== "expanded") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setMapMode("collapsed");
      return true;
    });
    return () => sub.remove();
  }, [mapMode]);

  const onScrollOffsetForBannerHit = useCallback((y: number) => {
    const q = Math.round(y * 2) / 2;
    if (Math.abs(q - lastBannerHitScrollRef.current) < 2) {
      return;
    }
    lastBannerHitScrollRef.current = q;
    setContentScrollY(q);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      scrollY.value = y;
      runOnJS(onScrollOffsetForBannerHit)(y);
    },
  });

  useEffect(() => {
    if (!bannerUrl) {
      setBannerAspectRatio(null);
      setBannerImageLoading(false);
      return;
    }
    setBannerImageLoading(true);
    Image.loadAsync(bannerUrl)
      .then((ref) => {
        const ratio = ref.width / ref.height;
        setBannerAspectRatio(ratio);
        aspectRatioSv.value = ratio;
      })
      .catch(() => setBannerAspectRatio(null));
  }, [bannerUrl, aspectRatioSv]);

  const bottomPadding = insets.bottom + 16;
  const paddingTop =
    cardHeight != null && cardHeight < SCREEN_HEIGHT / 2
      ? Math.max(0, SCREEN_HEIGHT - cardHeight - bottomPadding)
      : STARTING_HEIGHT;

  useEffect(() => {
    startHeightSv.value = paddingTop;
  }, [paddingTop, startHeightSv]);

  const bannerAnimatedStyle = useAnimatedStyle(() => {
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

  /** Match `bannerAnimatedStyle` height logic in JS (see useAnimatedStyle above). */
  const bannerHeightJs = (() => {
    const ratio =
      bannerAspectRatio != null && bannerAspectRatio > 0
        ? bannerAspectRatio
        : FALLBACK_BANNER_ASPECT_RATIO;
    const minFromImage = Math.round(SCREEN_WIDTH / ratio);
    const parallax = Math.min(BANNER_HEIGHT_MAX, paddingTop - contentScrollY);
    return Math.max(minFromImage, parallax);
  })();

  /**
   * Hero hit target: full window width × `bannerTapHeight` (same horizontal span as
   * `RopewikiRegionScreen` hero layer). Seam controls may need a higher z-index if taps are stolen.
   */
  const bannerExpandHitRect =
    bannerUrl != null && bannerExpandSourceUrl != null
      ? { left: 0, width: SCREEN_WIDTH }
      : null;

  /** Top edge of the overlapping card in window Y; only the banner above this should capture taps. */
  const cardTopWindowY = paddingTop - CARD_BORDER_RADIUS - contentScrollY;
  const bannerTapHeight = Math.max(
    0,
    Math.min(bannerHeightJs, cardTopWindowY)
  );
  const bannerHitActive =
    bannerTapHeight >= 12 && !bannerImageLoading && mapMode !== "expanded";

  return (
    <View style={styles.container}>
      <PageBanner
        imageFrameStyle={bannerAnimatedStyle}
        bannerUrl={bannerUrl}
        hasBannerImageObject={hasBannerImageObject}
        bannerImageLoading={bannerImageLoading}
        bannerFullRectRef={bannerFullRectRef}
        onBannerImageLoadEnd={() => setBannerImageLoading(false)}
      />

      {bannerExpandHitRect != null && mapMode !== "expanded" ? (
        <Animated.View
          {...heroResponder.panHandlers}
          pointerEvents={bannerHitActive ? "box-only" : "none"}
          onTouchStart={(e) => {
            if (!bannerHitActive) return;
            setHeroPressed(true);
            touchStartRef.current = {
              x: e.nativeEvent.pageX,
              y: e.nativeEvent.pageY,
              time: Date.now(),
            };
          }}
          onTouchEnd={(e) => {
            setHeroPressed(false);
            const start = touchStartRef.current;
            touchStartRef.current = null;
            if (start == null || !bannerHitActive) return;
            const dx = Math.abs(e.nativeEvent.pageX - start.x);
            const dy = Math.abs(e.nativeEvent.pageY - start.y);
            const dt = Date.now() - start.time;
            if (
              dx < TAP_MAX_DISPLACEMENT &&
              dy < TAP_MAX_DISPLACEMENT &&
              dt < TAP_MAX_DURATION_MS
            ) {
              openBannerExpanded();
            }
          }}
          style={[
            styles.heroBannerLayer,
            {
              top: 0,
              height: bannerTapHeight,
              left: bannerExpandHitRect.left,
              width: bannerExpandHitRect.width,
              opacity: heroPressed && bannerHitActive ? 0.94 : 1,
              ...(DEBUG_BANNER_EXPAND_HIT_OUTLINE
                ? { borderWidth: 2, borderColor: "red" }
                : {}),
            },
          ]}
        />
      ) : null}

      <PageScrollContent
        data={data}
        routeTypeResolved={routeTypeResolved}
        insets={insets}
        paddingTop={paddingTop}
        mapExpanded={mapMode === "expanded"}
        onScroll={scrollHandler}
        onScrollEndDrag={onScrollEndDragPage}
        onMomentumScrollEnd={onMomentumScrollEndPage}
        onCardHeightLayout={setCardHeight}
        miniMapGateRef={miniMapGateRef}
        onMiniMapLayout={(width, height) => {
          setMiniMapAnchorRect((prev) =>
            prev == null
              ? { x: 0, y: 0, width, height }
              : { ...prev, width, height },
          );
        }}
        checkMiniMapInView={checkMiniMapInView}
      />

      <PageSeamButtons
        url={data.url}
        scrollY={scrollY}
        paddingTop={paddingTop}
        mapExpanded={mapMode === "expanded"}
        isDownloaded={isDownloaded}
        downloading={downloading}
        downloadPhase={downloadUi.kind === "progress" ? downloadUi.phase : 1}
        downloadPhaseProgress={
          downloadUi.kind === "progress" ? downloadUi.phaseProgress : 0
        }
        onDownloadPress={onDownloadPress}
        onRemoveDownloadPress={onRemoveDownloadPress}
      />

      {mapMode !== "expanded" && (
        <>
          <BackButton onPress={() => router.back()} top={insets.top + HEADER_ROW_TOP} />
          <RNAnimated.View
            pointerEvents="none"
            style={[
              styles.savedToastWrap,
              {
                top:
                  insets.top +
                  HEADER_ROW_TOP +
                  (savedToastVisible && downloadUi.kind !== "idle" ? TOAST_STACK_OFFSET : 0),
                opacity: savedToastOpacity,
              },
            ]}
          >
            <View style={styles.savedToastInner}>
              <Text style={styles.savedToastText}>Page saved</Text>
            </View>
          </RNAnimated.View>
          {downloadUi.kind !== "idle" ? (
            <RNAnimated.View
              pointerEvents="none"
              style={[
                styles.downloadToastWrap,
                { top: insets.top + HEADER_ROW_TOP, opacity: downloadToastOpacity },
              ]}
            >
              {downloadUi.kind === "progress" ? (
                <View style={[styles.downloadToastInner, styles.downloadToastInnerProgress]}>
                  <Text style={styles.downloadToastTitle}>
                    {`(${downloadUi.phase}/${DOWNLOAD_PHASE_COUNT}) ${downloadUi.phaseTitle}`}
                  </Text>
                  <View style={styles.downloadProgressTrack}>
                    <View
                      style={[
                        styles.downloadProgressFill,
                        {
                          width: `${Math.round(downloadUi.phaseProgress * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : null}
              {downloadUi.kind === "success" ? (
                <View style={[styles.downloadToastInner, styles.downloadToastInnerSuccess]}>
                  <Text style={styles.downloadToastTitleSuccess}>
                    ({DOWNLOAD_PHASE_COUNT}/{DOWNLOAD_PHASE_COUNT}) Download complete
                  </Text>
                </View>
              ) : null}
              {downloadUi.kind === "error" ? (
                <View style={[styles.downloadToastInner, styles.downloadToastInnerError]}>
                  <Text style={styles.downloadToastTitleError}>Download failed</Text>
                </View>
              ) : null}
            </RNAnimated.View>
          ) : null}
          <SaveButton saved={saved} onPress={onSavePress} top={insets.top + HEADER_ROW_TOP} />
          <ShareButton
            onPress={onSharePress}
            top={
              insets.top +
              HEADER_ROW_TOP +
              HEADER_CIRCLE_SIZE +
              HEADER_BUTTON_STACK_GAP
            }
          />
        </>
      )}
      {hasMiniMap && data.miniMap?.miniMapType === MiniMapType.TilesTemplate ? (
        <PageMiniMap
          miniMap={data.miniMap as PageMiniMapConfig}
          pageName={data.name}
          mountNativeMap={mountMiniMapNative}
          expanded={mapMode === "expanded"}
          anchorRect={miniMapAnchorRect}
          baseScrollY={baseScrollYRef.current}
          scrollY={scrollY}
          onExpand={openPageFullMap}
          onCollapse={closePageFullMap}
          localTileRootUri={savedEntry?.downloadedMapData ?? null}
        />
      ) : null}

      {bannerExpanded &&
      bannerExpandAnchor != null &&
      bannerExpandSourceUrl != null ? (
        <ExpandedImageModal
          anchorRect={bannerExpandAnchor}
          pages={[
            {
              itemKey: "page-banner",
              fullUrl: bannerExpandSourceUrl,
              bannerUrl,
              captionHtml: data.bannerImage?.caption ?? null,
            },
          ]}
          initialPageIndex={0}
          headerPageTitle={data.name}
          onDismissed={onBannerExpandedDismissed}
        />
      ) : null}
    </View>
  );
}

export function RopewikiPageScreen({
  pageId,
  routeType,
}: RopewikiPageScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { savedEntries, replaceSaved, isLoading: savedPagesLoading } = useSavedPages();
  const savedEntry = savedEntries.find((e) => e.preview.id === pageId) ?? null;
  const [preferOfflineForSession, setPreferOfflineForSession] = useState(false);
  const shouldUseOffline =
    preferOfflineForSession && savedEntry?.downloadedPageView != null;

  const [offlineData, setOfflineData] = useState<RopewikiPageView | null>(null);
  const [offlineError, setOfflineError] = useState<Error | null>(null);
  const [offlineLoading, setOfflineLoading] = useState(false);

  useEffect(() => {
    // Lock source mode when entering a page so finishing a download in-place
    // does not switch from HTTP -> offline until the next visit.
    if (savedPagesLoading) return;
    setPreferOfflineForSession(savedEntry?.downloadedPageView != null);
    // Intentionally omit savedEntry from deps: source mode is chosen on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, savedPagesLoading]);

  useEffect(() => {
    if (!shouldUseOffline) {
      setOfflineData(null);
      setOfflineError(null);
      setOfflineLoading(false);
      return;
    }
    let cancelled = false;
    setOfflineLoading(true);
    void (async () => {
      const path = savedEntry.downloadedPageView;
      if (path == null) return;
      try {
        let info: Awaited<ReturnType<typeof FileSystem.getInfoAsync>> | null = null;
        try {
          info = await FileSystem.getInfoAsync(path);
        } catch {
          info = null;
        }
        if (info != null && !info.exists) {
          replaceSaved(
            new SavedPage(
              savedEntry.preview,
              savedEntry.routeType,
              savedEntry.savedAt,
              null,
              null,
              null,
            ),
          );
          void deleteOfflineBundleFiles(pageId);
          return;
        }
        const text = await FileSystem.readAsStringAsync(path);
        const raw = JSON.parse(text) as unknown;
        const parsed = Result.fromResponseBody(raw);
        const view = parsed.result as RopewikiPageView;
        const patched = savedEntry.applyDownloadedImagesToPageView(view);
        if (!cancelled) {
          setOfflineData(patched);
          setOfflineError(null);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const staleOffline =
          /not readable|no such file|does not exist|ENOENT|not found/i.test(msg);
        if (staleOffline) {
          replaceSaved(
            new SavedPage(
              savedEntry.preview,
              savedEntry.routeType,
              savedEntry.savedAt,
              null,
              null,
              null,
            ),
          );
          void deleteOfflineBundleFiles(pageId);
          if (!cancelled) {
            setOfflineError(null);
            setOfflineData(null);
          }
        } else if (!cancelled) {
          setOfflineError(e instanceof Error ? e : new Error(String(e)));
        }
      } finally {
        if (!cancelled) setOfflineLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    pageId,
    shouldUseOffline,
    savedEntry?.downloadedPageView,
    savedEntry?.downloadedImages,
    replaceSaved,
  ]);

  if (shouldUseOffline) {
    if (offlineError != null) {
      return <ErrorEffect error={offlineError} />;
    }
    if (offlineLoading || offlineData == null) {
      return (
        <View style={styles.container}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#666" />
          </View>
          <BackButton onPress={() => router.back()} top={insets.top + HEADER_ROW_TOP} />
        </View>
      );
    }
    return <PageScreenBody pageId={pageId} data={offlineData} routeType={routeType} />;
  }

  return (
    <RopeGeoHttpRequest<RopewikiPageView>
      service={Service.WEBSCRAPER}
      method={Method.GET}
      path="/ropewiki/page/:id"
      pathParams={{ id: pageId }}
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
              <BackButton onPress={() => router.back()} top={insets.top + HEADER_ROW_TOP} />
            </View>
          );
        }
        if (data == null) {
          return null;
        }
        return (
          <PageScreenBody pageId={pageId} data={data} routeType={routeType} />
        );
      }}
    </RopeGeoHttpRequest>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e7eb",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  heroBannerLayer: {
    position: "absolute",
    zIndex: 2000,
  },
  savedToastWrap: {
    position: "absolute",
    left: HEADER_TOAST_INSET,
    right: HEADER_TOAST_INSET,
    zIndex: 3650,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  savedToastInner: {
    backgroundColor: SAVED_TOAST_BG,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    maxWidth: "100%",
  },
  savedToastText: {
    color: SAVED_TOAST_TEXT,
    fontSize: 15,
    fontWeight: "600",
  },
  downloadToastWrap: {
    position: "absolute",
    left: HEADER_TOAST_INSET,
    right: HEADER_TOAST_INSET,
    zIndex: 3651,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadToastInner: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  downloadToastInnerProgress: {
    backgroundColor: DOWNLOAD_TOAST_BG,
  },
  downloadToastTitle: {
    color: DOWNLOAD_TOAST_TEXT,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  downloadProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  downloadProgressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: DOWNLOAD_TOAST_TEXT,
  },
  downloadToastInnerSuccess: {
    backgroundColor: DOWNLOAD_COMPLETE_BG,
  },
  downloadToastTitleSuccess: {
    color: DOWNLOAD_COMPLETE_TEXT,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  downloadToastInnerError: {
    backgroundColor: DOWNLOAD_FAIL_BG,
  },
  downloadToastTitleError: {
    color: DOWNLOAD_FAIL_TEXT,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
