import type { UiScaleProfile } from "@/constants/uiScale/types";
import { useText } from "@/context/TextContext";
import { resolveGlobalIconSizeScale, resolveScalingBounds } from "@/utils/resolvers";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export const PAGE_BADGE_CARD_PADDING = 20;
export const PAGE_BADGE_CELL_PADDING = 8;
/** Vertical gap between badge grid rows. */
export const PAGE_BADGE_ROW_GAP = 8;

const PAGE_BADGE_ROW_COUNT = 4;

const DESIGN_BADGE_SIZE = 56;
const DESIGN_BADGE_SLOT_WIDTH = 80;
const DESIGN_GRID_MIN_HEIGHT = 320;

/** Legacy fixed label + badge slot width per grid cell at design width. */
const DESIGN_CELL_CONTENT_MIN = 190;

/**
 * Fraction of the icon-size delta above/below 1× applied to page badge circles,
 * slots, grid height, and info icons. Lower = less growth at max accessibility.
 */
export const PAGE_BADGE_ICON_SCALE_STRENGTH = 0.15;

export function applyPageBadgeIconScaleStrength(
  iconSizeScale: number,
  strength = PAGE_BADGE_ICON_SCALE_STRENGTH,
): number {
  return 1 + (iconSizeScale - 1) * strength;
}

export type PageBadgeMetrics = {
  screenWidth: number;
  iconSizeScale: number;
  badgeSize: number;
  badgeSlotWidth: number;
  gridMinHeight: number;
  rowMinHeight: number;
  typeLabelCapHeight: number;
  badgeLabelFontSize: number;
};

export function getPageBadgeMetrics(
  screenWidth: number,
  fontScale: number,
  sizeProfile: UiScaleProfile,
): PageBadgeMetrics {
  const cellContentWidth =
    screenWidth / 2 - PAGE_BADGE_CELL_PADDING * 2;
  const layoutScale = Math.min(1, cellContentWidth / DESIGN_CELL_CONTENT_MIN);
  const resolvedIconSizeScale = resolveGlobalIconSizeScale(
    sizeProfile.global,
    fontScale,
  );
  const iconSizeScale = applyPageBadgeIconScaleStrength(resolvedIconSizeScale);
  const badgeSize = Math.round(
    DESIGN_BADGE_SIZE * layoutScale * iconSizeScale,
  );
  const badgeSlotWidth = Math.round(
    DESIGN_BADGE_SLOT_WIDTH * layoutScale * iconSizeScale,
  );
  const gridMinHeight =
    Math.round(DESIGN_GRID_MIN_HEIGHT * layoutScale * iconSizeScale) +
    (PAGE_BADGE_ROW_COUNT - 1) * PAGE_BADGE_ROW_GAP;
  const badgeLabelScale = badgeSize / DESIGN_BADGE_SIZE;
  const typeLabelCapHeight = resolveScalingBounds(
    sizeProfile.pageScreen.text.badgeTypeLabel,
    sizeProfile.global,
    fontScale,
  ).maxFontSize;
  const badgeLabelBase = resolveScalingBounds(
    sizeProfile.pageScreen.text.badgeLabel,
    sizeProfile.global,
    fontScale,
  ).maxFontSize;
  const badgeLabelFontSize = Math.max(
    10,
    Math.round(badgeLabelBase * badgeLabelScale),
  );

  return {
    screenWidth,
    iconSizeScale,
    badgeSize,
    badgeSlotWidth,
    gridMinHeight,
    rowMinHeight: gridMinHeight / 4,
    typeLabelCapHeight,
    badgeLabelFontSize,
  };
}

export function usePageBadgeMetrics(): PageBadgeMetrics {
  const { uiScale } = useText();
  const { width, fontScale } = useWindowDimensions();
  return useMemo(
    () => getPageBadgeMetrics(width, fontScale, uiScale),
    [width, fontScale, uiScale],
  );
}
