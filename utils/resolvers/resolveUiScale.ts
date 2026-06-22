import type { FontProfile } from "@/constants/text/font/types";
import type {
  AccessibilityScaling,
  ButtonScaleSpec,
  ConstantTextSizeSpec,
  FilterIconSizes,
  FontSizeStep,
  GlobalAccessibilityScaling,
  IconScaleSpec,
  ScalingTextSizeSpec,
  UiScaleGlobal,
} from "@/constants/uiScale/types";
import type { TypographySpec } from "@/constants/text/style/types";
import type { TextStyle } from "react-native";

export function clampDeviceFontScale(
  fontScale: number,
  scaling: AccessibilityScaling,
): number {
  const min = scaling.min ?? 0;
  const max = scaling.max ?? Number.POSITIVE_INFINITY;
  return Math.min(max, Math.max(min, fontScale));
}

export function resolveIconSizeScale(
  iconScale: number,
  fontScale: number,
  accessibilityScaling?: AccessibilityScaling,
  accessibilityScalingStrength = 1.0,
): number {
  if (accessibilityScaling?.enabled) {
    const clampedFontScale = clampDeviceFontScale(
      fontScale,
      accessibilityScaling,
    );
    const accessibilityMultiplier =
      1 + (clampedFontScale - 1) * accessibilityScalingStrength;
    return iconScale * accessibilityMultiplier;
  }
  return iconScale;
}

export function resolveIconScaleSpec(
  spec: IconScaleSpec,
  global: UiScaleGlobal,
  fontScale: number,
): number {
  return resolveIconSizeScale(
    spec.scale,
    fontScale,
    global.accessibilityScaling.enabled
      ? global.accessibilityScaling
      : undefined,
    spec.accessibilityScalingStrength ?? 1.0,
  );
}

export function resolveButtonBackgroundScale(
  spec: ButtonScaleSpec,
  global: UiScaleGlobal,
  fontScale: number,
): number {
  if (spec.background != null) {
    return resolveIconScaleSpec(spec.background, global, fontScale);
  }
  return 1;
}

export function resolveButtonIconScale(
  spec: ButtonScaleSpec,
  global: UiScaleGlobal,
  fontScale: number,
): number {
  if (spec.icon != null) {
    return resolveIconScaleSpec(spec.icon, global, fontScale);
  }
  return 1;
}

export function resolveButtonSelectableScale(
  spec: ButtonScaleSpec,
  global: UiScaleGlobal,
  fontScale: number,
): number {
  if (spec.selectable != null) {
    return resolveIconScaleSpec(spec.selectable, global, fontScale);
  }
  return 1;
}

export function resolveButtonSubtextBounds(
  spec: ButtonScaleSpec,
  global: UiScaleGlobal,
  fontScale: number,
): { maxFontSize: number; minFontSize: number } | undefined {
  if (spec.subtext == null) {
    return undefined;
  }
  return resolveScalingTextBounds(spec.subtext as ScalingTextSizeSpec, global, fontScale);
}

export function resolveButtonConstantSubtextSize(
  spec: ButtonScaleSpec,
  global: UiScaleGlobal,
  fontScale: number,
): number | undefined {
  if (spec.subtext == null) {
    return undefined;
  }
  return resolveConstantTextSize(spec.subtext as ConstantTextSizeSpec, global, fontScale);
}

export function resolveButtonTextBounds(
  spec: ButtonScaleSpec,
  global: UiScaleGlobal,
  fontScale: number,
): { maxFontSize: number; minFontSize: number } | undefined {
  if (spec.text == null) {
    return undefined;
  }
  return resolveScalingTextBounds(spec.text as ScalingTextSizeSpec, global, fontScale);
}

export function resolveButtonConstantTextSize(
  spec: ButtonScaleSpec,
  global: UiScaleGlobal,
  fontScale: number,
): number | undefined {
  if (spec.text == null) {
    return undefined;
  }
  return resolveConstantTextSize(spec.text as ConstantTextSizeSpec, global, fontScale);
}

export function resolveButtonDimensions(
  spec: ButtonScaleSpec,
  baseSize: number,
  global: UiScaleGlobal,
  fontScale: number,
  designIconScale = 1,
): { size: number; iconScale: number } {
  const backgroundScale = resolveButtonBackgroundScale(spec, global, fontScale);
  const profileIconScale = resolveButtonIconScale(spec, global, fontScale);
  return {
    size: Math.round(baseSize * backgroundScale),
    iconScale: designIconScale * profileIconScale,
  };
}

