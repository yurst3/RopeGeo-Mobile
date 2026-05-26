import { SavedPageGlyph } from "@/components/buttons/standard/SavedPageGlyph";
import { useNetworkRequestToasts } from "@/components/toast/useNetworkRequestToasts";
import { TOAST_KEY_ROUTE_PREVIEW_ERROR } from "@/constants/toasts/toastArchetypes";
import { useNetworkStatus } from "@/context/NetworkStatusContext";
import { loadDownloadedRoutePreviewsForPage } from "@/lib/offline/downloadedRoutePreviewsStorage";
import { REQUEST_TIMEOUT_SECONDS } from "@/lib/network/requestTimeout";
import {
  Method,
  RopeGeoDataLoader,
  Service,
} from "ropegeo-common/components";
import { useSavedPages } from "@/context/SavedPagesContext";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import Animated, {
  type AnimatedStyle,
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ExternalLinkButton } from "@/components/buttons/standard/ExternalLinkButton";
import { StarRating } from "@/components/StarRating";
import {
  AcaDifficultyRating,
  type OnlinePagePreview,
  type OfflinePagePreview,
  RouteType,
} from "ropegeo-common/models";
import { BadgeRow } from "./BadgeRow";
import { useColorTheme } from "@/context/ColorThemeContext";
import { RoutePreviewPlaceholder } from "./RoutePreviewPlaceholder";

const CARD_BORDER_RADIUS = 12;
const CARD_PADDING = 12;
const IMAGE_ASPECT = 3 / 4;
const NO_IMAGE_ICON_SIZE = 36;
const EXTERNAL_LINK_BUTTON_GAP = 8;
/** Matches {@link ExternalLinkButton} circle (white + shadow). */
const SAVED_GLYPH_BUTTON_SIZE = 48;
/** Minimum height so loading and loaded preview cards stay the same size. */
const PREVIEW_CARD_MIN_HEIGHT = 140;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN_H = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN_H * 2;

const SLIDE_ENTER_MS = 320;
const SLIDE_EXIT_MS = 260;
const slideEnterEasing = Easing.out(Easing.cubic);
const slideExitEasing = Easing.in(Easing.cubic);

/**
 * Placeholder path param while no route is focused. {@link RopeGeoDataLoader} stays mounted with
 * `offlineData={null}` so the network effect never runs; this value is never requested.
 */
const ROUTE_PREVIEW_LOADER_IDLE_ROUTE_ID = "__ropegeo_route_preview_inactive__";

type PreviewCardData = OnlinePagePreview | OfflinePagePreview;

function hasDifficultyInfo(difficulty: PreviewCardData["difficultyRating"]): boolean {
  if (!(difficulty instanceof AcaDifficultyRating)) return false;
  return (
    difficulty.technical != null ||
    difficulty.water != null ||
    difficulty.time != null ||
    difficulty.getEffectiveRiskForDisplay() != null
  );
}

function showBadges(
  preview: PreviewCardData,
  routeType?: RouteType | null,
): boolean {
  return (
    preview.permit != null ||
    routeType === RouteType.Cave ||
    routeType === RouteType.POI ||
    hasDifficultyInfo(preview.difficultyRating)
  );
}

