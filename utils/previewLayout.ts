import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { computeScalingTextMinFontSize } from "@/utils/scalingText";
import {
  computeStarRatingMetrics,
  STAR_RATING_MAX_FONT_SCALE,
} from "@/utils/starRatingLayout";

/** Matches {@link PagePreview} list layout (image + body + widest trailing column). */
const PAGE_PREVIEW_IMAGE_SIZE = 96;
const PAGE_PREVIEW_BODY_MARGIN_LEFT = 12;
const PAGE_PREVIEW_CARD_PADDING = 3;
const PAGE_PREVIEW_LIST_PADDING_H = 16;
const PAGE_PREVIEW_TRAILING_MAX_WIDTH = 8 + 48;

export function getPagePreviewBodyContentWidth(screenWidth: number): number {
  return Math.max(
    0,
    screenWidth
      - PAGE_PREVIEW_LIST_PADDING_H * 2
      - PAGE_PREVIEW_IMAGE_SIZE
      - PAGE_PREVIEW_BODY_MARGIN_LEFT
      - PAGE_PREVIEW_TRAILING_MAX_WIDTH
      - PAGE_PREVIEW_CARD_PADDING * 2,
  );
}

export const PREVIEW_TITLE_MAX_FONT_SIZE = 16;
export const PREVIEW_TITLE_SHRINK_RATIO = 0.75;
const PREVIEW_TITLE_SHRINK_RANGE_RATIO = 1 - PREVIEW_TITLE_SHRINK_RATIO;

export const PREVIEW_META_MAX_FONT_SIZE = 12;
/** Design min at fontScale 1 (10px); higher than route-preview meta for readability. */
const PREVIEW_META_SHRINK_RATIO = 8 / 12;
const PREVIEW_META_SHRINK_RANGE_RATIO = 1 - PREVIEW_META_SHRINK_RATIO;

export const PREVIEW_TITLE_MAX_LINES = 1;
export const PREVIEW_META_MAX_LINES = 2;
export const PREVIEW_TEXT_WIDTH_SAFETY_MARGIN = 4;
/** Minimum vertical gap between list preview rows (also the design gap at fontScale 1). */
export const PREVIEW_ITEM_GAP_MIN = 6;
/** Max accessibility scale for page preview star rows. */
export const PREVIEW_STAR_RATING_MAX_FONT_SCALE = STAR_RATING_MAX_FONT_SCALE;

export type PreviewTextMetrics = {
  fontScale: number;
  titleMaxFontSize: number;
  titleMinFontSize: number;
  metaMaxFontSize: number;
  metaMinFontSize: number;
  widthSafetyMargin: number;
  itemGap: number;
  starRatingSize: number;
  starRatingFontSize: number;
};

export function getPreviewItemGap(fontScale = 1): number {
  return Math.max(PREVIEW_ITEM_GAP_MIN, PREVIEW_ITEM_GAP_MIN * fontScale);
}

export function getPreviewTextMetrics(
  screenWidth: number,
  fontScale = 1,
): PreviewTextMetrics {
  const titleMaxFontSize = PREVIEW_TITLE_MAX_FONT_SIZE * fontScale;
  const titleMinFontSize = computeScalingTextMinFontSize(
    titleMaxFontSize,
    fontScale,
    PREVIEW_TITLE_SHRINK_RANGE_RATIO,
  );
  const metaMaxFontSize = PREVIEW_META_MAX_FONT_SIZE * fontScale;
  const metaMinFontSize = computeScalingTextMinFontSize(
    metaMaxFontSize,
    fontScale,
    PREVIEW_META_SHRINK_RANGE_RATIO,
  );
  const bodyContentWidth = getPagePreviewBodyContentWidth(screenWidth);
  const { size: starRatingSize, fontSize: starRatingFontSize } =
    computeStarRatingMetrics(
      bodyContentWidth,
      fontScale,
      PREVIEW_STAR_RATING_MAX_FONT_SCALE,
    );

  return {
    fontScale,
    titleMaxFontSize,
    titleMinFontSize,
    metaMaxFontSize,
    metaMinFontSize,
    widthSafetyMargin: PREVIEW_TEXT_WIDTH_SAFETY_MARGIN * fontScale,
    itemGap: getPreviewItemGap(fontScale),
    starRatingSize,
    starRatingFontSize,
  };
}

export function usePreviewTextMetrics(): PreviewTextMetrics {
  const { width, fontScale } = useWindowDimensions();
  return useMemo(
    () => getPreviewTextMetrics(width, fontScale),
    [width, fontScale],
  );
}
