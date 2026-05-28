import { PlaceholderBadge } from "@/components/badges/PlaceholderBadge";
import {
  BADGE_BUTTON_BADGE_WIDTH,
  BADGE_BUTTON_LABEL_WIDTH,
} from "@/components/buttons/nonstandard/BadgeButton";
import { useColorTheme } from "@/context/ColorThemeContext";
import { StyleSheet, View } from "react-native";

const INFO_ICON_WRAP_SIZE = 18;
/** Matches {@link Badge} default size used by page badges with labels. */
const PAGE_BADGE_SIZE = 56;

/** Skeleton page badge grid cell matching {@link BadgeButton} layout. */
export function PlaceholderBadgeButton() {
  const themeColors = useColorTheme();

  return (
    <View style={styles.static}>
      <View style={styles.row}>
        <View style={[styles.labelRow, { width: BADGE_BUTTON_LABEL_WIDTH }]}>
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
                { backgroundColor: themeColors.placeholder },
              ]}
            />
          </View>
        </View>
        <View style={[styles.badgeSlot, { width: BADGE_BUTTON_BADGE_WIDTH }]}>
          <View style={styles.badgeWrap}>
            <PlaceholderBadge size={PAGE_BADGE_SIZE} label />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  static: {
    flex: 1,
    minHeight: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    flex: 1,
    minHeight: 0,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  infoIconWrap: {
    width: INFO_ICON_WRAP_SIZE,
    height: INFO_ICON_WRAP_SIZE,
    borderRadius: INFO_ICON_WRAP_SIZE / 2,
  },
  labelTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  typeLabelPlaceholder: {
    height: 13,
    width: "88%",
    borderRadius: 4,
  },
  badgeSlot: {
    flexShrink: 0,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeWrap: {
    maxWidth: "100%",
  },
});