function SinglePreviewCard({
  preview,
  routeType = null,
  badgeScale = 0.65,
  onPress,
}: {
  preview: PreviewCardData;
  routeType?: RouteType | null;
  badgeScale?: number;
  onPress?: (preview: PreviewCardData) => void;
}) {
  const themeColors = useColorTheme();
  const { text, image, background } = themeColors;
  const previewImageUri =
    preview.fetchType === "online" ? preview.imageUrl : preview.downloadedImagePath;
  const [imageLoading, setImageLoading] = useState(!!previewImageUri);
  const rating = preview.rating ?? 0;
  const ratingCount = preview.ratingCount ?? 0;
  const location = preview.regions?.length
    ? preview.regions.slice(0, 3).join(" • ")
    : "";
  const hasBadges = showBadges(preview, routeType);

  const topContent = (
    <>
      <StarRating
        rating={rating}
        count={ratingCount}
        size={14}
        style={styles.starRatingRow}
        textStyle={styles.starRatingText}
      />
      <Text style={[styles.title, { color: text.primary }]} numberOfLines={2}>
        {preview.title}
      </Text>
      {location ? (
        <Text style={[styles.regions, { color: text.secondary }]} numberOfLines={2}>
          {location}
        </Text>
      ) : null}
    </>
  );

  const cardContent = (
    <View style={[styles.card, { backgroundColor: background }]}>
      <View style={styles.cardContent}>
        <View style={[styles.imageContainer, { backgroundColor: image.background }]}>
          {previewImageUri ? (
            <>
              {imageLoading && (
                <View
                  style={[
                    styles.imageLoadingOverlay,
                    { backgroundColor: image.background },
                  ]}
                >
                  <ActivityIndicator size="small" color={themeColors.loadingIndicator} />
                </View>
              )}
              <Image
                source={previewImageUri}
                style={styles.image}
                contentFit="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
              />
            </>
          ) : (
            <View
              style={[styles.noImageWrap, { backgroundColor: image.background }]}
            >
              <Image
                source={require("@/assets/images/icons/noImage.png")}
                style={[
                  styles.noImageIcon,
                  {
                    width: NO_IMAGE_ICON_SIZE,
                    height: NO_IMAGE_ICON_SIZE,
                    tintColor: image.missingIcon,
                  },
                ]}
                contentFit="contain"
              />
            </View>
          )}
        </View>
        <View style={[styles.info, !hasBadges && styles.infoCentered]}>
          {hasBadges ? (
            <>
              {topContent}
              <BadgeRow
                difficultyRating={preview.difficultyRating}
                permit={preview.permit}
                routeType={routeType}
                scale={badgeScale}
              />
            </>
          ) : (
            <View style={styles.infoCenterWrap}>{topContent}</View>
          )}
        </View>
      </View>
    </View>
  );

  if (onPress != null) {
    return (
      <Pressable onPress={() => onPress(preview)} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
        {cardContent}
      </Pressable>
    );
  }
  return cardContent;
}

function CurrentPreviewNotifier({
  loading,
  data,
  currentIndex,
  onCurrentPreviewChange,
}: {
  loading: boolean;
  data: PreviewCardData[] | null;
  currentIndex: number;
  onCurrentPreviewChange?: (preview: PreviewCardData | null) => void;
}) {
  useEffect(() => {
    if (!onCurrentPreviewChange) return;
    if (loading || !data || data.length === 0) {
      onCurrentPreviewChange(null);
    } else {
      const preview = data[currentIndex] ?? data[0];
      onCurrentPreviewChange(preview);
    }
  }, [loading, data, currentIndex, onCurrentPreviewChange]);
  return null;
}

type VisibleRouteSnapshot = { id: string; routeType: RouteType | null };

export type RoutePreviewProps = {
  /** When null, the preview slides out and unmounts after the exit animation. */
  routeId: string | null;
  /** Route type from map/list (e.g. Cave, POI) so the preview can show the correct badge. */
  routeType?: RouteType | null;
  /** Layout for bottom-docked previews (e.g. absolute + safe-area padding). */
  containerStyle?: StyleProp<ViewStyle>;
  /** Called when the currently viewed preview page changes (initial load or swipe). Use to sync mapData for TrailsLayer. */
  onCurrentPreviewChange?: (preview: PreviewCardData | null) => void;
  /** Called when the user presses the preview card. Receives the tapped preview. */
  onPreviewPress?: (preview: PreviewCardData) => void;
  /** Scale factor for difficulty badges (e.g. 0.65 for 65%). Default 0.65. */
  badgeScale?: number;
};

