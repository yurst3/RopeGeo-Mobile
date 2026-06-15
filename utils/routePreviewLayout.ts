import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { DEFAULT_BADGE_SIZE } from "@/components/badges/Badge";
import {
  computeScalingTextFontSizeFromLineCount,
  computeScalingTextFontSizeFromWidth,
  computeScalingTextMinFontSize,
} from "@/utils/scalingText";
import {
  computeStarRatingMetrics,
  STAR_RATING_MAX_FONT_SCALE,
} from "@/utils/starRatingLayout";

export const ROUTE_PREVIEW_CARD_MARGIN_H = 16;
export const ROUTE_PREVIEW_CARD_PADDING = 12;
export const ROUTE_PREVIEW_CARD_BORDER_RADIUS = 12;
export const ROUTE_PREVIEW_IMAGE_WIDTH_RATIO = 0.35;
export const ROUTE_PREVIEW_MAX_BADGES = 5;
export const ROUTE_PREVIEW_BADGE_GAP = 8;
export const ROUTE_PREVIEW_DEFAULT_BADGE_SCALE = 0.65;
/** Reserve space for sub-badge overhang on the trailing badge. */
export const ROUTE_PREVIEW_BADGE_WIDTH_SAFETY_MARGIN = 4;

const DESIGN_BADGE_LABEL_FONT_SIZE = 11;
/** Max accessibility scale applied to the preview star row (stars + label). */
export const ROUTE_PREVIEW_STAR_RATING_MAX_FONT_SCALE =
  STAR_RATING_MAX_FONT_SCALE;
/** Badges that must fit horizontally when font scale is at its preview maximum. */
export const ROUTE_PREVIEW_BADGE_MIN_VISIBLE_AT_MAX_SCALE = 3;

export const ROUTE_PREVIEW_TITLE_MAX_FONT_SIZE = 16;
/** @deprecated Use {@link ROUTE_PREVIEW_TITLE_MAX_FONT_SIZE}. */
export const ROUTE_PREVIEW_TITLE_FONT_SIZE = ROUTE_PREVIEW_TITLE_MAX_FONT_SIZE;
/** Min/max ratio at fontScale 1; used as a floor when shrink range exceeds device scale. */
export const ROUTE_PREVIEW_TITLE_SHRINK_RATIO = 0.75;
/** Shrink range as a fraction of max at fontScale 1: (max − min) / max. */
const ROUTE_PREVIEW_TITLE_SHRINK_RANGE_RATIO =
  1 - ROUTE_PREVIEW_TITLE_SHRINK_RATIO;
/** Reserve space so native layout does not exceed the clipped container. */
export const ROUTE_PREVIEW_TITLE_WIDTH_SAFETY_MARGIN = 4;
/** Extra space below the title for descenders (e.g. y, g). */
export const ROUTE_PREVIEW_TITLE_DESCENDER_PADDING = 2;
/** Vertical gap between all rows in the preview info column. */
export const ROUTE_PREVIEW_INFO_ROW_GAP = 4;

export const ROUTE_PREVIEW_LOCATION_FONT_SIZE = 12;
/** Min/max ratio at fontScale 1; used as a floor when shrink range exceeds device scale. */
const ROUTE_PREVIEW_LOCATION_SHRINK_RATIO = 8 / 12;
/** Shrink range as a fraction of max at fontScale 1: (max − min) / max. */
const ROUTE_PREVIEW_LOCATION_SHRINK_RANGE_RATIO =
  1 - ROUTE_PREVIEW_LOCATION_SHRINK_RATIO;
export const ROUTE_PREVIEW_LOCATION_WIDTH_SAFETY_MARGIN = 4;
export const ROUTE_PREVIEW_LOCATION_MAX_LINES = 2;

export type RoutePreviewMetrics = {
  screenWidth: number;
  fontScale: number;
  cardWidth: number;
  imageWidth: number;
  infoContentWidth: number;
  badgeSize: number;
  badgeGap: number;
  badgeLabelFontSize: number;
  /** Max badges that fit in the info column without horizontal clipping. */
  maxVisibleBadges: number;
  titleMaxFontSize: number;
  titleMinFontSize: number;
  titleDescenderPadding: number;
  titleWidthSafetyMargin: number;
  locationMaxFontSize: number;
  locationMinFontSize: number;
  locationWidthSafetyMargin: number;
  /** Negative margin so title descender padding + {@link ROUTE_PREVIEW_INFO_ROW_GAP} = visual row gap. */
  locationMarginTopAfterTitle: number;
  starRatingSize: number;
  starRatingFontSize: number;
  infoRowGap: number;
};

