import { BADGE_BUTTON_KEY } from "@/constants/buttons";
import type { BadgeButtonColors } from "@/constants/colors/types";
import { useColorTheme } from "@/context/ColorThemeContext";
import { usePageBadgeMetrics } from "@/utils/pageBadgeLayout";
import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const INFO_ICON = require("@/assets/images/icons/buttons/info.png");

const INFO_ICON_WRAP_SIZE = 18;
const INFO_ICON_IMAGE_SIZE = 12;

export type BadgeButtonProps = {
  badge: ReactNode;
  badgeTypeLabel: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/**
 * Page badge grid cell: optional info affordance + type label + badge.
 * When {@link onPress} is set, the whole row is pressable and shows the info icon.
 */
export function BadgeButton({
  badge,
  badgeTypeLabel,
  onPress,
  accessibilityLabel,
}: BadgeButtonProps) {
  const themeColors = useColorTheme();
  const { badgeSlotWidth, typeLabelFontSize } = usePageBadgeMetrics();
  const { infoIconBackground, infoIcon } =
    themeColors.button.nonstandard[BADGE_BUTTON_KEY] as BadgeButtonColors;

  const content = (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        {onPress != null ? (
          <View style={[styles.infoIconWrap, { backgroundColor: infoIconBackground }]}>
            <Image
              source={INFO_ICON}
              style={{
                width: INFO_ICON_IMAGE_SIZE,
                height: INFO_ICON_IMAGE_SIZE,
                tintColor: infoIcon,
              }}
              contentFit="contain"
            />
          </View>
        ) : null}
        <View style={styles.labelTextWrap}>
          <Text
            style={[
              styles.typeLabel,
              {
                color: themeColors.text.secondary,
                fontSize: typeLabelFontSize,
              },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {badgeTypeLabel}
          </Text>
        </View>
      </View>
      <View style={[styles.badgeSlot, { width: badgeSlotWidth }]}>
        <View style={styles.badgeWrap}>{badge}</View>
      </View>
    </View>
  );

  if (onPress != null) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? badgeTypeLabel}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.static}>{content}</View>;
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  pressed: {
    opacity: 0.88,
  },
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
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  labelTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  typeLabel: {
    fontWeight: "500",
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