function RoutePreviewDataView({
  data,
  loading,
  routeType,
  badgeScale,
  onPreviewPress,
  onCurrentPreviewChange,
}: {
  data: PreviewCardData[];
  loading: boolean;
  routeType?: RouteType | null;
  badgeScale: number;
  onPreviewPress?: (preview: PreviewCardData) => void;
  onCurrentPreviewChange?: (preview: PreviewCardData | null) => void;
}) {
  const themeColors = useColorTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isSaved } = useSavedPages();

  useEffect(() => {
    setCurrentIndex(0);
  }, [data]);

  const currentPreview =
    data.length > 0
      ? data.length === 1
        ? data[0]
        : data[Math.min(currentIndex, data.length - 1)] ?? data[0]
      : null;
  const showExternalLink =
    currentPreview?.source === "ropewiki" &&
    currentPreview?.externalLink != null;

  return (
    <View style={styles.previewWrapper}>
      <CurrentPreviewNotifier
        loading={loading}
        data={data.length > 0 ? data : null}
        currentIndex={currentIndex}
        onCurrentPreviewChange={onCurrentPreviewChange}
      />
      {currentPreview != null && isSaved(currentPreview.id) && (
        <View style={styles.savedGlyphWrap} pointerEvents="none">
          <View
            style={[
              styles.savedGlyphCircle,
              {
                backgroundColor: themeColors.background,
                shadowColor: themeColors.button.shadowColor,
              },
            ]}
            pointerEvents="none"
          >
            <SavedPageGlyph isSaved />
          </View>
        </View>
      )}
      {showExternalLink && currentPreview.externalLink != null && (
          <View style={styles.externalLinkButtonWrap}>
            <ExternalLinkButton
              icon={require("@/assets/images/icons/ropewiki.png")}
              link={currentPreview.externalLink}
              accessibilityLabel="Open on RopeWiki"
            />
          </View>
        )}
      {data.length === 1 ? (
        <View style={styles.outer}>
          <SinglePreviewCard
            preview={data[0]}
            routeType={routeType}
            badgeScale={badgeScale}
            onPress={onPreviewPress ?? undefined}
          />
        </View>
      ) : (
        <View style={styles.outer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(
                e.nativeEvent.contentOffset.x / CARD_WIDTH,
              );
              setCurrentIndex(Math.min(i, data.length - 1));
            }}
            contentContainerStyle={styles.scrollContent}
          >
            {data.map((preview) => (
              <View key={preview.id} style={styles.page}>
                <SinglePreviewCard
                  preview={preview}
                  routeType={routeType}
                  badgeScale={badgeScale}
                  onPress={onPreviewPress ?? undefined}
                />
              </View>
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {data.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === currentIndex
                        ? themeColors.text.primary
                        : themeColors.placeholder,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function RoutePreviewInner({
  pipelineActive,
  routeId,
  routeType,
  badgeScale,
  onPreviewPress,
  onCurrentPreviewChange,
  data,
  errors,
  timeoutCountdown,
  onRetryRequest,
  slideWrapperStyle,
  slideMotionStyle,
}: {
  /** When false, the loader is idle; render no preview UI (collapsed shell). */
  pipelineActive: boolean;
  routeId: string;
  routeType?: RouteType | null;
  badgeScale: number;
  onPreviewPress?: (preview: PreviewCardData) => void;
  onCurrentPreviewChange?: (preview: PreviewCardData | null) => void;
  data: OnlinePagePreview[] | null;
  errors: Error | null;
  timeoutCountdown: number | null;
  onRetryRequest: () => void;
  slideWrapperStyle?: StyleProp<ViewStyle>;
  slideMotionStyle: AnimatedStyle<ViewStyle>;
}) {
  useNetworkRequestToasts({
    errors,
    timeoutCountdown,
    resetKey: routeId,
    watchOffline: false,
    errorToastKey: TOAST_KEY_ROUTE_PREVIEW_ERROR,
    errorToastTitle: "Error loading route preview",
    incrementErrorMultipleOnCollision: true,
    onRetryRequest,
  });

  if (!pipelineActive) {
    return (
      <Animated.View
        style={[
          slideWrapperStyle,
          slideMotionStyle,
          routePreviewShellStyles.idleShell,
        ]}
        pointerEvents="none"
        collapsable
      />
    );
  }

  let body: ReactElement;
  if (data == null) {
    body = <RoutePreviewPlaceholder errorMessage={errors?.message} />;
  } else if (data.length === 0) {
    body = (
      <RoutePreviewPlaceholder errorMessage="No page previews for this route" />
    );
  } else {
    body = (
      <RoutePreviewDataView
        data={data}
        loading={false}
        routeType={routeType}
        badgeScale={badgeScale}
        onPreviewPress={onPreviewPress}
        onCurrentPreviewChange={onCurrentPreviewChange}
      />
    );
  }

  return (
    <Animated.View
      style={[slideWrapperStyle, slideMotionStyle]}
      pointerEvents="box-none"
    >
      {body}
    </Animated.View>
  );
}

export function RoutePreview({
  routeId,
  routeType = null,
  containerStyle,
  onCurrentPreviewChange,
  onPreviewPress,
  badgeScale = 0.65,
}: RoutePreviewProps) {
  const { isOnline } = useNetworkStatus();
  const { height: windowHeight } = useWindowDimensions();
  const slideDistance = useMemo(
    () => Math.min(Math.round(windowHeight * 0.42), 420),
    [windowHeight],
  );

  const [visible, setVisible] = useState<VisibleRouteSnapshot | null>(null);
  const translateY = useSharedValue(slideDistance);
  const prevFocusedRef = useRef<string | null>(null);
  const exitStartedRef = useRef(false);
  const visibleRef = useRef<VisibleRouteSnapshot | null>(null);
  visibleRef.current = visible;
  const routeIdRef = useRef(routeId);
  routeIdRef.current = routeId;

  /** Runs on JS after slide-out timing; only hides if still unfocused (avoids racing a new focus). */
  const onSlideOutComplete = useCallback(() => {
    exitStartedRef.current = false;
    if (routeIdRef.current != null) {
      return;
    }
    setVisible(null);
  }, []);

  useEffect(() => {
    if (routeId != null) {
      cancelAnimation(translateY);
      exitStartedRef.current = false;
      const previous = prevFocusedRef.current;
      prevFocusedRef.current = routeId;
      setVisible({ id: routeId, routeType });

      if (previous === null) {
        translateY.value = slideDistance;
        translateY.value = withTiming(0, {
          duration: SLIDE_ENTER_MS,
          easing: slideEnterEasing,
        });
      } else {
        translateY.value = 0;
      }
      return;
    }

    prevFocusedRef.current = null;
    if (visibleRef.current == null) {
      exitStartedRef.current = false;
      return;
    }
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;
    translateY.value = withTiming(
      slideDistance,
      { duration: SLIDE_EXIT_MS, easing: slideExitEasing },
      () => {
        runOnJS(onSlideOutComplete)();
      },
    );
  }, [routeId, routeType, slideDistance, onSlideOutComplete]);

  const slideMotionStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const previewId = visible?.id ?? null;

  const [diskPreviews, setDiskPreviews] = useState<OfflinePagePreview[] | null>(
    null,
  );
  const [diskLoading, setDiskLoading] = useState(false);

  useEffect(() => {
    if (previewId == null) {
      return;
    }
    let cancelled = false;
    setDiskPreviews(null);
    setDiskLoading(true);
    void loadDownloadedRoutePreviewsForPage(previewId).then((rows) => {
      if (!cancelled) {
        setDiskPreviews(rows);
        setDiskLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [previewId]);

  const loaderOfflineData: OnlinePagePreview[] | null | undefined = (() => {
    if (previewId == null) {
      return undefined;
    }
    if (isOnline) {
      return undefined;
    }
    if (diskLoading) {
      return null;
    }
    if (diskPreviews != null && diskPreviews.length > 0) {
      return diskPreviews as unknown as OnlinePagePreview[];
    }
    return undefined;
  })();

  const pipelineActive = visible != null;
  const loaderRouteId = visible?.id ?? ROUTE_PREVIEW_LOADER_IDLE_ROUTE_ID;
  const loaderOfflinePayload: OnlinePagePreview[] | null | undefined =
    visible == null ? null : loaderOfflineData;

  return (
    <RopeGeoDataLoader<OnlinePagePreview[]>
      service={Service.WEBSCRAPER}
      method={Method.GET}
      onlinePath="/route/:routeId/preview"
      onlinePathParams={{ routeId: loaderRouteId }}
      timeoutAfterSeconds={REQUEST_TIMEOUT_SECONDS}
      isOnline={isOnline}
      offlineData={loaderOfflinePayload}
    >
      {({ data, errors, timeoutCountdown, reload }) => (
        <RoutePreviewInner
          pipelineActive={pipelineActive}
          routeId={loaderRouteId}
          routeType={visible?.routeType ?? null}
          badgeScale={badgeScale}
          onPreviewPress={onPreviewPress}
          onCurrentPreviewChange={onCurrentPreviewChange}
          data={data}
          errors={errors}
          timeoutCountdown={timeoutCountdown}
          onRetryRequest={reload}
          slideWrapperStyle={containerStyle}
          slideMotionStyle={slideMotionStyle}
        />
      )}
    </RopeGeoDataLoader>
  );
}

const routePreviewShellStyles = StyleSheet.create({
  idleShell: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
  },
});

const styles = StyleSheet.create({
  previewWrapper: {
    position: "relative",
  },
  savedGlyphWrap: {
    position: "absolute",
    top: -(SAVED_GLYPH_BUTTON_SIZE + EXTERNAL_LINK_BUTTON_GAP),
    left: CARD_MARGIN_H,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: SAVED_GLYPH_BUTTON_SIZE,
    height: SAVED_GLYPH_BUTTON_SIZE,
  },
  savedGlyphCircle: {
    width: SAVED_GLYPH_BUTTON_SIZE,
    height: SAVED_GLYPH_BUTTON_SIZE,
    borderRadius: SAVED_GLYPH_BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  externalLinkButtonWrap: {
    position: "absolute",
    top: -(48 + EXTERNAL_LINK_BUTTON_GAP),
    right: CARD_MARGIN_H,
    zIndex: 1,
  },
  outer: {
    paddingHorizontal: CARD_MARGIN_H,
    marginBottom: 8,
  },
  scrollContent: {
    paddingRight: 0,
  },
  page: {
    width: CARD_WIDTH,
    marginRight: 0,
  },
  card: {
    minHeight: PREVIEW_CARD_MIN_HEIGHT,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: "hidden",
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  cardContent: {
    flexDirection: "row",
  },
  imageContainer: {
    width: CARD_WIDTH * 0.35,
    alignSelf: "stretch",
    borderTopLeftRadius: CARD_BORDER_RADIUS,
    borderBottomLeftRadius: CARD_BORDER_RADIUS,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  noImageWrap: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageIcon: {},
  info: {
    flex: 1,
    minHeight: PREVIEW_CARD_MIN_HEIGHT,
    padding: CARD_PADDING,
    justifyContent: "flex-start",
  },
  infoCentered: {
    justifyContent: "center",
  },
  infoCenterWrap: {
    flex: 1,
    justifyContent: "center",
  },
  starRatingRow: {
    marginBottom: 4,
    gap: 2,
  },
  starRatingText: {
    marginLeft: 6,
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  regions: {
    fontSize: 12,
    marginBottom: 2,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
