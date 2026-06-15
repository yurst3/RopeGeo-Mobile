import { PlaceholderBadge } from "@/components/badges/PlaceholderBadge";
import { useColorTheme } from "@/context/ColorThemeContext";
import { usePageBadgeMetrics } from "@/utils/pageBadgeLayout";
import { StyleSheet, View } from "react-native";

const INFO_ICON_WRAP_SIZE = 18;

/** Skeleton page badge grid cell matching {@link BadgeButton} layout. */
export function PlaceholderBadgeButton() {
  const themeColors = useColorTheme();
  const { badgeSize, badgeSlotWidth, typeLabelFontSize } = usePageBadgeMetrics();

  return (
    <View style={styles.static}>
      <View style={styles.row}>
        <View style={styles.labelRow}>
          <View
            style={[
              styles.infoIconWrap,
              { backgroundColor: themeColors.placeholder },
            ]}
          />
          <View style={styles.labelTextWrap}>
            <View
              style={[
                styles.typeLabelPlaceholder,
                {
                  backgroundColor: themeColors.placeholder,
                  height: typeLabelFontSize,
                },
              ]}
            />
          </View>
        </View>
        <View style={[styles.badgeSlot, { width: badgeSlotWidth }]}>
          <View style={styles.badgeWrap}>
            <PlaceholderBadge size={badgeSize} label />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  static: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    gap: 4,
  },
  labelRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  infoIconWrap: {
    width: INFO_ICON_WRAP_SIZE,
    height: INFO_ICON_WRAP_SIZE,
    borderRadius: INFO_ICON_WRAP_SIZE / 2,
    flexShrink: 0,
  },
  labelTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  typeLabelPlaceholder: {
    width: "88%",
    borderRadius: 4,
  },
  badgeSlot: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWrap: {
    maxWidth: "100%",
    alignItems: "center",
  },
});
