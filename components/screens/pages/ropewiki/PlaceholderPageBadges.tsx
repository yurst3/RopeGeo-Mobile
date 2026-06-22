import { PlaceholderBadgeButton } from "@/components/buttons/nonstandard/PlaceholderBadgeButton";
import { BadgeLayoutProvider } from "@/components/badges/Badge";
import {
  PAGE_BADGE_CARD_PADDING,
  PAGE_BADGE_CELL_PADDING,
  PAGE_BADGE_ROW_GAP,
  usePageBadgeMetrics,
} from "@/utils/pageBadgeLayout";
import { StyleSheet, View } from "react-native";

/** Skeleton badge grid matching {@link PageBadges} layout. */
export function PlaceholderPageBadges() {
  const metrics = usePageBadgeMetrics();

  return (
    <BadgeLayoutProvider
      size={metrics.badgeSize}
      labelFontSize={metrics.badgeLabelFontSize}
      labelMaxWidth={metrics.badgeSlotWidth}
    >
      <View
        style={[
          styles.container,
          {
            width: metrics.screenWidth,
            minHeight: metrics.gridMinHeight,
          },
        ]}
      >
        <View style={[styles.row, { minHeight: metrics.rowMinHeight }]}>
          <View style={styles.cell}>
            <PlaceholderBadgeButton />
          </View>
          <View style={styles.cell}>
            <PlaceholderBadgeButton />
          </View>
        </View>
        <View style={[styles.row, { minHeight: metrics.rowMinHeight }]}>
          <View style={styles.cell}>
            <PlaceholderBadgeButton />
          </View>
          <View style={styles.cell}>
            <PlaceholderBadgeButton />
          </View>
        </View>
        <View style={[styles.row, { minHeight: metrics.rowMinHeight }]}>
          <View style={styles.cell}>
            <PlaceholderBadgeButton />
          </View>
          <View style={styles.cell}>
            <PlaceholderBadgeButton />
          </View>
        </View>
        <View style={[styles.row, { minHeight: metrics.rowMinHeight }]}>
          <View style={styles.cell}>
            <PlaceholderBadgeButton />
          </View>
          <View style={styles.cell}>
            <PlaceholderBadgeButton />
          </View>
        </View>
      </View>
    </BadgeLayoutProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: PAGE_BADGE_ROW_GAP,
    marginTop: 16,
    marginLeft: -PAGE_BADGE_CARD_PADDING,
    marginRight: -PAGE_BADGE_CARD_PADDING,
  },
  row: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  cell: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: PAGE_BADGE_CELL_PADDING,
    alignItems: "stretch",
    overflow: "hidden",
  },
});
