import { PlaceholderBadge } from "@/components/badges/PlaceholderBadge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { usePageBadgeMetrics } from "@/utils/layout/pageBadgeLayout";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

const DESIGN_INFO_ICON_WRAP_SIZE = 18;

/** Skeleton page badge grid cell matching {@link BadgeButton} layout. */
export function PlaceholderBadgeButton() {
  const themeColors = useColorTheme();
  const {
    badgeSize,
    badgeSlotWidth,
    typeLabelCapHeight,
    iconSizeScale,
  } = usePageBadgeMetrics();

  const infoIconWrapSize = useMemo(
    () => Math.round(DESIGN_INFO_ICON_WRAP_SIZE * iconSizeScale),
    [iconSizeScale],
  );

  return (
    <View style={styles.static}>
      <View style={styles.row}>
        <View style={[styles.labelRow, { minHeight: badgeSize }]}>
          <View
            style={[
              styles.infoIconWrap,
              {
                backgroundColor: themeColors.placeholder,
                width: infoIconWrapSize,
                height: infoIconWrapSize,
                borderRadius: infoIconWrapSize / 2,
              },
            ]}
          />
          <View style={styles.labelTextWrap}>
            <View
              style={[
                styles.typeLabelPlaceholder,
                {
                  backgroundColor: themeColors.placeholder,
                  height: typeLabelCapHeight * 2,
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
    alignItems: "flex-start",
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
    flexShrink: 0,
  },
  labelTextWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  typeLabelPlaceholder: {
    width: "88%",
    borderRadius: 4,
  },
  badgeSlot: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  badgeWrap: {
    maxWidth: "100%",
    alignItems: "center",
  },
});
