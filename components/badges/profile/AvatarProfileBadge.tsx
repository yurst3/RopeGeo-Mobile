import type { ProfileBadgeProps } from "@/components/badges/profile/ProfileBadge";
import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

const TIER_IMAGES = {
  bronze: require("@/assets/images/icons/profile/bronzeSmall.png"),
  silver: require("@/assets/images/icons/profile/silverSmall.png"),
  gold: require("@/assets/images/icons/profile/goldSmall.png"),
} as const;

/** Circle center and diameter within the small medal images, as fractions of the canvas. */
const CIRCLE_CENTER_RATIO = 0.8086;
const CIRCLE_DIAMETER_RATIO = 0.38;
/** Inner plate is smaller than the medal so the metal rim stays visible. */
const ICON_PLATE_RATIO = 0.8;
const ICON_SCALE = 0.58;
const SELECTION_BORDER_WIDTH = 2;

export function AvatarProfileBadge({
  tier,
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  description,
  selected = false,
  onPress,
}: ProfileBadgeProps) {
  const { text, button } = useColorTheme();
  const highlightColor = button.standard.edit.iconHighlight ?? text.link;
  const textStyle = useTextStyle();
  const uiScale = useUiScale();
  const [medalSize, setMedalSize] = useState(0);
  const circleSize = medalSize * CIRCLE_DIAMETER_RATIO;
  const plateSize = circleSize * ICON_PLATE_RATIO;
  const iconSize = plateSize * ICON_SCALE;
  const plateOffset = medalSize * CIRCLE_CENTER_RATIO - plateSize / 2;

  return (
    <Pressable
      style={[
        styles.badge,
        {
          borderColor: selected ? highlightColor : "transparent",
        },
      ]}
      onPress={onPress}
      disabled={onPress == null}
      accessibilityRole={onPress != null ? "button" : "image"}
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${description}`}
    >
      <View
        style={styles.medal}
        onLayout={(event) => {
          const next = event.nativeEvent.layout.width;
          setMedalSize((current) => (current === next ? current : next));
        }}
      >
        <Image
          source={TIER_IMAGES[tier]}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          accessibilityElementsHidden
        />
        {medalSize > 0 ? (
          <View
            style={[
              styles.plate,
              {
                width: plateSize,
                height: plateSize,
                borderRadius: plateSize / 2,
                backgroundColor: iconBackgroundColor,
                left: plateOffset,
                top: plateOffset,
              },
            ]}
          >
            <Image
              source={icon}
              style={{ width: iconSize, height: iconSize }}
              contentFit="contain"
              tintColor={iconColor}
              accessibilityElementsHidden
            />
          </View>
        ) : null}
      </View>
      <ConstantText
        size={uiScale.filter.text.sectionTitle}
        typography={textStyle.pageScreen.title}
        style={[styles.title, { color: text.primary }]}
      >
        {title}
      </ConstantText>
      <ConstantText
        size={uiScale.infoScreen.text.badgeLabel}
        typography={textStyle.filter.optionSublabel}
        style={[styles.description, { color: text.secondary }]}
      >
        {description}
      </ConstantText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    width: "100%",
    borderWidth: SELECTION_BORDER_WIDTH,
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  medal: {
    width: "100%",
    aspectRatio: 1,
  },
  plate: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    alignSelf: "stretch",
    marginTop: 8,
    textAlign: "center",
  },
  description: {
    alignSelf: "stretch",
    marginTop: 2,
    textAlign: "center",
  },
});
