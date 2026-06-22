import type {
  ScalingTextSizeSpec,
  UiScaleGlobal,
} from "@/constants/uiScale/types";
import { resolveGlobalIconSizeScale, resolveScalingBounds } from "@/utils/resolvers";

/** Matches {@link StarRating} label `marginLeft`. */
export const STAR_RATING_LABEL_GAP = 8;

/** Rough width of the rating label in star-size units (`"X.X (N)"`). */
const STAR_RATING_LABEL_WIDTH_FACTOR = 4.5;
const STAR_COUNT = 5;

export type StarRatingResolvedBounds = {
  maxFontSize: number;
  minFontSize: number;
};

export function resolveStarRatingIconBounds(
  spec: ScalingTextSizeSpec,
  global: UiScaleGlobal,
  fontScale: number,
): StarRatingResolvedBounds {
  const bounds = resolveScalingBounds(spec, global, fontScale);
  if (global.accessibilityScaling.enabled) {
    return bounds;
  }
  const iconScale = resolveGlobalIconSizeScale(global, fontScale);
  return {
    maxFontSize: Math.round(bounds.maxFontSize * iconScale),
    minFontSize: Math.round(bounds.minFontSize * iconScale),
  };
}

export function computeStarRatingMetrics(
  containerWidth: number,
  bounds: StarRatingResolvedBounds,
): { size: number; fontSize: number } {
  const targetStarSize = bounds.maxFontSize;
  const maxStarSizeFromWidth = Math.floor(
    (containerWidth - STAR_RATING_LABEL_GAP) /
      (STAR_COUNT + STAR_RATING_LABEL_WIDTH_FACTOR),
  );
  const size =
    maxStarSizeFromWidth > 0
      ? Math.min(targetStarSize, maxStarSizeFromWidth)
      : targetStarSize;

  if (size >= targetStarSize) {
    return { size, fontSize: bounds.maxFontSize };
  }

  const ratio = size / targetStarSize;
  const fontSize = Math.max(
    Math.round(bounds.minFontSize * ratio),
    Math.round(bounds.maxFontSize * ratio),
  );
  return { size, fontSize };
}
