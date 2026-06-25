import type {
  PreviewIconSizes,
  UiScaleProfile,
  UiScaleGlobal,
} from "@/constants/uiScale/types";
import { useText } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import {
  resolveIconScaleSpec,
  resolveScalingBounds,
  resolvePreviewSpacingScale,
} from "@/utils/theme/resolvers";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import {
  computeStarRatingMetrics,
  resolveStarRatingIconBounds,
} from "@/utils/layout/starRatingLayout";

/** Matches {@link PagePreview} list layout (image + body + widest trailing column). */
const PAGE_PREVIEW_IMAGE_SIZE = 96;
const PAGE_PREVIEW_BODY_MARGIN_LEFT = 12;
const PAGE_PREVIEW_CARD_PADDING = 3;
const PAGE_PREVIEW_LIST_PADDING_H = 16;
/** Margin before the trailing source icon / download control beside meta lines. */
export const PAGE_PREVIEW_TRAILING_MARGIN = 8;
const PAGE_PREVIEW_TRAILING_INNER_WIDTH = 48;
/** Design size of {@link MiniDownloadButton} hit target. */
export const PREVIEW_DOWNLOAD_BUTTON_SIZE = 36;
/** Horizontal space reserved beside aka / location meta when a trailing control is shown. */
export function getPreviewMetaTrailingReserve(
  sourceIconCircleSize: number,
): number {
  return (
    PAGE_PREVIEW_TRAILING_MARGIN +
    Math.max(sourceIconCircleSize, PREVIEW_DOWNLOAD_BUTTON_SIZE)
  );
}
/** Legacy trailing reservation (margin + placeholder column slack). */
export const PAGE_PREVIEW_TRAILING_MAX_WIDTH =
  PAGE_PREVIEW_TRAILING_MARGIN + PAGE_PREVIEW_TRAILING_INNER_WIDTH;

export function getPagePreviewBodyContentWidth(
  screenWidth: number,
  trailingMaxWidth = PAGE_PREVIEW_TRAILING_MAX_WIDTH,
): number {
  return Math.max(
    0,
    screenWidth
      - PAGE_PREVIEW_LIST_PADDING_H * 2
      - PAGE_PREVIEW_IMAGE_SIZE
      - PAGE_PREVIEW_BODY_MARGIN_LEFT
      - trailingMaxWidth
      - PAGE_PREVIEW_CARD_PADDING * 2,
  );
}

export const PREVIEW_TITLE_MAX_LINES = 1;
export const PREVIEW_META_MAX_LINES = 2;
export const PREVIEW_TEXT_WIDTH_SAFETY_MARGIN = 4;
/** Leading indent before the "AKA:" label in list/route previews. */
export const PREVIEW_AKA_NAMES_TAB = "  ";

export function formatPreviewAkaLine(aka: string[]): string {
  return `${PREVIEW_AKA_NAMES_TAB}AKA: ${aka.join(", ")}`;
}

/** Extra height below title cap height for descenders (matches route preview placeholders). */
export const PREVIEW_TITLE_DESCENDER_PADDING = 2;
/** Skeleton meta bar height at fontScale 1. */
const PREVIEW_META_BAR_HEIGHT = 10;
const PREVIEW_BODY_ROW_GAP = 4;
/** Gap between skeleton text bars as a fraction of {@link PREVIEW_META_BAR_HEIGHT}. */
const PREVIEW_PLACEHOLDER_TEXT_ROW_GAP_RATIO = 0.45;
/** Matches {@link PagePreview} trailing source icon circle. */
const PREVIEW_SOURCE_ICON_CIRCLE_SIZE = 32;
/** Logo inside the trailing circle on {@link PagePreview}. */
const PREVIEW_SOURCE_ICON_INNER_SIZE = 22;
/** Logo inside the trailing circle on {@link RegionPreview}. */
const REGION_PREVIEW_SOURCE_ICON_INNER_SIZE = 18;
/** Circular badge on thumbnail when {@link PagePreview} shows mini download. */
const PREVIEW_IMAGE_SOURCE_ICON_OVERLAY_SIZE = 28;
/** Logo inside the thumbnail source overlay. */
const PREVIEW_IMAGE_SOURCE_ICON_INNER_SIZE = 18;
/** Circular region badge on {@link RegionPreview} thumbnail. */
const REGION_ICON_OVERLAY_SIZE = 28;
/** Map pin inside the region badge overlay. */
const REGION_ICON_INNER_SIZE = 18;
/** Missing-image placeholder on preview thumbnails. */
const PREVIEW_NO_IMAGE_ICON_SIZE = 36;
export const PREVIEW_SOURCE_ICON_COLUMN_WIDTH = 56;
export const PREVIEW_SOURCE_ICON_COLUMN_HEIGHT = 32;
/** Minimum vertical gap between list preview rows (also the design gap at fontScale 1). */
export const PREVIEW_ITEM_GAP_MIN = 6;

type PreviewIconScaleKey = "sourceIcon" | "imageSourceIcon" | "regionIcon";

export function resolvePreviewIconScale(
  iconSizes: PreviewIconSizes,
  iconKey: PreviewIconScaleKey,
  global: UiScaleGlobal,
  fontScale: number,
): number {
  return resolveIconScaleSpec(iconSizes[iconKey], global, fontScale);
}

