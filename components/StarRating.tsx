import { useColorTheme } from "@/context/ColorThemeContext";
import type { TypographySpec } from "@/constants/text/style/types";
import { useResolvedTypography } from "@/utils/resolvers";
import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle } from "react-native";

export type StarRatingProps = {
  rating: number;
  count: number;
  /** Star size in px. Default 16. */
  size?: number;
  /** Typography token for the numeric label (`X.X (N)`). */
  labelTypography: TypographySpec;
  /** Resolved label size in px (may be below token max when space is tight). */
  labelFontSize?: number;
  /**
   * When true, stars and label use {@link ThemeColors.placeholder} (e.g. skeleton rows).
   * When false, star outlines and filled portions use {@link ThemeColors.starRating};
   * label uses {@link ThemeColors.text.secondary}.
   */
  placeholderColor?: boolean;
  /** When false, label text uses the explicit `fontSize` from `textStyle` without system scaling. */
  allowFontScaling?: boolean;
  style?: React.ComponentProps<typeof View>["style"];
  textStyle?: StyleProp<TextStyle>;
};

const DEFAULT_SIZE = 16;

export function StarRating({
  rating,
  count,
  size = DEFAULT_SIZE,
  labelTypography,
  labelFontSize,
  placeholderColor = false,
  allowFontScaling = true,
  style,
  textStyle,
}: StarRatingProps) {
  const { placeholder, starRating, text } = useColorTheme();
  const labelTypographyStyle = useResolvedTypography(labelTypography);
  const starColor = placeholderColor ? placeholder : starRating;
  const labelColor = placeholderColor ? placeholder : text.secondary;

  const stars = Array.from({ length: 5 }, (_, i) => {
    const fill = Math.min(1, Math.max(0, rating - i));

    if (placeholderColor) {
      return (
        <View key={i} style={[styles.starCell, { width: size, height: size }]}>
          <FontAwesome5 name="star" size={size} color={starColor} />
        </View>
      );
    }

    return (
      <View key={i} style={[styles.starCell, { width: size, height: size }]}>
        <FontAwesome5 name="star" size={size} color={starColor} />
        {fill > 0 ? (
          <View
            style={[styles.starFillClip, { width: `${fill * 100}%`, height: size }]}
            pointerEvents="none"
          >
            <FontAwesome5 name="star" size={size} color={starColor} solid />
          </View>
        ) : null}
      </View>
    );
  });

  return (
    <View style={[styles.starRow, style]}>
      {stars}
      <Text
        allowFontScaling={allowFontScaling}
        style={[
          styles.ratingText,
          { color: labelColor },
          labelTypographyStyle,
          labelFontSize != null ? { fontSize: labelFontSize } : null,
          textStyle,
        ]}
      >
        {rating.toFixed(1)} ({count})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  starRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  starCell: {
    overflow: "hidden",
  },
  starFillClip: {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "hidden",
  },
  ratingText: {
    marginLeft: 8,
  },
});
