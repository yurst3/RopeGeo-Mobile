import { TIER_IMAGES } from "@/components/badges/profile/ProfileBadge";
import { AvatarReporter1 } from "@/components/badges/profile/Reporter1";
import { AvatarReporter2 } from "@/components/badges/profile/Reporter2";
import { AvatarReporter3 } from "@/components/badges/profile/Reporter3";
import {
  PROFILE_BADGE_TIER,
  type ProfileBadgeId,
} from "@/components/screens/profile/BadgesTab";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

const PROFILE_PIC = require("@/assets/images/temp/profilePic.png");
const EDIT_PROFILE_PIC_ICON = require("@/assets/images/icons/buttons/editProfilePic.png");
const WARNING_ICON = require("@/assets/images/temp/warning.png");
const SILVER_SPARKLE = require("@/assets/images/icons/profile/silverSparkle.png");
const GOLD_SPARKLE = require("@/assets/images/icons/profile/goldSparkle.png");
const DESIGN_AVATAR_SIZE = 160;
/** Photo is smaller than the outline so the rim stays visible. */
const AVATAR_PLATE_RATIO = 0.9;
const DESIGN_EDIT_OVERLAY_ICON_SIZE = 56;
const DESIGN_WARNING_ICON_SIZE = 18;
/** Nudge the avatar badge. Positive x moves right, positive y moves down. */
const AVATAR_BADGE_OFFSET_X = 6;
const AVATAR_BADGE_OFFSET_Y = 6;
/** 1 matches the sparkle artwork. Increase to enlarge, decrease to shrink. */
const SPARKLE_SCALE = 1.4;
/** Nudge the sparkles. Positive x moves right, positive y moves down. */
const SPARKLE_OFFSET_X = -16;
const SPARKLE_OFFSET_Y = 16;

export function ProfileImage({
  editing,
  selectedBadge,
}: {
  editing: boolean;
  selectedBadge: ProfileBadgeId | null;
}) {
  const { image } = useColorTheme();
  const iconSizeScale = useResolvedIconSizeScale();
  const avatarSize = Math.round(DESIGN_AVATAR_SIZE * iconSizeScale);
  const editOverlayIconSize = Math.round(DESIGN_EDIT_OVERLAY_ICON_SIZE * iconSizeScale);
  const warningIconSize = Math.round(DESIGN_WARNING_ICON_SIZE * iconSizeScale);
  const tier =
    selectedBadge == null || selectedBadge === "none"
      ? null
      : PROFILE_BADGE_TIER[selectedBadge];
  const photoSize = Math.round(avatarSize * AVATAR_PLATE_RATIO);

  return (
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
            transform: [
              { translateX: AVATAR_BADGE_OFFSET_X },
              { translateY: AVATAR_BADGE_OFFSET_Y },
            ],
          },
        ]}
        pointerEvents="none"
      >
        {selectedBadge === "reporter1" ? <AvatarReporter1 /> : null}
        {selectedBadge === "reporter2" ? <AvatarReporter2 /> : null}
        {selectedBadge === "reporter3" ? <AvatarReporter3 /> : null}
      </View>
    ) : null}
    {tier === "silver" || tier === "gold" ? (
      <Image
        source={tier === "silver" ? SILVER_SPARKLE : GOLD_SPARKLE}
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
        pointerEvents="none"
        accessibilityElementsHidden
      />
    ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "visible",
  },
  badgeOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