export type PreviewLayoutMetrics = {
  fontScale: number;
  titleCapHeight: number;
  titleDescenderPadding: number;
  metaBarHeight: number;
  metaDotFontSize: number;
  bodyRowGap: number;
  /** Vertical gap between skeleton text bars; scales with meta line height. */
  placeholderTextRowGap: number;
  sourceIconCircleSize: number;
  sourceIconInnerSize: number;
  regionSourceIconInnerSize: number;
  imageSourceIconOverlaySize: number;
  imageSourceIconInnerSize: number;
  regionIconOverlaySize: number;
  regionIconInnerSize: number;
  noImageIconSize: number;
  sourceIconColumnWidth: number;
  sourceIconColumnHeight: number;
  widthSafetyMargin: number;
  metaTrailingReserve: number;
  itemGap: number;
  starRatingSize: number;
  starRatingFontSize: number;
};

export function getPreviewItemGap(spacingScale = 1): number {
  return Math.max(PREVIEW_ITEM_GAP_MIN, PREVIEW_ITEM_GAP_MIN * spacingScale);
}

export function getPreviewLayoutMetrics(
  screenWidth: number,
  fontScale: number,
  sizeProfile: UiScaleProfile,
): PreviewLayoutMetrics {
  const { global, preview } = sizeProfile;
  const sourceIconScale = resolvePreviewIconScale(
    preview.icon,
    "sourceIcon",
    global,
    fontScale,
  );
  const imageSourceIconScale = resolvePreviewIconScale(
    preview.icon,
    "imageSourceIcon",
    global,
    fontScale,
  );
  const regionIconScale = resolvePreviewIconScale(
    preview.icon,
    "regionIcon",
    global,
    fontScale,
  );
  const sourceIconCircleSize = Math.round(
    PREVIEW_SOURCE_ICON_CIRCLE_SIZE * sourceIconScale,
  );
  const sourceIconInnerSize = Math.round(
    PREVIEW_SOURCE_ICON_INNER_SIZE * sourceIconScale,
  );
  const regionSourceIconInnerSize = Math.round(
    REGION_PREVIEW_SOURCE_ICON_INNER_SIZE * sourceIconScale,
  );
  const imageSourceIconOverlaySize = Math.round(
    PREVIEW_IMAGE_SOURCE_ICON_OVERLAY_SIZE * imageSourceIconScale,
  );
  const imageSourceIconInnerSize = Math.round(
    PREVIEW_IMAGE_SOURCE_ICON_INNER_SIZE * imageSourceIconScale,
  );
  const regionIconOverlaySize = Math.round(
    REGION_ICON_OVERLAY_SIZE * regionIconScale,
  );
  const regionIconInnerSize = Math.round(
    REGION_ICON_INNER_SIZE * regionIconScale,
  );
  const noImageIconSize = Math.round(
    PREVIEW_NO_IMAGE_ICON_SIZE * imageSourceIconScale,
  );
  const sourceIconColumnWidth = Math.round(
    PREVIEW_SOURCE_ICON_COLUMN_WIDTH * sourceIconScale,
  );
  const sourceIconColumnHeight = Math.round(
    PREVIEW_SOURCE_ICON_COLUMN_HEIGHT * sourceIconScale,
  );
  const titleBounds = resolveScalingBounds(
    preview.text.title,
    global,
    fontScale,
  );
  const starRatingBounds = resolveStarRatingIconBounds(
    preview.text.starRating,
    global,
    fontScale,
  );

  const spacingScale = resolvePreviewSpacingScale(global, fontScale);
  const titleDescenderPadding = PREVIEW_TITLE_DESCENDER_PADDING * spacingScale;
  const metaBarHeight = PREVIEW_META_BAR_HEIGHT * spacingScale;
  const bodyRowGap = PREVIEW_BODY_ROW_GAP * spacingScale;
  const placeholderTextRowGap = Math.round(
    metaBarHeight * PREVIEW_PLACEHOLDER_TEXT_ROW_GAP_RATIO,
  );
  const metaTrailingReserve = getPreviewMetaTrailingReserve(
    sourceIconCircleSize,
  );
  const starRowContainerWidth = getPagePreviewBodyContentWidth(screenWidth, 0);
  const { size: starRatingSize, fontSize: starRatingFontSize } =
    computeStarRatingMetrics(starRowContainerWidth, starRatingBounds);

  return {
    fontScale,
    titleCapHeight: titleBounds.maxFontSize + titleDescenderPadding,
    titleDescenderPadding,
    metaBarHeight,
    metaDotFontSize: metaBarHeight,
    bodyRowGap,
    placeholderTextRowGap,
    sourceIconCircleSize,
    sourceIconInnerSize,
    regionSourceIconInnerSize,
    imageSourceIconOverlaySize,
    imageSourceIconInnerSize,
    regionIconOverlaySize,
    regionIconInnerSize,
    noImageIconSize,
    sourceIconColumnWidth,
    sourceIconColumnHeight,
    widthSafetyMargin: PREVIEW_TEXT_WIDTH_SAFETY_MARGIN * spacingScale,
    metaTrailingReserve,
    itemGap: getPreviewItemGap(spacingScale),
    starRatingSize,
    starRatingFontSize,
  };
}

/** @deprecated Use {@link PreviewLayoutMetrics}. */
export type PreviewTextMetrics = PreviewLayoutMetrics;

export function usePreviewLayoutMetrics(): PreviewLayoutMetrics {
  const uiScale = useUiScale();
  const { width, fontScale } = useWindowDimensions();
  return useMemo(
    () => getPreviewLayoutMetrics(width, fontScale, uiScale),
    [width, fontScale, uiScale],
  );
}

/** @deprecated Use {@link usePreviewLayoutMetrics}. */
export function usePreviewTextMetrics(): PreviewLayoutMetrics {
  return usePreviewLayoutMetrics();
}
