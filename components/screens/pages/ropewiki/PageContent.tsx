import { BetaSection } from "@/components/betaSection/BetaSection";
import { minimapStyles } from "@/components/minimap/shared/minimapShared";
import { RegionLinks } from "@/components/RegionLinks";
import { RappelInfoRow } from "@/components/RappelInfoRow";
import { StarRating } from "@/components/StarRating";
import { ElevationGains } from "./ElevationGains";
import { Lengths } from "./Lengths";
import { PageBadges } from "./PageBadges";
import { TimeEstimates } from "./TimeEstimates";
import React from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import {
  AcaDifficulty,
  type OfflineRopewikiPageView,
  PageDataSource,
  type OnlineRopewikiPageView,
  RouteType,
} from "ropegeo-common/models";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const CARD_BORDER_RADIUS = 24;

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

export type PageContentProps = {
  /** Current ropewiki page id (for region links return-to-saved behavior). */
  pageId: string;
  data: OnlineRopewikiPageView | OfflineRopewikiPageView;
  routeTypeResolved: RouteType;
  insets: { top: number; bottom: number };
  paddingTop: number;
  mapExpanded: boolean;
  onScroll: NonNullable<React.ComponentProps<typeof AnimatedScrollView>["onScroll"]>;
  onScrollEndDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onCardHeightLayout: (height: number) => void;
  miniMapGateRef: React.RefObject<View | null>;
  /** Gate placeholder in the scroll card; parent decides from API + offline minimap. */
  showMiniMapPlaceholder: boolean;
  onMiniMapLayout: (width: number, height: number) => void;
  checkMiniMapInView: () => void;
};

/**
 * Scrollable card and body over the parallax banner — same role as `RegionContent`.
 */
export function PageContent({
  pageId,
  data,
  routeTypeResolved,
  insets,
  paddingTop,
  mapExpanded,
  onScroll,
  onScrollEndDrag,
  onMomentumScrollEnd,
  onCardHeightLayout,
  miniMapGateRef,
  showMiniMapPlaceholder,
  onMiniMapLayout,
  checkMiniMapInView,
}: PageContentProps) {
  const displayRegions =
    (data.regions?.length ?? 0) > 0 ? (data.regions ?? []).slice(0, -1) : [];
  const rating = data.quality ?? 0;
  const ratingCount = data.userVotes ?? 0;
  const technicalRating =
    data.difficulty instanceof AcaDifficulty ? data.difficulty.technical : null;
  const rappelCount = data.rappelCount ?? null;
  const longestRappel = data.rappelLongest ?? null;
  const jumps = data.jumps ?? null;
  return (
    <AnimatedScrollView
      style={styles.scrollView}
      contentContainerStyle={{
        paddingTop,
        paddingBottom: 0,
        flexGrow: 1,
      }}
      pointerEvents={mapExpanded ? "none" : "auto"}
      onScroll={onScroll}
      scrollEventThrottle={16}
      scrollEnabled={!mapExpanded}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollEnd={onMomentumScrollEnd}
    >
      <View
        style={[styles.cardWrapper, { marginTop: -CARD_BORDER_RADIUS }]}
        onLayout={(e) => onCardHeightLayout(e.nativeEvent.layout.height)}
      >
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
              pageId={pageId}
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
            <PageBadges data={data} routeType={routeTypeResolved} />
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
            {showMiniMapPlaceholder ? (
              <View
                ref={miniMapGateRef}
                collapsable={false}
                style={styles.miniMapWrap}
                onLayout={(e) => {
                  const { width, height } = e.nativeEvent.layout;
                  onMiniMapLayout(width, height);
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
                <BetaSection
                  key={section.order}
                  section={section}
                  pageTitle={data.name}
                />
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
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
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
