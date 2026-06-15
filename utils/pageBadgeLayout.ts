import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export const PAGE_BADGE_CARD_PADDING = 20;
export const PAGE_BADGE_CELL_PADDING = 8;

const DESIGN_BADGE_SIZE = 56;
const DESIGN_BADGE_SLOT_WIDTH = 80;
const DESIGN_GRID_MIN_HEIGHT = 320;
const DESIGN_TYPE_LABEL_FONT_SIZE = 13;
const DESIGN_BADGE_LABEL_FONT_SIZE = 11;

/** Legacy fixed label + badge slot width per grid cell at design width. */
const DESIGN_CELL_CONTENT_MIN = 190;

export type PageBadgeMetrics = {
  screenWidth: number;
  badgeSize: number;
  badgeSlotWidth: number;
  gridMinHeight: number;
  rowMinHeight: number;
  typeLabelFontSize: number;
  badgeLabelFontSize: number;
};

export function getPageBadgeMetrics(screenWidth: number): PageBadgeMetrics {
  const cellContentWidth =
    screenWidth / 2 - PAGE_BADGE_CELL_PADDING * 2;
  const scale = Math.min(1, cellContentWidth / DESIGN_CELL_CONTENT_MIN);

  const badgeSize = Math.round(DESIGN_BADGE_SIZE * scale);
  const badgeSlotWidth = Math.round(DESIGN_BADGE_SLOT_WIDTH * scale);
  const gridMinHeight = Math.round(DESIGN_GRID_MIN_HEIGHT * scale);
  const typeLabelFontSize = Math.max(
    11,
    Math.round(DESIGN_TYPE_LABEL_FONT_SIZE * scale),
  );
  const badgeLabelFontSize = Math.max(
    10,
    Math.round(DESIGN_BADGE_LABEL_FONT_SIZE * scale),
  );

  return {
    screenWidth,
    badgeSize,
    badgeSlotWidth,
    gridMinHeight,
    rowMinHeight: gridMinHeight / 4,
    typeLabelFontSize,
    badgeLabelFontSize,
  };
}

export function usePageBadgeMetrics(): PageBadgeMetrics {
  const { width } = useWindowDimensions();
  return useMemo(() => getPageBadgeMetrics(width), [width]);
}
