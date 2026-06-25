import { UI_SCALE_PROFILES } from "@/constants/text";
import type { UiScaleProfile } from "@/constants/uiScale/types";
import type { TypographySpec } from "@/constants/text/style/types";
import {
  resolveButtonBackgroundScale,
  resolveButtonConstantTextSize,
  resolveButtonIconScale,
  resolveConstantTextSize,
  resolveTypographyStyle,
} from "@/utils/theme/resolvers";
import type { useTextFont } from "@/context/typography/TextContext";
import type { TextStyle } from "react-native";

export const SEARCH_BAR_PADDING_VERTICAL = 12;
export const SEARCH_BAR_PADDING_HORIZONTAL = 16;
export const SEARCH_BAR_GAP = 10;
/** Search glyph base size at medium profile (decoupled from text token). */
export const SEARCH_BAR_ICON_BASE_SIZE = 14;

export function getSearchBarMetrics(
  fontScale = 1,
  sizeProfile: UiScaleProfile = UI_SCALE_PROFILES.Auto,
) {
  const searchBarSpec = sizeProfile.map.buttons.searchBar;
  const fontSize =
    resolveButtonConstantTextSize(searchBarSpec, sizeProfile.global, fontScale) ??
    resolveConstantTextSize(
      { default: searchBarSpec.text?.default ?? 14 },
      sizeProfile.global,
      fontScale,
    );
  const backgroundScale = resolveButtonBackgroundScale(
    searchBarSpec,
    sizeProfile.global,
    fontScale,
  );
  const iconScale = resolveButtonIconScale(
    searchBarSpec,
    sizeProfile.global,
    fontScale,
  );
  const iconSize = SEARCH_BAR_ICON_BASE_SIZE * iconScale;
  const paddingVertical = SEARCH_BAR_PADDING_VERTICAL * backgroundScale;
  const paddingHorizontal = SEARCH_BAR_PADDING_HORIZONTAL * backgroundScale;
  const gap = SEARCH_BAR_GAP * backgroundScale;
  const height = Math.round(paddingVertical * 2 + fontSize);
  return {
    fontSize,
    iconSize,
    paddingVertical,
    paddingHorizontal,
    gap,
    height,
  };
}

export function getSearchBarTextStyle(
  typography: TypographySpec,
  fontProfile: ReturnType<typeof useTextFont>,
  sizeProfile: UiScaleProfile,
  fontScale: number,
  color: string,
): TextStyle {
  const searchBarSpec = sizeProfile.map.buttons.searchBar;
  const fontSize =
    resolveButtonConstantTextSize(searchBarSpec, sizeProfile.global, fontScale) ??
    14;
  return {
    ...resolveTypographyStyle(typography, fontProfile),
    fontSize,
    color,
    flex: 1,
    paddingVertical: 0,
    minWidth: 0,
  };
}

export function getSearchBarHeight(
  fontScale = 1,
  sizeProfile: UiScaleProfile = UI_SCALE_PROFILES.Auto,
): number {
  return getSearchBarMetrics(fontScale, sizeProfile).height;
}

/** Estimated height at default Dynamic Type scale (use {@link getSearchBarHeight} when `fontScale` ≠ 1). */
export const SEARCH_BAR_HEIGHT = getSearchBarHeight(1);
