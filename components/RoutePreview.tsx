import {
  Method,
  RopeGeoHttpRequest,
  Service,
} from "@/components/RopeGeoHttpRequest";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  useRef,
  useState,
  useEffect,
} from "react";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ExtremeRiskBadge } from "@/components/badges/difficulty/ExtremeRiskBadge";
import { VeryHighRiskBadge } from "@/components/badges/difficulty/VeryHighRiskBadge";
import { FlowingWaterBadge } from "@/components/badges/difficulty/FlowingWaterBadge";
import { FullDayBadge } from "@/components/badges/difficulty/FullDayBadge";
import { HalfDayBadge } from "@/components/badges/difficulty/HalfDayBadge";
import { HighRiskBadge } from "@/components/badges/difficulty/HighRiskBadge";
import { LongDayBadge } from "@/components/badges/difficulty/LongDayBadge";
import { MinimalWaterBadge } from "@/components/badges/difficulty/MinimalWaterBadge";
import { ModerateRiskBadge } from "@/components/badges/difficulty/ModerateRiskBadge";
import { MultipleDaysBadge } from "@/components/badges/difficulty/MultipleDaysBadge";
import { MinimalRiskBadge } from "@/components/badges/difficulty/MinimalRiskBadge";
import { NotTechnicalBadge } from "@/components/badges/difficulty/NotTechnicalBadge";
import { OvernightBadge } from "@/components/badges/difficulty/OvernightBadge";
import { ScramblingBadge } from "@/components/badges/difficulty/ScramblingBadge";
import { ShortBadge } from "@/components/badges/difficulty/ShortBadge";
import { SomeRiskBadge } from "@/components/badges/difficulty/SomeRiskBadge";
import { SwimmingWaterBadge } from "@/components/badges/difficulty/SwimmingWaterBadge";
import { TechnicalBadge } from "@/components/badges/difficulty/TechnicalBadge";
import { VeryTechnicalBadge } from "@/components/badges/difficulty/VeryTechnicalBadge";
import { ClosedBadge } from "@/components/badges/permit/ClosedBadge";
import { NoPermitBadge } from "@/components/badges/permit/NoPermitBadge";
import { PermitRequiredBadge } from "@/components/badges/permit/PermitRequiredBadge";
import { RestrictedBadge } from "@/components/badges/permit/RestrictedBadge";
import { ExternalLinkButton } from "@/components/buttons/ExternalLinkButton";
import {
  type Difficulty,
  DifficultyRisk,
  DifficultyTechnical,
  DifficultyTime,
  DifficultyWater,
  type PagePreview,
  PermitStatus,
} from "ropegeo-common";

/** PagePreview with optional permit (when supported by API). */
type PagePreviewWithPermit = PagePreview & { permit?: PermitStatus | null };

const CARD_BORDER_RADIUS = 12;
const CARD_PADDING = 12;
const IMAGE_ASPECT = 3 / 4;
const STAR_SIZE = 14;
const EXTERNAL_LINK_BUTTON_GAP = 8;
/** Minimum height so loading and loaded preview cards stay the same size. */
const PREVIEW_CARD_MIN_HEIGHT = 140;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN_H = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN_H * 2;

const TECHNICAL_BADGES: Record<DifficultyTechnical, React.ComponentType> = {
  [DifficultyTechnical.One]: NotTechnicalBadge,
  [DifficultyTechnical.Two]: ScramblingBadge,
  [DifficultyTechnical.Three]: TechnicalBadge,
  [DifficultyTechnical.Four]: VeryTechnicalBadge,
};
const WATER_BADGES: Record<DifficultyWater, React.ComponentType> = {
  [DifficultyWater.A]: MinimalWaterBadge,
  [DifficultyWater.B]: SwimmingWaterBadge,
  [DifficultyWater.C]: FlowingWaterBadge,
  [DifficultyWater.C1]: FlowingWaterBadge,
  [DifficultyWater.C2]: FlowingWaterBadge,
  [DifficultyWater.C3]: FlowingWaterBadge,
  [DifficultyWater.C4]: FlowingWaterBadge,
};
const TIME_BADGES: Record<DifficultyTime, React.ComponentType> = {
  [DifficultyTime.I]: ShortBadge,
  [DifficultyTime.II]: HalfDayBadge,
  [DifficultyTime.III]: FullDayBadge,
  [DifficultyTime.IV]: LongDayBadge,
  [DifficultyTime.V]: OvernightBadge,
  [DifficultyTime.VI]: MultipleDaysBadge,
};
const RISK_BADGES: Record<DifficultyRisk, React.ComponentType> = {
  [DifficultyRisk.G]: MinimalRiskBadge,
  [DifficultyRisk.PG]: SomeRiskBadge,
  [DifficultyRisk.PG13]: ModerateRiskBadge,
  [DifficultyRisk.R]: HighRiskBadge,
  [DifficultyRisk.X]: VeryHighRiskBadge,
  [DifficultyRisk.XX]: ExtremeRiskBadge,
};

