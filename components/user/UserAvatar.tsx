import {
  AVATAR_BADGE_CIRCLE_DIAMETER_RATIO,
  AvatarProfileBadge,
} from "@/components/badges/profile/AvatarProfileBadge";
import { TIER_IMAGES } from "@/components/badges/profile/ProfileBadge";
import { ConstantText } from "@/components/text/ConstantText";
import type { ProfileImageLayout } from "@/constants/profile/profileImageLayout";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { Image } from "expo-image";
import type { ImageSourcePropType } from "react-native";
import { StyleSheet, View } from "react-native";
import type {
  UserAvatar as UserAvatarModel,
  UserAvatarBadgeIcon,
} from "ropegeo-common/models";

/** Stand-in photo until avatars carry a real profile image. */
const PLACEHOLDER_PROFILE_PIC = require("@/assets/images/temp/profilePic.png");
const SILVER_SPARKLE = require("@/assets/images/icons/profile/silverSparkle.png");
const GOLD_SPARKLE = require("@/assets/images/icons/profile/goldSparkle.png");
const BADGE_ICON_IMAGES: Record<UserAvatarBadgeIcon, ImageSourcePropType> = {
  tripReport: require("@/assets/images/icons/buttons/tripReport.png"),
};
/** Unscaled avatar diameter. Callers use this with the icon size scale. */
export const USER_AVATAR_DESIGN_SIZE = 160;

/**
 * A user's profile photo framed by their badge's medal, with the badge and sparkles, drawn from
 * a {@link UserAvatarModel}. Matches the profile screen's image outside edit mode.
 */
export function UserAvatar({
  avatar,
  showName,
  size,
  layout,
}: {
  avatar: UserAvatarModel;
  /** Shows the user's name centered below the image. */
  showName: boolean;
  /** Rendered size of the image. Defaults to the profile header size. */
  size?: number;
  layout: ProfileImageLayout;
}) {
  const { text, badge } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const iconSizeScale = useResolvedIconSizeScale();
  const avatarSize = Math.round(USER_AVATAR_DESIGN_SIZE * iconSizeScale);
  const frameSize = size ?? avatarSize;
  const frameScale = frameSize / avatarSize;
  const tier = avatar.badgeRank;
  const badgeIcon = avatar.badgeIcon;
  const photoSize = Math.round(avatarSize * layout.avatarPlateRatio);
  const badgeSize = Math.round(
    (avatarSize * layout.badgeAvatarRatio) / AVATAR_BADGE_CIRCLE_DIAMETER_RATIO,
  );

  const frame = (
    <View style={[styles.frame, { width: avatarSize, height: avatarSize }]}>
      <View
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          },
        ]}
      >
        {tier != null ? (
          <Image
            source={TIER_IMAGES[tier]}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            accessibilityElementsHidden
          />
        ) : null}
        <View
          style={[
            styles.photo,
            {
              width: photoSize,
              height: photoSize,
              borderRadius: photoSize / 2,
            },
          ]}
        >
          <Image
            source={avatar.profileImage ?? PLACEHOLDER_PROFILE_PIC}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityLabel={`${avatar.name}'s profile picture`}
          />
        </View>
      </View>
      {tier != null && badgeIcon != null ? (
        <View
          style={[
            styles.badgeOverlay,
            {
              width: badgeSize,
              height: badgeSize,
              transform: [
                { translateX: layout.badgeOffsetX },
                { translateY: layout.badgeOffsetY },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <AvatarProfileBadge
            tier={tier}
            icon={BADGE_ICON_IMAGES[badgeIcon]}
            iconColor={badge.profileIcon.icon}
            iconBackgroundColor={badge.profileIcon.background}
            title=""
            description=""
            plateRatio={layout.badgePlateRatio}
            iconScale={layout.badgeIconScale}
            medalOnly
          />
        </View>
      ) : null}
      {tier === "silver" || tier === "gold" ? (
        <Image
          source={tier === "silver" ? SILVER_SPARKLE : GOLD_SPARKLE}
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { scaleX: -layout.sparkleScale },
                { scaleY: layout.sparkleScale },
                { translateX: layout.sparkleOffsetX },
                { translateY: layout.sparkleOffsetY },
              ],
            },
          ]}
          contentFit="contain"
          pointerEvents="none"
          accessibilityElementsHidden
        />
      ) : null}
    </View>
  );

  const image =
    frameScale === 1 ? (
      frame
    ) : (
      <View style={{ width: frameSize, height: frameSize }} pointerEvents="box-none">
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: avatarSize,
            height: avatarSize,
            left: (frameSize - avatarSize) / 2,
            top: (frameSize - avatarSize) / 2,
            transform: [{ scale: frameScale }],
          }}
        >
          {frame}
        </View>
      </View>
    );

  if (!showName) {
    return image;
  }

  return (
    <View style={styles.withName}>
      {image}
      <ConstantText
        size={uiScale.filter.text.sectionTitle}
        typography={textStyle.pageScreen.title}
        style={[styles.name, { color: text.primary }]}
      >
        {avatar.name}
      </ConstantText>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "visible",
  },
  badgeOverlay: {
    position: "absolute",
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  avatar: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    overflow: "hidden",
  },
  withName: {
    alignItems: "center",
  },
  name: {
    marginTop: 4,
    textAlign: "center",
  },
});
