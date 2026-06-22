import type { UiScaleProfile, UiScaleProfileKey } from "./types";

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
} from "./types";
export { FontSizeStep } from "./types";

export {
  autoUiScaleProfile,
} from "./profiles/auto";
export {
  largeUiScaleProfile,
} from "./profiles/large";
export {
  mediumUiScaleProfile,
} from "./profiles/medium";
export {
  smallUiScaleProfile,
} from "./profiles/small";

import { autoUiScaleProfile } from "./profiles/auto";
import { largeUiScaleProfile } from "./profiles/large";
import { mediumUiScaleProfile } from "./profiles/medium";
import { smallUiScaleProfile } from "./profiles/small";

/**
 * UI scale profiles for app-controlled text and icon sizing. `Auto` follows system
 * accessibility scaling with medium token sizes; `Small`, `Medium`, and `Large` use fixed sizes.
 */
export const UI_SCALE_PROFILES: Record<UiScaleProfileKey, UiScaleProfile> = {
  Auto: autoUiScaleProfile,
  Small: smallUiScaleProfile,
  Medium: mediumUiScaleProfile,
  Large: largeUiScaleProfile,
};
