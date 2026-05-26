import { PlaceholderBadge } from "@/components/badges/PlaceholderBadge";
import { StarRating } from "@/components/StarRating";
import { useColorTheme } from "@/context/ColorThemeContext";
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
  const themeColors = useColorTheme();
  const { text, image, background, placeholder, loadingIndicator } = themeColors;
  const isError = errorMessage != null && errorMessage !== "";

  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.card,
          { overflow: "hidden", backgroundColor: background },
        ]}
      >
        <View style={styles.cardContent}>
          <View
            style={[
              styles.imageContainer,
              styles.placeholderImageSlot,
              { backgroundColor: image.background },
            ]}
          >
            {!isError ? (
              <View
                style={[
                  styles.imageLoadingOverlay,
                  { backgroundColor: image.background },
                ]}
              >
                <ActivityIndicator size="small" color={loadingIndicator} />
              </View>
            ) : null}
          </View>
          <View style={[styles.info, styles.infoCentered]}>
            <StarRating
              rating={0}
              count={0}
              size={14}
              placeholderColor
              style={styles.starRatingRow}
              textStyle={styles.starRatingText}
            />
            {isError ? (
              <Text
                style={[styles.errorMessage, { color: text.error }]}
                numberOfLines={4}
              >
                {errorMessage}
              </Text>
            ) : (
              <View
                style={[styles.titlePlaceholder, { backgroundColor: placeholder }]}
              />
            )}
            <View style={styles.regionPlaceholderRow}>
              <View
                style={[styles.regionBar, { width: "40%", backgroundColor: placeholder }]}
              />
              <Text style={[styles.regionDot, { color: text.tertiary }]}> • </Text>
              <View
                style={[styles.regionBar, { width: "40%", backgroundColor: placeholder }]}
              />
            </View>
            <View style={styles.regionPlaceholderRow}>
              <View
                style={[styles.regionBar, { width: "30%", backgroundColor: placeholder }]}
              />
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
  },
  placeholderImageSlot: {
    minHeight: PREVIEW_CARD_MIN_HEIGHT,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  },
  titlePlaceholder: {
    height: 16,
    width: "66%",
    alignSelf: "flex-start",
    borderRadius: 4,
    marginBottom: 8,
  },
  errorMessage: {
    alignSelf: "stretch",
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
  },
  regionDot: {
    fontSize: 10,
  },
  badgePlaceholderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
    alignItems: "center",
  },
});
