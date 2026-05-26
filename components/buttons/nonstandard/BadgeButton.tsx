import { BADGE_BUTTON_KEY } from "@/constants/buttons";
import type { BadgeButtonColors } from "@/constants/colors/types";
import { useColorTheme } from "@/context/ColorThemeContext";
import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const INFO_ICON = require("@/assets/images/icons/buttons/info.png");

/** Fixed width for badge type label so badge position is consistent across cells. */
export const BADGE_BUTTON_LABEL_WIDTH = 110;
/** Fixed width for badge (circle + sub-label) so all badges align in the same position. */
export const BADGE_BUTTON_BADGE_WIDTH = 80;

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
  const { infoIconBackground, infoIcon } =
    themeColors.button.nonstandard[BADGE_BUTTON_KEY] as BadgeButtonColors;

  const content = (
    <View style={styles.row}>
      <View style={[styles.labelRow, { width: BADGE_BUTTON_LABEL_WIDTH }]}>
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
          <Text style={[styles.typeLabel, { color: themeColors.text.secondary }]}>
            {badgeTypeLabel}
          </Text>
        </View>
      </View>
      <View style={[styles.badgeSlot, { width: BADGE_BUTTON_BADGE_WIDTH }]}>
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
    minHeight: 0,
  },
  pressed: {
    opacity: 0.88,
  },
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
    justifyContent: "center",
    alignItems: "center",
  },
  labelTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: "500",
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
