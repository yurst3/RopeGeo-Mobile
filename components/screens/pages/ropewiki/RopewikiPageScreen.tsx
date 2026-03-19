import { BackButton } from "@/components/buttons/BackButton";
import { ExternalLinkButton } from "@/components/buttons/ExternalLinkButton";
import { RegionLinks } from "@/components/RegionLinks";
import { RappelInfoRow } from "@/components/RappelInfoRow";
import { StarRating } from "@/components/StarRating";
import {
  Method,
  RopeGeoHttpRequest,
  Service,
} from "@/components/RopeGeoHttpRequest";
import { ElevationGains } from "./ElevationGains";
import { Lengths } from "./Lengths";
import { minimapStyles } from "@/components/minimap/minimapShared";
import { PageMiniMap } from "./PageMiniMap";
import { PageBadges } from "./PageBadges";
import { BetaSection } from "../../../betaSection/BetaSection";
import { TimeEstimates } from "./TimeEstimates";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { MiniMapType, PageDataSource, type PageMiniMap as PageMiniMapConfig, type RopewikiPageView } from "ropegeo-common";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STARTING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.5);
/** Max banner height at scroll 0; shrinks as user scrolls, never below BANNER_HEIGHT (keeps width ≥ screen). */
const BANNER_HEIGHT_MAX = SCREEN_HEIGHT;
/** Fallback when image dimensions are not yet available (e.g. no image or before load). */
const FALLBACK_BANNER_ASPECT_RATIO = SCREEN_WIDTH / STARTING_HEIGHT;
const CARD_BORDER_RADIUS = 24;


