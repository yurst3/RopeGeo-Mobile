import { PlaceholderBadge } from "@/components/badges/PlaceholderBadge";
import { StarRating } from "@/components/StarRating";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";

const CARD_BORDER_RADIUS = 12;
const CARD_PADDING = 12;
/** Keep in sync with RoutePreview card metrics. */
const PREVIEW_CARD_MIN_HEIGHT = 140;
const CARD_MARGIN_H = 16;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN_H * 2;

export type RoutePreviewPlaceholderProps = {
  /** When set, shown instead of the title skeleton bar (loading vs error, like Ropewiki placeholders). */
  errorMessage?: string;
};

export function RoutePreviewPlaceholder({
  errorMessage,
}: RoutePreviewPlaceholderProps) {
  const isError = errorMessage != null && errorMessage !== "";

  return (
    <View style={styles.outer}>
      <View style={[styles.card, { overflow: "hidden" }]}>
        <View style={styles.cardContent}>
          <View style={[styles.imageContainer, styles.placeholderImageSlot]}>
            {!isError ? (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color="#666" />
              </View>
            ) : null}
          </View>
          <View style={[styles.info, styles.infoCentered]}>
            <StarRating
              rating={0}
              count={0}
              size={14}
              emptyStarColor="#999"
              style={styles.starRatingRow}
              textStyle={styles.starRatingText}
            />
            {isError ? (
              <Text style={styles.errorMessage} numberOfLines={4}>
                {errorMessage}
              </Text>
            ) : (
              <View style={styles.titlePlaceholder} />
            )}
            <View style={styles.regionPlaceholderRow}>
              <View style={[styles.regionBar, { width: "40%" }]} />
              <Text style={styles.regionDot}> • </Text>
              <View style={[styles.regionBar, { width: "40%" }]} />
            </View>
            <View style={styles.regionPlaceholderRow}>
              <View style={[styles.regionBar, { width: "30%" }]} />
            </View>
            <View style={styles.badgePlaceholderRow}>
              {[0, 1, 2, 3, 4].map((i) => (
                <PlaceholderBadge key={i} size={32} />
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: CARD_MARGIN_H,
    marginBottom: 8,
  },
  card: {
    minHeight: PREVIEW_CARD_MIN_HEIGHT,
    backgroundColor: "#fff",
    borderRadius: CARD_BORDER_RADIUS,
    overflow: "hidden",
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
  placeholderImageSlot: {
    backgroundColor: "#e5e7eb",
    minHeight: PREVIEW_CARD_MIN_HEIGHT,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
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
  starRatingRow: {
    marginBottom: 4,
    gap: 2,
  },
  starRatingText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#333",
  },
  titlePlaceholder: {
    height: 16,
    width: "66%",
    alignSelf: "flex-start",
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
    marginBottom: 8,
  },
  errorMessage: {
    alignSelf: "stretch",
    color: "#dc2626",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  regionPlaceholderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  regionBar: {
    height: 10,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
  },
  regionDot: {
    fontSize: 10,
    color: "#ccc",
  },
  badgePlaceholderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
    alignItems: "center",
  },
});