/**
 * @deprecated Use {@link computeScalingTextMinFontSize}.
 */
export function computeRoutePreviewMinFontSize(
  maxFontSize: number,
  fontScale: number,
  shrinkRangeRatio: number,
): number {
  return computeScalingTextMinFontSize(
    maxFontSize,
    fontScale,
    shrinkRangeRatio,
  );
}

function computeLegacyBadgeSize(infoContentWidth: number): number {
  const badgesNeeded =
    ROUTE_PREVIEW_MAX_BADGES * DEFAULT_BADGE_SIZE +
    (ROUTE_PREVIEW_MAX_BADGES - 1) * ROUTE_PREVIEW_BADGE_GAP;
  const scale = Math.min(
    ROUTE_PREVIEW_DEFAULT_BADGE_SCALE,
    infoContentWidth / badgesNeeded,
  );
  return Math.round(DEFAULT_BADGE_SIZE * scale);
}

/** How many badges of the given size fit in the row without clipping. */
export function countRoutePreviewBadgesThatFit(
  containerWidth: number,
  badgeSize: number,
  badgeGap: number,
  maxCount: number,
): number {
  if (containerWidth <= 0 || badgeSize <= 0) {
    return maxCount;
  }
  let fit = 0;
  for (let count = 1; count <= maxCount; count++) {
    const width = count * badgeSize + (count - 1) * badgeGap;
    if (width <= containerWidth) {
      fit = count;
    } else {
      break;
    }
  }
  return fit;
}

/** Highest font scale where at least `minVisible` badges fit in the info column. */
export function computeRoutePreviewBadgeMaxFontScale(
  infoContentWidth: number,
  minVisible = ROUTE_PREVIEW_BADGE_MIN_VISIBLE_AT_MAX_SCALE,
): number {
  if (infoContentWidth <= 0 || minVisible <= 0) {
    return 1;
  }

  const designBadgeSize =
    DEFAULT_BADGE_SIZE * ROUTE_PREVIEW_DEFAULT_BADGE_SCALE;
  let lo = 1;
  let hi = 3;

  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const badgeSize = Math.round(designBadgeSize * mid);
    const badgeGap = Math.max(
      4,
      Math.round(ROUTE_PREVIEW_BADGE_GAP * (badgeSize / designBadgeSize)),
    );
    const availableWidth = Math.max(
      0,
      infoContentWidth - ROUTE_PREVIEW_BADGE_WIDTH_SAFETY_MARGIN * mid,
    );
    const fit = countRoutePreviewBadgesThatFit(
      availableWidth,
      badgeSize,
      badgeGap,
      minVisible,
    );

    if (fit >= minVisible) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return lo;
}

function computeRoutePreviewBadgeLayout(
  infoContentWidth: number,
  fontScale: number,
): {
  badgeSize: number;
  badgeGap: number;
  maxVisibleBadges: number;
} {
  const designBadgeSize =
    DEFAULT_BADGE_SIZE * ROUTE_PREVIEW_DEFAULT_BADGE_SCALE;
  const maxFontScale = computeRoutePreviewBadgeMaxFontScale(infoContentWidth);
  const scaledFontScale = Math.min(fontScale, maxFontScale);
  let badgeSize = Math.round(designBadgeSize * scaledFontScale);
  let badgeGap = Math.max(
    4,
    Math.round(ROUTE_PREVIEW_BADGE_GAP * (badgeSize / designBadgeSize)),
  );
  let maxVisibleBadges = countRoutePreviewBadgesThatFit(
    Math.max(
      0,
      infoContentWidth -
        ROUTE_PREVIEW_BADGE_WIDTH_SAFETY_MARGIN * scaledFontScale,
    ),
    badgeSize,
    badgeGap,
    ROUTE_PREVIEW_MAX_BADGES,
  );

  if (maxVisibleBadges < ROUTE_PREVIEW_MAX_BADGES) {
    if (fontScale <= 1) {
      badgeSize = computeLegacyBadgeSize(infoContentWidth);
      const badgeScale = badgeSize / DEFAULT_BADGE_SIZE;
      badgeGap = Math.max(
        4,
        Math.round(ROUTE_PREVIEW_BADGE_GAP * badgeScale),
      );
      maxVisibleBadges = ROUTE_PREVIEW_MAX_BADGES;
    } else if (maxVisibleBadges === 0) {
      badgeSize = Math.min(badgeSize, infoContentWidth);
      maxVisibleBadges = badgeSize > 0 ? 1 : 0;
    }
  }

  return { badgeSize, badgeGap, maxVisibleBadges };
}