export type RopewikiPageScreenProps = {
  pageId: string;
  /** Route type for badge display (e.g. "Canyon", "Cave", "POI"). */
  routeType?: string | null;
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

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

function formatLastUpdated(revisionDate: Date | string): string {
  const date =
    typeof revisionDate === "string" ? new Date(revisionDate) : revisionDate;
  if (Number.isNaN(date.getTime())) return "";
  const formatted = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let ago: string;
  if (diffDays >= 365) {
    const years = Math.floor(diffDays / 365);
    const days = diffDays % 365;
    const yearLabel = years === 1 ? "year" : "years";
    ago =
      days === 0
        ? `${years} ${yearLabel} ago`
        : `${years} ${yearLabel} and ${days} days ago`;
  } else {
    ago = diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  }
  return `Last updated on: ${formatted} (${ago})`;
}

function PageContent({
  pageId,
  data,
  routeType,
}: {
  pageId: string;
  data: RopewikiPageView;
  routeType?: string | null;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [bannerAspectRatio, setBannerAspectRatio] = useState<number | null>(null);
  const [bannerImageLoading, setBannerImageLoading] = useState(true);
  const bannerUrl = data.bannerImage?.url ?? null;
  const displayRegions = (data.regions?.length ?? 0) > 0
    ? (data.regions ?? []).slice(0, -1)
    : [];

  const scrollY = useSharedValue(0);
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

  const hasMiniMap = data.miniMap != null;

  useEffect(() => {
    miniMapUnlockedRef.current = false;
    setMountMiniMapNative(false);
    setMiniMapAnchorRect(null);
  }, [pageId]);

  const checkMiniMapInView = useCallback(() => {
    if (!hasMiniMap) return;
    const node = miniMapGateRef.current;
    if (node == null) return;
    node.measureInWindow((x, y, width, h) => {
      setMiniMapAnchorRect({ x, y, width, height: h });
      baseScrollYRef.current = scrollY.value;
      const winH = Dimensions.get("window").height;
      const visTop = insets.top + 8;
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

  const openPageFullMap = useCallback(() => {
    setMapMode("expanded");
  }, []);

  const closePageFullMap = useCallback(() => {
    setMapMode("collapsed");
  }, []);

  useEffect(() => {
    if (mapMode !== "expanded") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setMapMode("collapsed");
      return true;
    });
    return () => sub.remove();
  }, [mapMode]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
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

  const rating = data.quality ?? 0;
  const ratingCount = data.userVotes ?? 0;
  const technicalRating = data.difficulty?.technical ?? null;
  const rappelCount = data.rappelCount ?? null;
  const longestRappel = data.rappelLongest ?? null;
  const jumps = data.jumps ?? null;

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

  return (
    <View style={styles.container}>
      {/* Parallax banner: height shrinks with scroll (Reanimated) */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.bannerWrap, bannerAnimatedStyle]}
      >
        {bannerUrl ? (
          <>
            <Image
              source={bannerUrl}
              style={styles.bannerImage}
              contentFit="contain"
              onLoadEnd={() => setBannerImageLoading(false)}
            />
            {bannerImageLoading && (
              <View style={[StyleSheet.absoluteFill, styles.bannerLoadingOverlay]}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </>
        ) : (
          <View style={styles.bannerNoImageWrap}>
            <Image
              source={require("@/assets/images/noImage.png")}
              style={styles.bannerNoImageIcon}
              contentFit="contain"
            />
          </View>
        )}
      </Animated.View>

      <AnimatedScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop,
          paddingBottom: 0,
          flexGrow: 1,
        }}
        pointerEvents={mapMode === "expanded" ? "none" : "auto"}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        scrollEnabled={mapMode !== "expanded"}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        onScrollEndDrag={checkMiniMapInView}
        onMomentumScrollEnd={checkMiniMapInView}
      >
        {/* Card wrapper: button floats above card, card overlaps banner */}
        <View
          style={[
            styles.cardWrapper,
            { marginTop: -CARD_BORDER_RADIUS },
          ]}
          onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
        >
          <View
            style={[
              styles.externalLinkWrap,
              { top: -64, left: 16 },
            ]}
          >
            <ExternalLinkButton
              icon={require("@/assets/images/ropewiki.png")}
              link={data.url}
              accessibilityLabel="Open on RopeWiki"
            />
          </View>
          <View style={styles.cardWrap}>
            <View
              style={[
                styles.cardInner,
                {
                  paddingTop: 20,
                  paddingBottom: insets.bottom + 16,
                },
              ]}
            >
              <Text style={styles.title}>{data.name}</Text>
            {data.aka != null && data.aka.length > 0 ? (
              <Text style={styles.aka}>
                <Text style={styles.akaLabel}>AKA: </Text>
                {data.aka.join(", ")}
              </Text>
            ) : null}
            <RegionLinks
              source={PageDataSource.Ropewiki}
              regions={displayRegions}
              containerStyle={data.aka?.length ? styles.regionsAfterAka : undefined}
              numberOfLines={2}
            />
            <StarRating
                rating={rating}
                count={ratingCount}
                style={styles.starRatingRow}
              />
            <RappelInfoRow
                rappelCount={rappelCount}
                longestRappel={longestRappel}
                jumps={jumps}
                technicalRating={
                  technicalRating != null ? Number(technicalRating) : null
                }
              />
            <PageBadges data={data} routeType={routeType} />
            <TimeEstimates
                overallTime={data.overallTime}
                approachTime={data.approachTime}
                descentTime={data.descentTime}
                exitTime={data.exitTime}
                shuttleTime={data.shuttleTime}
              />
            <Lengths
                overallLength={data.overallLength}
                approachLength={data.approachLength}
                descentLength={data.descentLength}
                exitLength={data.exitLength}
              />
            <ElevationGains
                approachElevGain={data.approachElevGain}
                descentElevGain={data.descentElevGain}
                exitElevGain={data.exitElevGain}
              />
            {hasMiniMap ? (
              <View
                ref={miniMapGateRef}
                collapsable={false}
                style={styles.miniMapWrap}
                onLayout={(e) => {
                  const { width, height } = e.nativeEvent.layout;
                  setMiniMapAnchorRect((prev) =>
                    prev == null
                      ? { x: 0, y: 0, width, height }
                      : { ...prev, width, height }
                  );
                  requestAnimationFrame(() => checkMiniMapInView());
                }}
              >
                <View style={minimapStyles.wrapper} />
              </View>
            ) : null}
            {(data.betaSections ?? [])
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <BetaSection key={section.order} section={section} />
              ))}
            {data.latestRevisionDate != null ? (
              <Text style={styles.lastUpdated}>
                {formatLastUpdated(data.latestRevisionDate)}
              </Text>
            ) : null}
            </View>
          </View>
        </View>
      </AnimatedScrollView>

      {mapMode !== "expanded" && (
        <BackButton onPress={() => router.back()} top={insets.top + 8} />
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
              <BackButton onPress={() => router.back()} top={insets.top + 8} />
            </View>
          );
        }
        if (data == null) {
          return null;
        }
        return (
          <PageContent pageId={pageId} data={data} routeType={routeType} />
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
  scrollView: {
    flex: 1,
    zIndex: 1000,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  bannerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
    zIndex: 0,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
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
  bannerLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  externalLinkWrap: {
    position: "absolute",
  },
  /** Wrapper so external link can float above card without being clipped. */
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
  aka: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
    marginLeft: 8,
  },
  akaLabel: {
    fontWeight: "700",
  },
  regionsAfterAka: {
    marginTop: 4,
  },
  starRatingRow: {
    alignSelf: "center",
  },
  miniMapWrap: {
    marginTop: 16,
    marginBottom: 0,
  },
  lastUpdated: {
    marginTop: 24,
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
  },
});