const PERMIT_BADGES: Record<PermitStatus, React.ComponentType<{ showLabel?: boolean }>> = {
  [PermitStatus.No]: NoPermitBadge,
  [PermitStatus.Yes]: PermitRequiredBadge,
  [PermitStatus.Restricted]: RestrictedBadge,
  [PermitStatus.Closed]: ClosedBadge,
};

function Badges({
  difficulty,
  permit = null,
  scale = 1,
}: {
  difficulty: Difficulty;
  permit?: PermitStatus | null;
  scale?: number;
}) {
  const badges: React.ReactNode[] = [];
  if (difficulty.technical != null) {
    const C = TECHNICAL_BADGES[difficulty.technical];
    if (C) badges.push(React.createElement(C, { key: "technical" }));
  }
  if (difficulty.water != null) {
    const C = WATER_BADGES[difficulty.water];
    if (C) badges.push(React.createElement(C, { key: "water" }));
  }
  if (difficulty.time != null) {
    const C = TIME_BADGES[difficulty.time];
    if (C) badges.push(React.createElement(C, { key: "time" }));
  }
  if (difficulty.risk != null) {
    const C = RISK_BADGES[difficulty.risk];
    if (C) badges.push(React.createElement(C, { key: "risk" }));
  }
  if (permit != null && PERMIT_BADGES[permit] != null) {
    badges.push(React.createElement(PERMIT_BADGES[permit], { key: "permit" }));
  }
  if (badges.length === 0) return null;
  return (
    <View
      style={[
        styles.difficultyBadgesRow,
        { transform: [{ scale }], transformOrigin: "left center" },
      ]}
    >
      {badges}
    </View>
  );
}

function hasDifficultyInfo(difficulty: Difficulty): boolean {
  return (
    difficulty.technical != null ||
    difficulty.water != null ||
    difficulty.time != null ||
    difficulty.risk != null
  );
}

function hasPermitOrDifficulty(preview: PagePreviewWithPermit): boolean {
  return preview.permit != null || hasDifficultyInfo(preview.difficulty);
}

function StarRating({
  rating,
  count,
}: {
  rating: number;
  count: number;
}) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const fill = Math.min(1, Math.max(0, rating - i));
    return (
      <View key={i} style={styles.starCell}>
        <FontAwesome5 name="star" size={STAR_SIZE} color="#999" />
        <View
          style={[styles.starFillClip, { width: `${fill * 100}%` }]}
          pointerEvents="none"
        >
          <FontAwesome5 name="star" size={STAR_SIZE} color="#333" solid />
        </View>
      </View>
    );
  });
  return (
    <View style={styles.starRow}>
      {stars}
      <Text style={styles.ratingText}>
        {rating.toFixed(1)} ({count})
      </Text>
    </View>
  );
}