export function getRoutePreviewMetrics(
  screenWidth: number,
  fontScale = 1,
): RoutePreviewMetrics {
  const cardWidth = screenWidth - ROUTE_PREVIEW_CARD_MARGIN_H * 2;
  const imageWidth = cardWidth * ROUTE_PREVIEW_IMAGE_WIDTH_RATIO;
  const infoContentWidth =
    cardWidth - imageWidth - ROUTE_PREVIEW_CARD_PADDING * 2;
  const { badgeSize, badgeGap, maxVisibleBadges } =
    computeRoutePreviewBadgeLayout(infoContentWidth, fontScale);
  const badgeLabelFontSize = Math.max(
    10,
    Math.round(DESIGN_BADGE_LABEL_FONT_SIZE * (badgeSize / DEFAULT_BADGE_SIZE)),
  );
  const titleMaxFontSize = ROUTE_PREVIEW_TITLE_MAX_FONT_SIZE * fontScale;
  const titleMinFontSize = computeScalingTextMinFontSize(
    titleMaxFontSize,
    fontScale,
    ROUTE_PREVIEW_TITLE_SHRINK_RANGE_RATIO,
  );
  const titleDescenderPadding =
    ROUTE_PREVIEW_TITLE_DESCENDER_PADDING * fontScale;
  const titleWidthSafetyMargin =
    ROUTE_PREVIEW_TITLE_WIDTH_SAFETY_MARGIN * fontScale;
  const locationMaxFontSize = ROUTE_PREVIEW_LOCATION_FONT_SIZE * fontScale;
  const locationMinFontSize = computeScalingTextMinFontSize(
    locationMaxFontSize,
    fontScale,
    ROUTE_PREVIEW_LOCATION_SHRINK_RANGE_RATIO,
  );
  const locationWidthSafetyMargin =
    ROUTE_PREVIEW_LOCATION_WIDTH_SAFETY_MARGIN * fontScale;
  const locationMarginTopAfterTitle = -titleDescenderPadding;
  const { size: starRatingSize, fontSize: starRatingFontSize } =
    computeStarRatingMetrics(infoContentWidth, fontScale);
  const infoRowGap = ROUTE_PREVIEW_INFO_ROW_GAP * fontScale;

  return {
    screenWidth,
    fontScale,
    cardWidth,
    imageWidth,
    infoContentWidth,
    badgeSize,
    badgeGap,
    badgeLabelFontSize,
    maxVisibleBadges,
    titleMaxFontSize,
    titleMinFontSize,
    titleDescenderPadding,
    titleWidthSafetyMargin,
    locationMaxFontSize,
    locationMinFontSize,
    locationWidthSafetyMargin,
    locationMarginTopAfterTitle,
    starRatingSize,
    starRatingFontSize,
    infoRowGap,
  };
}

export function useRoutePreviewMetrics(): RoutePreviewMetrics {
  const { width, fontScale } = useWindowDimensions();
  return useMemo(
    () => getRoutePreviewMetrics(width, fontScale),
    [width, fontScale],
  );
}

/** @deprecated Use {@link computeScalingTextFontSizeFromWidth}. */
export function computeRoutePreviewTitleFontSize(
  containerWidth: number,
  fullTextWidthAtMax: number,
  options: {
    maxFontSize: number;
    minFontSize: number;
    widthSafetyMargin: number;
  },
): number {
  return computeScalingTextFontSizeFromWidth(
    containerWidth,
    fullTextWidthAtMax,
    options,
  );
}

/** @deprecated Use {@link computeScalingTextFontSizeFromLineCount}. */
export function computeRoutePreviewLocationFontSize(
  lineCountAtMax: number,
  {
    maxFontSize,
    minFontSize,
  }: {
    maxFontSize: number;
    minFontSize: number;
  },
): number {
  return computeScalingTextFontSizeFromLineCount(lineCountAtMax, {
    maxFontSize,
    minFontSize,
    maxLinesAtMaxSize: ROUTE_PREVIEW_LOCATION_MAX_LINES,
  });
}
