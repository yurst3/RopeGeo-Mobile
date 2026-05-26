import type { ReactNode } from "react";
import type { ImageSourcePropType } from "react-native";
import { Image } from "expo-image";
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { useColorTheme } from "@/context/ColorThemeContext";

const SUB_RATIO = 2 / 5; // sub circle width : main circle width

const DEFAULT_SIZE = 56;

export type BadgeProps = {
  /** When omitted, only the colored circle is shown (no main icon). */
  icon?: ImageSourcePropType;
  backgroundColor: string;
  /** When omitted, the sub badge is not rendered. */
  subIcon?: ImageSourcePropType;
  size?: number;
  /** Multiplier for the main icon size. Default 1. */
  iconScale?: number;
  /** Multiplier for the sub icon size. Default 1. */
  subIconScale?: number;
  /** Optional label shown below the badge. */
  label?: string;
  /** Tint color for the main icon only. */
  iconColor?: string;
  /** Stroke color for main and sub circles when `outline` is true. */
  borderColor?: string;
  subBackgroundColor?: string;
  subIconColor?: string;
  /** When true (default), main and sub circles use a stroke border. */
  outline?: boolean;
};

const ICON_SCALE_FACTOR = 0.6 * 1.25;
const SUB_ICON_SCALE_FACTOR = 0.6 * 1.75;

export function Badge({
  icon,
  backgroundColor,
  subIcon,
  size = DEFAULT_SIZE,
  iconScale = 1,
  subIconScale = 1,
  label,
  iconColor,
  borderColor: borderColorProp,
  subBackgroundColor: subBackgroundColorProp,
  subIconColor: subIconColorProp,
  outline = true,
}: BadgeProps) {
  const themeColors = useColorTheme();
  const borderColor = borderColorProp ?? themeColors.badge.border;
  const subBackgroundColor =
    subBackgroundColorProp ?? themeColors.badge.subBadge.background;
  const subIconColor = subIconColorProp ?? themeColors.badge.subBadge.icon;

  const subSize = size * SUB_RATIO;
  const mainRadius = size / 2;
  const subRadius = subSize / 2;
  const iconSize = Math.round(size * ICON_SCALE_FACTOR * iconScale);
  const subIconSize =
    subIcon != null
      ? Math.round(subSize * SUB_ICON_SCALE_FACTOR * subIconScale)
      : 0;

  const circle = (
    <View
      style={[
        styles.mainCircle,
        outline
          ? [styles.mainCircleOutline, { borderColor }]
          : null,
        {
          width: size,
          height: size,
          borderRadius: mainRadius,
          backgroundColor,
        },
      ]}
    >
      {icon != null ? (
        <Image
          source={icon}
          style={[styles.mainIcon, { width: iconSize, height: iconSize }]}
          contentFit="contain"
          tintColor={iconColor}
        />
      ) : null}
      {subIcon != null && (
        <View
          style={[
            styles.sub,
            outline ? [styles.subOutline, { borderColor }] : null,
            {
              width: subSize,
              height: subSize,
              borderRadius: subRadius,
              right: -subSize / 7,
              bottom: -subSize / 7,
              backgroundColor: subBackgroundColor,
            },
          ]}
        >
          <Image
            source={subIcon}
            style={[styles.subIcon, { width: subIconSize, height: subIconSize }]}
            contentFit="contain"
            tintColor={subIconColor}
          />
        </View>
      )}
    </View>
  );

  if (label != null && label !== "") {
    return (
      <View style={styles.withLabel}>
        {circle}
        <Text style={[styles.label, { color: themeColors.text.secondary }]}>
          {label}
        </Text>
      </View>
    );
  }
  return circle;
}

const styles = StyleSheet.create({
  withLabel: {
    alignItems: "center",
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: DEFAULT_SIZE + 16,
  },
  mainCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  mainCircleOutline: {
    borderWidth: 1.5,
  },
  mainIcon: {},
  sub: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  subOutline: {
    borderWidth: 1.5,
  },
  subIcon: {},
});