function SinglePreviewCard({
  preview,
  badgeScale = 0.65,
  onPress,
}: {
  preview: PagePreviewWithPermit;
  badgeScale?: number;
  onPress?: (preview: PagePreviewWithPermit) => void;
}) {
  const [imageLoading, setImageLoading] = useState(!!preview.imageUrl);
  const rating = preview.rating ?? 0;
  const ratingCount = preview.ratingCount ?? 0;
  const location = preview.regions?.length
    ? preview.regions.slice(0, 3).join(" • ")
    : "";
  const hasDifficulty = hasDifficultyInfo(preview.difficulty);
  const hasBadges = hasPermitOrDifficulty(preview);

  const topContent = (
    <>
      <StarRating rating={rating} count={ratingCount} />
      <Text style={styles.title} numberOfLines={2}>
        {preview.title}
      </Text>
      {location ? (
        <Text style={styles.regions} numberOfLines={2}>
          {location}
        </Text>
      ) : null}
    </>
  );

  const cardContent = (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          {preview.imageUrl ? (
            <>
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color="#666" />
                </View>
              )}
              <Image
                source={{ uri: preview.imageUrl }}
                style={styles.image}
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
              />
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <FontAwesome5 name="route" size={40} color="#999" />
            </View>
          )}
        </View>
        <View style={[styles.info, !hasBadges && styles.infoCentered]}>
          {hasBadges ? (
            <>
              {topContent}
              <Badges
                difficulty={preview.difficulty}
                permit={preview.permit}
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
  data: PagePreview[] | null;
  currentIndex: number;
  onCurrentPreviewChange?: (preview: PagePreview | null) => void;
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

type RoutePreviewProps = {
  routeId: string;
  /** Called when the currently viewed preview page changes (initial load or swipe). Use to sync mapData for TrailsLayer. */
  onCurrentPreviewChange?: (preview: PagePreview | null) => void;
  /** Called when the user presses the preview card. Receives the effective risk for the tapped preview. */
  onPreviewPress?: (effectiveRisk: DifficultyRisk | null) => void;
  /** Scale factor for difficulty badges (e.g. 0.65 for 65%). Default 0.65. */
  badgeScale?: number;
};

export function RoutePreview({ routeId, onCurrentPreviewChange, onPreviewPress, badgeScale = 0.65 }: RoutePreviewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <RopeGeoHttpRequest<PagePreview[]>
      service={Service.WEBSCRAPER}
      method={Method.GET}
      path="/route/:routeId/preview"
      pathParams={{ routeId }}
    >
      {({ loading, data, errors }) => {
        const currentPreview =
          data && data.length > 0
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
              loading={!!loading}
              data={data ?? null}
              currentIndex={currentIndex}
              onCurrentPreviewChange={onCurrentPreviewChange}
            />
            {showExternalLink && currentPreview.externalLink != null && (
              <View style={styles.externalLinkButtonWrap}>
                <ExternalLinkButton
                  icon={require("@/assets/images/ropewiki.png")}
                  link={currentPreview.externalLink}
                  accessibilityLabel="Open on RopeWiki"
                />
              </View>
            )}
            {loading ? (
            <View style={styles.outer}>
              <View style={[styles.card, styles.placeholderCard]}>
                <ActivityIndicator size="large" color="#666" />
                <Text style={[styles.placeholderText, styles.loadingText]}>
                  Loading preview…
                </Text>
              </View>
            </View>
          ) : errors ? (
            <View style={styles.outer}>
              <View style={[styles.card, styles.placeholderCard]}>
                <Text style={styles.errorText}>{errors.message}</Text>
              </View>
            </View>
          ) : !data || data.length === 0 ? (
            <View style={styles.outer}>
              <View style={[styles.card, styles.placeholderCard]}>
                <Text style={styles.placeholderText}>No preview available</Text>
              </View>
            </View>
          ) : data.length === 1 ? (
            <View style={styles.outer}>
              <SinglePreviewCard
                preview={data[0]}
                badgeScale={badgeScale}
                onPress={onPreviewPress != null ? (p) => onPreviewPress(p.difficulty.risk) : undefined}
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
                    e.nativeEvent.contentOffset.x / CARD_WIDTH
                  );
                  setCurrentIndex(Math.min(i, data.length - 1));
                }}
                contentContainerStyle={styles.scrollContent}
              >
                {data.map((preview) => (
                  <View key={preview.id} style={styles.page}>
                    <SinglePreviewCard
                      preview={preview}
                      badgeScale={badgeScale}
                      onPress={onPreviewPress != null ? (p) => onPreviewPress(p.difficulty.risk) : undefined}
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
                      i === currentIndex ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
          </View>
        );
      }}
    </RopeGeoHttpRequest>
  );
}

const styles = StyleSheet.create({
  previewWrapper: {
    position: "relative",
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
    backgroundColor: "#fff",
    borderRadius: CARD_BORDER_RADIUS,
    overflow: "hidden",
  },
  placeholderCard: {
    justifyContent: "center",
    alignItems: "center",
    padding: CARD_PADDING,
  },
  placeholderText: {
    color: "#666",
    fontSize: 14,
  },
  loadingText: {
    marginTop: 8,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  errorText: {
    color: "#c00",
    fontSize: 14,
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
    backgroundColor: "#eee",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
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
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 2,
  },
  starCell: {
    width: STAR_SIZE,
    height: STAR_SIZE,
    position: "relative",
  },
  starFillClip: {
    position: "absolute",
    left: 0,
    top: 0,
    height: STAR_SIZE,
    overflow: "hidden",
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#333",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 2,
  },
  regions: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  difficultyBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
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
  dotActive: {
    backgroundColor: "#333",
  },
  dotInactive: {
    backgroundColor: "#ccc",
  },
});
