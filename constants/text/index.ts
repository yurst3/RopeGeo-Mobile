export type {
  AccessibilityScaling,
  BetaSectionButtonSizes,
  BetaSectionTextSizes,
  ButtonScaleSpec,
  ButtonTextSizeSpec,
  CommonButtonSizes,
  ConstantTextSizeSpec,
  FilterButtonSizes,
  FilterIconSizes,
  FilterTextSizes,
  GlobalAccessibilityScaling,
  IconScaleSpec,
  InfoScreenTextSizes,
  MapButtonSizes,
  MapTextSizes,
  PageScreenButtonSizes,
  PageScreenTextSizes,
  PreviewButtonSizes,
  PreviewIconSizes,
  PreviewTextSizes,
  RegionScreenTextSizes,
  ScalingTextSizeSpec,
  TabButtonSizes,
  ToastButtonSizes,
  ToastTextSizes,
  UiScaleGlobal,
  UiScaleProfile,
  UiScaleProfileKey,
} from "../uiScale";
export {
  FontSizeStep,
  UI_SCALE_PROFILES,
  autoUiScaleProfile,
  largeUiScaleProfile,
  mediumUiScaleProfile,
  smallUiScaleProfile,
} from "../uiScale";

export type {
  FontProfile,
  FontProfileKey,
  FontSlot,
  FontSlotDefinition,
} from "./font";
export { FONT_PROFILES } from "./font";

export type {
  BetaSectionTypography,
  ButtonTypography,
  FilterTypography,
  InfoScreenTypography,
  MapTypography,
  PageScreenTypography,
  PreviewTypography,
  RegionScreenTypography,
  TextStyleProfile,
  ToastTypography,
  TypographySpec,
} from "./style";
export { TEXT_STYLE } from "./style";

import type { FontProfile, FontProfileKey } from "./font";
import type { UiScaleProfile, UiScaleProfileKey } from "../uiScale";
import type { TextStyleProfile } from "./style";
import { FONT_PROFILES } from "./font";
import { UI_SCALE_PROFILES } from "../uiScale";
import { TEXT_STYLE } from "./style";

/** Active font profile with fixed typography styles. */
export type TextDefinition = {
  fontProfileKey: FontProfileKey;
  font: FontProfile;
  style: TextStyleProfile;
};

export function buildFontDefinition(fontProfileKey: FontProfileKey): TextDefinition {
  return {
    fontProfileKey,
    font: FONT_PROFILES[fontProfileKey],
    style: TEXT_STYLE,
  };
}

/** @deprecated Use {@link buildFontDefinition} and {@link UIScaleContext} separately. */
export function buildTextDefinition(
  uiScaleProfileKey: UiScaleProfileKey,
  fontProfileKey: FontProfileKey,
): TextDefinition & {
  uiScaleProfileKey: UiScaleProfileKey;
  uiScale: UiScaleProfile;
} {
  return {
    ...buildFontDefinition(fontProfileKey),
    uiScaleProfileKey,
    uiScale: UI_SCALE_PROFILES[uiScaleProfileKey],
  };
}
