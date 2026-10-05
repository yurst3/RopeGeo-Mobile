import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { Image } from "expo-image";
import { useId, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, Rect } from "react-native-svg";

export const TIER_IMAGES = {
  bronze: require("@/assets/images/icons/profile/bronze.png"),
  silver: require("@/assets/images/icons/profile/silver.png"),
  gold: require("@/assets/images/icons/profile/gold.png"),
} as const;

const SPARKLE_IMAGES = {
  silver: require("@/assets/images/icons/profile/silverSparkle.png"),
  gold: require("@/assets/images/icons/profile/goldSparkle.png"),
} as const;

/** 1 matches the sparkle artwork. Increase to enlarge, decrease to shrink. */
const SPARKLE_SCALE = 1.5;
/** Nudge the sparkles. Positive x moves right, positive y moves down. */
const SPARKLE_OFFSET_X = -10;
const SPARKLE_OFFSET_Y = 11;

export type ProfileBadgeTier = keyof typeof TIER_IMAGES;

const DESIGN_BADGE_SIZE = 88;
/** Inner plate is smaller than the medal so the metal rim stays visible. */
const ICON_PLATE_RATIO = 0.8;
const ICON_SCALE = 0.58;
const SELECTION_BORDER_WIDTH = 2;
const LOCKED_OPACITY = 0.25;
const LOCK_ICON_RATIO = 0.32;
const PROGRESS_BAR_HEIGHT = 20;
const LOCKED_ICON = require("@/assets/images/icons/profile/locked.png");

export type ProfileBadgeProgress = {
  current: number;
  total: number;
};

export type ProfileBadgeProps = {
  tier: ProfileBadgeTier;
  icon: ImageSourcePropType;
  iconColor: string;
  iconBackgroundColor: string;
  title: string;
  description: string;
  selected?: boolean;
  onPress?: () => void;
  /** Locked badges cannot be selected. */
  locked?: boolean;
  progressBar?: ProfileBadgeProgress;
};

export function ProfileBadge({
  tier,
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  description,
  selected = false,
  onPress,
  locked = false,
  progressBar,
}: ProfileBadgeProps) {
  const { text, button } = useColorTheme();
  const highlightColor = button.standard.edit.iconHighlight ?? text.link;
  const textStyle = useTextStyle();
  const uiScale = useUiScale();
  const iconSizeScale = useResolvedIconSizeScale();
  const badgeSize = Math.round(DESIGN_BADGE_SIZE * iconSizeScale);
  const plateSize = Math.round(badgeSize * ICON_PLATE_RATIO);
  const iconSize = Math.round(plateSize * ICON_SCALE);
  const lockSize = Math.round(badgeSize * LOCK_ICON_RATIO);
  const canSelect = !locked && onPress != null;

  return (
    <Pressable
      style={[
        styles.badge,
        {
          borderColor: canSelect && selected ? highlightColor : "transparent",
        },
      ]}
      onPress={canSelect ? onPress : undefined}
      disabled={!canSelect}
      accessibilityRole={onPress != null ? "button" : "image"}
      accessibilityState={{ selected: canSelect && selected, disabled: locked }}
      accessibilityLabel={`${title}. ${description}`}
    >
      <View
        style={[
          styles.medal,
          { width: badgeSize, height: badgeSize },
        ]}
      >
        <View
          style={[styles.artwork, { opacity: locked ? LOCKED_OPACITY : 1 }]}
          pointerEvents="none"
        >
          <Image
            source={TIER_IMAGES[tier]}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            accessibilityElementsHidden
          />
          <View
            style={[
              styles.plate,
              {
                width: plateSize,
                height: plateSize,
                borderRadius: plateSize / 2,
                backgroundColor: iconBackgroundColor,
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
          {tier === "silver" || tier === "gold" ? (
            <Image
              source={SPARKLE_IMAGES[tier]}
              style={[
                StyleSheet.absoluteFill,
                {
                  transform: [
                    { scaleX: -SPARKLE_SCALE },
                    { scaleY: SPARKLE_SCALE },
                    { translateX: SPARKLE_OFFSET_X },
                    { translateY: SPARKLE_OFFSET_Y },
                  ],
                },
              ]}
              contentFit="contain"
              accessibilityElementsHidden
            />
          ) : null}
        </View>
        {locked ? (
          <Image
            source={LOCKED_ICON}
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: lockSize,
              height: lockSize,
              tintColor: text.primary,
            }}
            contentFit="contain"
            accessibilityLabel="Locked"
          />
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
      {progressBar != null ? (
        <BadgeProgressBar current={progressBar.current} total={progressBar.total} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    maxWidth: 148,
    borderWidth: SELECTION_BORDER_WIDTH,
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  medal: {
    alignItems: "center",
    justifyContent: "center",
  },
  artwork: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  plate: {
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
  progress: {
    alignSelf: "stretch",
    marginTop: 8,
    justifyContent: "center",
  },
  progressLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});

function BadgeProgressBar({ current, total }: { current: number; total: number }) {
  const { text, filter } = useColorTheme();
  const textStyle = useTextStyle();
  const uiScale = useUiScale();
  const iconSizeScale = useResolvedIconSizeScale();
  const height = Math.max(16, Math.round(PROGRESS_BAR_HEIGHT * iconSizeScale));
  const clipId = useId().replace(/:/g, "");
  const [width, setWidth] = useState(0);
  const progress =
    total <= 0 ? (current > 0 ? 1 : 0) : Math.min(1, Math.max(0, current / total));
  const filledWidth = width * progress;

  return (
    <View
      style={[styles.progress, { height }]}
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        setWidth((currentWidth) => (currentWidth === next ? currentWidth : next));
      }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: Math.min(current, total) }}
      accessibilityLabel={`${current} of ${total}`}
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <ClipPath id={clipId}>
              <Rect width={width} height={height} rx={height / 2} ry={height / 2} />
            </ClipPath>
          </Defs>
          <Rect
            width={width}
            height={height}
            rx={height / 2}
            ry={height / 2}
            fill={filter.slider.unfilledBar}
          />
          {filledWidth > 0 ? (
            <Rect
              width={filledWidth}
              height={height}
              fill={filter.slider.filledBar}
              clipPath={`url(#${clipId})`}
            />
          ) : null}
        </Svg>
      ) : null}
      <View style={styles.progressLabel} pointerEvents="none">
        <ConstantText
          size={uiScale.infoScreen.text.badgeLabel}
          typography={textStyle.pageScreen.badgeLabel}
          style={{ color: text.primary }}
          accessibilityElementsHidden
        >
          {current}/{total}
        </ConstantText>
      </View>
    </View>
  );
}
