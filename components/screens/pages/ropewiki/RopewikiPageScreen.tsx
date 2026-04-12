import { BackButton } from "@/components/buttons/BackButton";
import { SaveButton } from "@/components/buttons/SaveButton";
import { ShareButton } from "@/components/buttons/ShareButton";
import { useDownloadQueue } from "@/context/DownloadQueueContext";
import { useSavedTabHighlight } from "@/context/SavedTabHighlightContext";
import { useSavedPages } from "@/context/SavedPagesContext";
import { useShareSheetDimmer } from "@/context/ShareSheetDimmerContext";
import {
  Method,
  RopeGeoHttpRequest,
  Service,
} from "ropegeo-common/components";
import { deleteOfflineBundleFiles } from "@/lib/offline/deleteOfflineBundle";
import { PageMiniMap } from "./PageMiniMap";
import { ExpandedImageModal } from "@/components/expandedImage/ExpandedImageModal";
import type { ExpandedImageAnchorRect } from "@/components/expandedImage/types";
import { PageBanner } from "./PageBanner";
import { PageContent as PageScrollContent } from "./PageContent";
import { PageSeamButtons } from "./PageSeamButtons";
import {
  ProgressToast,
  SAVED_TOAST_DURATION_MS,
  Toast,
  TOAST_HORIZONTAL_INSET,
  useAppToast,
} from "@/components/toast";
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
import {
  MiniMapType,
  PageDataSource,
  type PageMiniMap as PageMiniMapConfig,
  Result,
  type RopewikiPageView,
  RouteType,
  SavedPage,
} from "ropegeo-common/models";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STARTING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.5);
/** Max banner height at scroll 0; shrinks as user scrolls, never below BANNER_HEIGHT (keeps width ≥ screen). */
const BANNER_HEIGHT_MAX = SCREEN_HEIGHT;
/** Fallback when image dimensions are not yet available (e.g. no image or before load). */
const FALLBACK_BANNER_ASPECT_RATIO = SCREEN_WIDTH / STARTING_HEIGHT;
const CARD_BORDER_RADIUS = 24;

/** Header row: safe-area padding + gap above first circle + circle size + gap before share row. */
const HEADER_ROW_TOP = 8;
const HEADER_CIRCLE_SIZE = 44;
const HEADER_BUTTON_STACK_GAP = 8;

function ropewikiPageShareUrl(pageId: string, source: PageDataSource): string {
  return `https://mobile.ropegeo.com/explore/${encodeURIComponent(pageId)}/page?source=${encodeURIComponent(source)}`;
}
const TOAST_STACK_GAP = 8;
const TOAST_STACK_OFFSET = 44 + TOAST_STACK_GAP;

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
  const showToast = useAppToast();
  useEffect(() => {
    router.back();
    showToast({
      variant: "error",
      message: "Error",
      subtitle: error.message,
    });
  }, [error, router, showToast]);
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
  const { showShareDimmer, hideShareDimmer } = useShareSheetDimmer();
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

  const savedToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savedToastVisible, setSavedToastVisible] = useState(false);

  const dismissSavedToastImmediate = useCallback(() => {
    if (savedToastTimerRef.current != null) {
      clearTimeout(savedToastTimerRef.current);
      savedToastTimerRef.current = null;
    }
    setSavedToastVisible(false);
    setHighlightSavedTab(false);
  }, [setHighlightSavedTab]);

  const showSavedToast = useCallback(() => {
    if (savedToastTimerRef.current != null) {
      clearTimeout(savedToastTimerRef.current);
      savedToastTimerRef.current = null;
    }
    setHighlightSavedTab(true);
    setSavedToastVisible(true);
    savedToastTimerRef.current = setTimeout(() => {
      savedToastTimerRef.current = null;
      setSavedToastVisible(false);
    }, SAVED_TOAST_DURATION_MS);
  }, [setHighlightSavedTab]);

  const handleSavedToastHidden = useCallback(() => {
    setHighlightSavedTab(false);
  }, [setHighlightSavedTab]);

  const onSavePress = () => {
    if (saved) {
      dismissSavedToastImmediate();
      removeSaved(pageId);
      return;
    }
    toggleSaveFromRopewikiPage(data, routeTypeResolved, pageId);
    showSavedToast();
  };
  /** True until `Share.share` settles; keeps page non-interactive even if the dimmer was dismissed. */
  const [shareInteractionLocked, setShareInteractionLocked] = useState(false);
  const onSharePress = useCallback(async () => {
    const url = ropewikiPageShareUrl(pageId, PageDataSource.Ropewiki);
    setShareInteractionLocked(true);
    showShareDimmer();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    try {
      await Share.share(Platform.OS === "ios" ? { url } : { message: url });
    } catch {
      // Share can reject when unavailable or cancelled on some platforms.
    } finally {
      setShareInteractionLocked(false);
      hideShareDimmer();
    }
  }, [pageId, showShareDimmer, hideShareDimmer]);
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
  const mapDirections =
    data.coordinates != null &&
    hasMiniMap &&
    data.miniMap?.miniMapType === MiniMapType.TilesTemplate
      ? { lat: data.coordinates.lat, lon: data.coordinates.lon }
      : null;

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
      <View
        style={styles.shareBlockableLayer}
        pointerEvents={shareInteractionLocked ? "none" : "auto"}
        collapsable={false}
      >
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
          <Toast
            visible={savedToastVisible}
            variant="success"
            message="Page saved"
            top={
              insets.top +
              HEADER_ROW_TOP +
              (savedToastVisible && downloadUi.kind !== "idle" ? TOAST_STACK_OFFSET : 0)
            }
            horizontalInset={TOAST_HORIZONTAL_INSET}
            zIndex={3650}
            onHidden={handleSavedToastHidden}
          />
          {downloadUi.kind !== "idle" ? (
            <ProgressToast
              kind={downloadUi.kind}
              title={
                downloadUi.kind === "progress"
                  ? `(${downloadUi.phase}/${DOWNLOAD_PHASE_COUNT}) ${downloadUi.phaseTitle}`
                  : downloadUi.kind === "success"
                    ? `(${DOWNLOAD_PHASE_COUNT}/${DOWNLOAD_PHASE_COUNT}) Download complete`
                    : "Download failed"
              }
              progress={
                downloadUi.kind === "progress"
                  ? downloadUi.phaseProgress
                  : undefined
              }
              top={insets.top + HEADER_ROW_TOP}
              horizontalInset={TOAST_HORIZONTAL_INSET}
            />
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
          mapDirections={mapDirections}
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
  shareBlockableLayer: {
    flex: 1,
  },
});
