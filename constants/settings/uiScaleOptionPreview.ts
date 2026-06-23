import {
  autoUiScaleProfile,
  largeUiScaleProfile,
  mediumUiScaleProfile,
  smallUiScaleProfile,
} from "@/constants/uiScale";
import type {
  ConstantTextSizeSpec,
  UiScaleGlobal,
  UiScaleProfileKey,
} from "@/constants/uiScale/types";
import { FontSizeStep } from "@/constants/uiScale/types";

export type UiScaleOptionPreview = {
  labelSize: ConstantTextSizeSpec;
  global: UiScaleGlobal;
};

export const UI_SCALE_OPTION_PREVIEW: Record<
  UiScaleProfileKey,
  UiScaleOptionPreview
> = {
  Auto: {
    labelSize: { default: FontSizeStep.MEDIUM },
    global: autoUiScaleProfile.global,
  },
  Small: {
    labelSize: { default: FontSizeStep.SMALL },
    global: smallUiScaleProfile.global,
  },
  Medium: {
    labelSize: { default: FontSizeStep.MEDIUM },
    global: mediumUiScaleProfile.global,
  },
  Large: {
    labelSize: { default: FontSizeStep.LARGE },
    global: largeUiScaleProfile.global,
  },
};
