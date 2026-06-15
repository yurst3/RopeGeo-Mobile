/**
 * Min font size derived from device fontScale. The shrink range widens slightly
 * above fontScale 1 but never drops below the design min/max ratio at fontScale 1.
 */
export function computeScalingTextMinFontSize(
  maxFontSize: number,
  fontScale: number,
  shrinkRangeRatio: number,
): number {
  const designMinScale = 1 - shrinkRangeRatio;
  const minScale = 1 - shrinkRangeRatio * fontScale;
  if (minScale >= 1) {
    return maxFontSize;
  }
  const clampedMinScale = Math.max(
    designMinScale,
    minScale > 0 ? minScale : designMinScale,
  );
  return maxFontSize * clampedMinScale;
}

/** Continuously scale font between min and max based on measured width at max size. */
export function computeScalingTextFontSizeFromWidth(
  containerWidth: number,
  fullTextWidthAtMax: number,
  {
    maxFontSize,
    minFontSize,
    widthSafetyMargin = 0,
  }: {
    maxFontSize: number;
    minFontSize: number;
    widthSafetyMargin?: number;
  },
): number {
  if (containerWidth <= 0 || fullTextWidthAtMax <= 0) {
    return maxFontSize;
  }
  if (fullTextWidthAtMax <= containerWidth) {
    return maxFontSize;
  }
  const availableWidth = Math.max(0, containerWidth - widthSafetyMargin);
  const scaled = (availableWidth / fullTextWidthAtMax) * maxFontSize;
  return Math.max(minFontSize, Math.min(maxFontSize, scaled));
}

/** Scale font when measured line count at max size exceeds the allowed lines. */
export function computeScalingTextFontSizeFromLineCount(
  lineCountAtMax: number,
  {
    maxFontSize,
    minFontSize,
    maxLinesAtMaxSize,
  }: {
    maxFontSize: number;
    minFontSize: number;
    maxLinesAtMaxSize: number;
  },
): number {
  if (lineCountAtMax <= 0) {
    return maxFontSize;
  }
  if (lineCountAtMax <= maxLinesAtMaxSize) {
    return maxFontSize;
  }
  const scaled =
    maxFontSize * (maxLinesAtMaxSize / lineCountAtMax);
  return Math.max(minFontSize, Math.min(maxFontSize, scaled));
}

export function measureUnconstrainedTextWidth(
  lines: { width: number }[],
): number {
  if (lines.length <= 1) {
    return lines[0]?.width ?? 0;
  }
  return lines.reduce((sum, line) => sum + line.width, 0);
}
