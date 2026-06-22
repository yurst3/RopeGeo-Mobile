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

/** Active UI scale + font profile pair with fixed typography styles. */
export type TextDefinition = {
  uiScaleProfileKey: UiScaleProfileKey;
  fontProfileKey: FontProfileKey;
  uiScale: UiScaleProfile;
  font: FontProfile;
  style: TextStyleProfile;
};

export function buildTextDefinition(
  uiScaleProfileKey: UiScaleProfileKey,
  fontProfileKey: FontProfileKey,
): TextDefinition {
  return {
    uiScaleProfileKey,
    fontProfileKey,
    uiScale: UI_SCALE_PROFILES[uiScaleProfileKey],
    font: FONT_PROFILES[fontProfileKey],
    style: TEXT_STYLE,
  };
}
