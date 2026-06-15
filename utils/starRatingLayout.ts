export const STAR_RATING_DESIGN_SIZE = 14;
export const STAR_RATING_DESIGN_FONT_SIZE = 12;
/** Matches {@link StarRating} label `marginLeft`. */
export const STAR_RATING_LABEL_GAP = 8;
/** Default max accessibility scale for star rows (stars + label). */
export const STAR_RATING_MAX_FONT_SCALE = 1.75;

export function computeStarRatingMetrics(
  containerWidth: number,
  fontScale: number,
  maxFontScale = STAR_RATING_MAX_FONT_SCALE,
): { size: number; fontSize: number } {
  const scale = Math.min(fontScale, maxFontScale);
  const scaledSize = STAR_RATING_DESIGN_SIZE * scale;
  let fontSize = STAR_RATING_DESIGN_FONT_SIZE * scale;
  // Reserve space for labels like "10.0 (999)".
  const labelReserve = fontSize * 4.5 + STAR_RATING_LABEL_GAP;
  const maxStarSize = Math.floor((containerWidth - labelReserve) / 5);
  let size =
    maxStarSize > 0 ? Math.min(scaledSize, maxStarSize) : scaledSize;
  if (size < scaledSize) {
    fontSize = Math.max(
      10,
      Math.round(fontSize * (size / scaledSize)),
    );
  }
  return { size, fontSize };
}