/** Resolves icon scale from {@link UiScaleGlobal} (badges, search bar, star ratings, etc.). */
export function resolveGlobalIconSizeScale(
  global: UiScaleGlobal,
  fontScale: number,
): number {
  if (
    !global.accessibilityScaling.enabled &&
    global.defaultIconScale == null
  ) {
    throw new Error(
      "UI scale profile global must enable accessibilityScaling or define defaultIconScale",
    );
  }
  return resolveIconSizeScale(
    global.defaultIconScale ?? 1.0,
    fontScale,
    global.accessibilityScaling.enabled
      ? global.accessibilityScaling
      : undefined,
    1.0,
  );
}

export function resolveMultiSliderThumbScale(
  filter: { icon: FilterIconSizes },
  global: UiScaleGlobal,
  fontScale: number,
): number {
  return resolveIconScaleSpec(
    filter.icon.multiSliderThumb,
    global,
    fontScale,
  );
}

function getEffectiveAccessibilityScaling(
  tokenScaling: AccessibilityScaling | undefined,
  global: UiScaleGlobal,
): GlobalAccessibilityScaling & AccessibilityScaling {
  return {
    ...global.accessibilityScaling,
    ...tokenScaling,
    enabled:
      tokenScaling?.enabled ?? global.accessibilityScaling.enabled,
  };
}

function fontSizeStepToPx(step: FontSizeStep): number {
  return step;
}

function clampPx(
  px: number,
  floor?: FontSizeStep,
  ceiling?: FontSizeStep,
): number {
  let result = px;
  if (floor != null) {
    result = Math.max(result, fontSizeStepToPx(floor));
  }
  if (ceiling != null) {
    result = Math.min(result, fontSizeStepToPx(ceiling));
  }
  return result;
}

function resolveScaledDefaultPx(
  defaultStep: FontSizeStep,
  scaling: AccessibilityScaling & { enabled: boolean },
  fontScale: number,
): number {
  const basePx = fontSizeStepToPx(defaultStep);
  if (!scaling.enabled) {
    return basePx;
  }
  return basePx * clampDeviceFontScale(fontScale, scaling);
}

export function resolveConstantTextSize(
  spec: ConstantTextSizeSpec,
  global: UiScaleGlobal,
  fontScale: number,
): number {
  const scaling = getEffectiveAccessibilityScaling(
    spec.accessibilityScaling,
    global,
  );
  const scaled = resolveScaledDefaultPx(spec.default, scaling, fontScale);
  return clampPx(scaled, spec.floor, spec.ceiling);
}

export function resolveScalingTextBounds(
  spec: ScalingTextSizeSpec,
  global: UiScaleGlobal,
  fontScale: number,
): { maxFontSize: number; minFontSize: number } {
  const scaling = getEffectiveAccessibilityScaling(
    spec.accessibilityScaling,
    global,
  );
  const maxFontSize = clampPx(
    resolveScaledDefaultPx(spec.default, scaling, fontScale),
    undefined,
    spec.ceiling,
  );

  let minFontSize: number;
  if (spec.computeFloorFromAccessibilityScaling) {
    const constant = spec.computedFloorConstant ?? fontSizeStepToPx(spec.default);
    minFontSize = constant * clampDeviceFontScale(fontScale, scaling);
  } else if (spec.floor != null) {
    minFontSize = fontSizeStepToPx(spec.floor);
  } else {
    minFontSize = maxFontSize;
  }

  minFontSize = Math.min(minFontSize, maxFontSize);
  return { maxFontSize, minFontSize };
}

export function resolveTypographyStyle(
  typography: TypographySpec,
  fontProfile: FontProfile,
): TextStyle {
  const slot = fontProfile[typography.fontSlot];
  const style: TextStyle = {
    fontWeight: typography.fontWeight,
    fontStyle: typography.fontStyle,
    textDecorationLine: typography.textDecorationLine,
    letterSpacing: typography.letterSpacing,
    lineHeight: typography.lineHeight,
    textTransform: typography.textTransform,
    textAlign: typography.textAlign,
  };
  if (slot.fontFamily != null) {
    style.fontFamily = slot.fontFamily;
  }
  return style;
}

/** @deprecated use {@link resolveConstantTextSize} */
export const resolveConstantSize = resolveConstantTextSize;
/** @deprecated use {@link resolveScalingTextBounds} */
export const resolveScalingBounds = resolveScalingTextBounds;
