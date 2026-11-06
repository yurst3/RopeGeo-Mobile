/**
 * Manual layout knobs for a profile image.
 * Badge and sparkle offsets: positive x moves right, positive y moves down.
 * A sparkle scale of 1 matches the artwork.
 */
export type ProfileImageLayout = {
  /** Photo size relative to the medal. Smaller values leave more rim visible. */
  avatarPlateRatio: number;
  /** Badge icon plate size relative to the badge medal. Smaller values leave more rim visible. */
  badgePlateRatio: number;
  /** Badge icon size */
  badgeIconScale: number;
  /** Visible badge diameter relative to the avatar. 1 matches the avatar. */
  badgeAvatarRatio: number;
  badgeOffsetX: number;
  badgeOffsetY: number;
  sparkleScale: number;
  sparkleOffsetX: number;
  sparkleOffsetY: number;
};

export const PROFILE_SCREEN_IMAGE_LAYOUT: ProfileImageLayout = {
  avatarPlateRatio: 0.9,
  badgePlateRatio: 0.8,
  badgeIconScale: 1.2,
  badgeAvatarRatio: 0.38,
  badgeOffsetX: 6,
  badgeOffsetY: 6,
  sparkleScale: 1.4,
  sparkleOffsetX: -16,
  sparkleOffsetY: 16,
};

export const TRIP_REPORT_PREVIEW_IMAGE_LAYOUT: ProfileImageLayout = {
  avatarPlateRatio: 0.8,
  badgePlateRatio: 0.8,
  badgeIconScale: 1.3,
  badgeAvatarRatio: 0.45,
  badgeOffsetX: 6,
  badgeOffsetY: 6,
  sparkleScale: 1.4,
  sparkleOffsetX: -16,
  sparkleOffsetY: 16,
};
