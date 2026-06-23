import { BADGE_BUTTON_KEY } from "@/constants/buttons";
import type { BadgeButtonColors } from "@/constants/colors/types";
import { ScalingText } from "@/components/text/ScalingText";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useTextStyle } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import { usePageBadgeMetrics } from "@/utils/pageBadgeLayout";
import { Image } from "expo-image";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

const INFO_ICON = require("@/assets/images/icons/buttons/info.png");

const DESIGN_INFO_ICON_WRAP_SIZE = 18;
const DESIGN_INFO_ICON_IMAGE_SIZE = 12;

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
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const { badgeSlotWidth, badgeSize, iconSizeScale } = usePageBadgeMetrics();
  const { infoIconBackground, infoIcon } =
    themeColors.button.nonstandard[BADGE_BUTTON_KEY] as BadgeButtonColors;

  const infoIconSizes = useMemo(
    () => ({
      wrap: Math.round(DESIGN_INFO_ICON_WRAP_SIZE * iconSizeScale),
      image: Math.round(DESIGN_INFO_ICON_IMAGE_SIZE * iconSizeScale),
    }),
    [iconSizeScale],
  );

  const content = (
    <View style={styles.row}>
      <View style={[styles.labelRow, { minHeight: badgeSize }]}>
        {onPress != null ? (
          <View
            style={[
              styles.infoIconWrap,
              {
                backgroundColor: infoIconBackground,
                width: infoIconSizes.wrap,
                height: infoIconSizes.wrap,
                borderRadius: infoIconSizes.wrap / 2,
              },
            ]}
          >
            <Image
              source={INFO_ICON}
              style={{
                width: infoIconSizes.image,
                height: infoIconSizes.image,
                tintColor: infoIcon,
              }}
              contentFit="contain"
            />
          </View>
        ) : null}
        <View style={styles.labelTextWrap}>
          <ScalingText
            size={uiScale.pageScreen.text.badgeTypeLabel}
            typography={textStyle.pageScreen.badgeTypeLabel}
            numberOfLines={2}
            ellipsizeMode="tail"
            avoidMidWordLineBreaks
            measure={{
              type: "lineCount",
              maxLinesAtMaxSize: 2,
              widthSafetyMargin: 2,
            }}
            style={{ color: themeColors.text.secondary }}
            containerStyle={styles.typeLabel}
          >
            {badgeTypeLabel}
          </ScalingText>
        </View>
      </View>
      <View style={[styles.badgeSlot, { width: badgeSlotWidth }]}>
        <View style={[styles.badgeWrap, { width: badgeSlotWidth }]}>
          {badge}
        </View>
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
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  labelTextWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  typeLabel: {
    alignSelf: "stretch",
    minWidth: 0,
    width: "100%",
    justifyContent: "center",
  },
  badgeSlot: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  badgeWrap: {
    alignItems: "center",
    overflow: "hidden",
  },
});
