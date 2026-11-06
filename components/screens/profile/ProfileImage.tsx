import { AVATAR_BADGE_CIRCLE_DIAMETER_RATIO } from "@/components/badges/profile/AvatarProfileBadge";
import { TIER_IMAGES } from "@/components/badges/profile/ProfileBadge";
import { AvatarReporter1 } from "@/components/badges/profile/Reporter1";
import { AvatarReporter2 } from "@/components/badges/profile/Reporter2";
import { AvatarReporter3 } from "@/components/badges/profile/Reporter3";
import {
  PROFILE_BADGE_TIER,
  type ProfileBadgeId,
} from "@/components/screens/profile/BadgesTab";
import type { ProfileImageLayout } from "@/constants/profile/profileImageLayout";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

const PROFILE_PIC = require("@/assets/images/temp/profilePic.png");
const EDIT_PROFILE_PIC_ICON = require("@/assets/images/icons/buttons/editProfilePic.png");
const WARNING_ICON = require("@/assets/images/temp/warning.png");
const SILVER_SPARKLE = require("@/assets/images/icons/profile/silverSparkle.png");
const GOLD_SPARKLE = require("@/assets/images/icons/profile/goldSparkle.png");
/** Unscaled avatar diameter. Callers use this with the icon size scale. */
export const PROFILE_IMAGE_DESIGN_SIZE = 160;
const DESIGN_AVATAR_SIZE = PROFILE_IMAGE_DESIGN_SIZE;
const DESIGN_EDIT_OVERLAY_ICON_SIZE = 56;
const DESIGN_WARNING_ICON_SIZE = 18;

export function ProfileImage({
  editing,
  selectedBadge,
  size,
  layout,
}: {
  editing: boolean;
  selectedBadge: ProfileBadgeId | null;
  /** Rendered size. Defaults to the profile header size. */
  size?: number;
  layout: ProfileImageLayout;
}) {
  const { image } = useColorTheme();
  const iconSizeScale = useResolvedIconSizeScale();
  const avatarSize = Math.round(DESIGN_AVATAR_SIZE * iconSizeScale);
  const frameSize = size ?? avatarSize;
  const frameScale = frameSize / avatarSize;
  const editOverlayIconSize = Math.round(DESIGN_EDIT_OVERLAY_ICON_SIZE * iconSizeScale);
  const warningIconSize = Math.round(DESIGN_WARNING_ICON_SIZE * iconSizeScale);
  const tier =
    selectedBadge == null || selectedBadge === "none"
      ? null
      : PROFILE_BADGE_TIER[selectedBadge];
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
          source={PROFILE_PIC}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessibilityLabel="Profile picture"
        />
        {editing ? (
          <View style={styles.editOverlay} pointerEvents="none">
            <View style={[styles.editScrim, { backgroundColor: image.profileEditScrim }]} />
            <Image
              source={EDIT_PROFILE_PIC_ICON}
              style={{
                width: editOverlayIconSize,
                height: editOverlayIconSize,
                tintColor: image.profileEditIcon,
              }}
              contentFit="contain"
              accessibilityLabel="Edit profile picture"
            />
            <View
              style={[styles.warningIcon, { marginBottom: editOverlayIconSize / 2 + 6 }]}
            >
              <Image
                source={WARNING_ICON}
                style={{ width: warningIconSize, height: warningIconSize }}
                contentFit="contain"
                accessibilityLabel="Not implemented"
              />
            </View>
          </View>
        ) : null}
      </View>
    </View>
    {selectedBadge != null && selectedBadge !== "none" ? (
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
        {selectedBadge === "reporter1" ? (
          <AvatarReporter1
            plateRatio={layout.badgePlateRatio}
            iconScale={layout.badgeIconScale}
            medalOnly
          />
        ) : null}
        {selectedBadge === "reporter2" ? (
          <AvatarReporter2
            plateRatio={layout.badgePlateRatio}
            iconScale={layout.badgeIconScale}
            medalOnly
          />
        ) : null}
        {selectedBadge === "reporter3" ? (
          <AvatarReporter3
            plateRatio={layout.badgePlateRatio}
            iconScale={layout.badgeIconScale}
            medalOnly
          />
        ) : null}
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

  if (frameScale === 1) {
    return frame;
  }

  return (
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
  editOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  editScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  warningIcon: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "50%",
    alignItems: "center",
  },
});
